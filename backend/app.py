from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2
import torch
import os
from io import BytesIO
from PIL import Image
from typing import Optional, Tuple, Any, Dict

# Import inference utilities
from inference_utils import (
    infer_single_image,
    infer_images_sorted_by_score,
    body_yolo_model,
    face_yolo_model,
    beauty_scorer_model,
    image_transform,
    mask_transform,
    device
)

app = Flask(__name__)
CORS(app)

# Model paths configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATHS = {
    'body_model': os.path.join(BASE_DIR, 'models/body/best.pt'),
    'face_model': os.path.join(BASE_DIR, 'models/face/best.pt'),
    'scorer_model': os.path.join(BASE_DIR, 'models/scorer/best_camel_beauty_all_data_model.pth')
}

# Temporary upload directory
UPLOAD_FOLDER = '/tmp/camel_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def image_to_base64(image_array):
    """Convert numpy array to base64 string"""
    _, buffer = cv2.imencode('.png', image_array)
    return base64.b64encode(buffer).decode('utf-8')

def create_annotated_image(image_path, body_bbox, face_bbox=None):
    """Create annotated image with bounding boxes"""
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    if body_bbox:
        x1, y1, x2, y2 = body_bbox
        cv2.rectangle(image_rgb, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(image_rgb, "Body", (x1, y1 - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    if face_bbox:
        x1, y1, x2, y2 = face_bbox
        cv2.rectangle(image_rgb, (x1, y1), (x2, y2), (255, 0, 0), 3)
        cv2.putText(image_rgb, "Face", (x1, y1 - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

    return image_to_base64(cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR))

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'CamelBeauty ML API',
        'device': str(device),
        'models_loaded': True
    }), 200

@app.route('/api/v1/config/models', methods=['GET'])
def get_model_paths():
    """Get model paths configuration"""
    return jsonify({
        'success': True,
        'models': MODEL_PATHS
    }), 200

@app.route('/api/v1/detect/single', methods=['POST'])
def detect_single():
    """Single image beauty detection"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Empty filename'}), 400

        # Save uploaded file
        temp_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(temp_path)

        # Run inference
        body_bbox, result = infer_single_image(
            image_path=temp_path,
            body_yolo_model=body_yolo_model,
            face_yolo_model=face_yolo_model,
            beauty_scorer_model=beauty_scorer_model,
            image_transform=image_transform,
            mask_transform=mask_transform,
            device=device
        )

        if body_bbox is None or result is None:
            os.remove(temp_path)
            return jsonify({
                'success': False,
                'error': 'No camel body detected in the image'
            }), 400

        # Create annotated image
        image_b64 = create_annotated_image(temp_path, body_bbox, None)

        # Prepare response
        response = {
            'success': True,
            'body_bbox': list(body_bbox),
            'face_bbox': None,
            'results': result,
            'image_base64': image_b64
        }

        # Cleanup
        os.remove(temp_path)
        return jsonify(response), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Inference error: {str(e)}'
        }), 500

@app.route('/api/v1/detect/batch', methods=['POST'])
def detect_batch():
    """Batch images detection with sorting"""
    try:
        if 'images' not in request.files:
            return jsonify({'success': False, 'error': 'No images provided'}), 400

        files = request.files.getlist('images')
        if len(files) == 0:
            return jsonify({'success': False, 'error': 'No images in request'}), 400

        temp_paths = []

        # Save all uploaded files
        for idx, file in enumerate(files):
            if file.filename == '':
                continue
            temp_path = os.path.join(UPLOAD_FOLDER, f'batch_{idx}_{file.filename}')
            file.save(temp_path)
            temp_paths.append(temp_path)

        if len(temp_paths) == 0:
            return jsonify({'success': False, 'error': 'No valid images uploaded'}), 400

        # Run batch inference (returns sorted results)
        bboxes_sorted, results_sorted = infer_images_sorted_by_score(
            image_paths=temp_paths,
            body_yolo_model=body_yolo_model,
            face_yolo_model=face_yolo_model,
            beauty_scorer_model=beauty_scorer_model,
            image_transform=image_transform,
            mask_transform=mask_transform,
            device=device
        )

        # Prepare response
        batch_results = []
        for rank, (bbox, result, path) in enumerate(
            zip(bboxes_sorted, results_sorted, temp_paths[:len(bboxes_sorted)]), 1
        ):
            image_b64 = create_annotated_image(path, bbox, None)
            batch_results.append({
                'image_id': f'camel_{rank:03d}',
                'body_bbox': list(bbox),
                'face_bbox': None,
                'results': result,
                'rank': rank,
                'image_base64': image_b64
            })

        # Cleanup
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)

        return jsonify({
            'success': True,
            'total_images': len(files),
            'successful': len(batch_results),
            'failed': len(files) - len(batch_results),
            'results': batch_results
        }), 200

    except Exception as e:
        # Cleanup on error
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)

        return jsonify({
            'success': False,
            'error': f'Batch inference error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("CamelBeauty ML API Server")
    print("=" * 60)
    print(f"Device: {device}")
    print(f"Models loaded successfully")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
