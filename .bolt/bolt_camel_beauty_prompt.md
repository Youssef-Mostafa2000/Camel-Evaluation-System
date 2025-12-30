# COMPREHENSIVE BOLT CAMEL BEAUTY WEBSITE PROMPT WITH BACKEND INTEGRATION

You are building a professional, production-ready full-stack web application called "CamelBeauty" with **complete Python backend integration** for AI-powered camel beauty detection.

=================================================================================
CRITICAL: BACKEND INTEGRATION WITH PYTHON INFERENCE
=================================================================================

The website will integrate with a Python Flask/FastAPI backend that uses the provided inference_utils.py file.
This backend handles all ML model processing, camel beauty scoring, and batch image processing.

BACKEND API ENDPOINTS (Python Flask/FastAPI):
```python
# Endpoint 1: Single Image Beauty Detection
POST /api/v1/detect/single
Request:
{
  "image": <multipart file upload>,
  "model_paths": {
    "body_model": "/path/to/best_body_model.pt",
    "face_model": "/path/to/best_face_model.pt",
    "scorer_model": "/path/to/best_camel_beauty_model.pth"
  }
}

Response:
{
  "success": true,
  "body_bbox": [x1, y1, x2, y2],
  "face_bbox": [x1, y1, x2, y2] or null,
  "results": {
    "scores_dict": {
      "head_beauty_score": {
        "score_0_100": 95.5,
        "label_ar": "جمال الرأس",
        "label_en": "Head Beauty"
      },
      "neck_beauty_score": {
        "score_0_100": 92.3,
        "label_ar": "جمال الرقبة",
        "label_en": "Neck Beauty"
      },
      "body_limb_hump_beauty_score": {
        "score_0_100": 98.1,
        "label_ar": "جمال الجسم والأطراف والسنام",
        "label_en": "Body, Limbs & Hump"
      },
      "body_size_beauty_score": {
        "score_0_100": 89.7,
        "label_ar": "جمال ضخامة الجسم",
        "label_en": "Body Size Beauty"
      },
      "category_encoded": {
        "predicted_class": 0,
        "predicted_label": "Beautiful",
        "probs": [0.95, 0.05],
        "label_ar": "الفئة"
      }
    },
    "total_score_0_100": 93.9,
    "star_rating_0_5": 4.695
  },
  "image_base64": "<base64_encoded_image>"
}


# Endpoint 2: Batch Images Detection with Sorting
POST /api/v1/detect/batch
Request:
{
  "images": [<multipart file uploads>],
  "model_paths": {
    "body_model": "/path/to/best_body_model.pt",
    "face_model": "/path/to/best_face_model.pt",
    "scorer_model": "/path/to/best_camel_beauty_model.pth"
  }
}

Response:
{
  "success": true,
  "total_images": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "image_id": "camel_001",
      "body_bbox": [x1, y1, x2, y2],
      "face_bbox": [x1, y1, x2, y2] or null,
      "results": { ...same as single detection },
      "rank": 1,
      "image_base64": "<base64_encoded_image>"
    },
    {
      "image_id": "camel_002",
      "body_bbox": [x1, y1, x2, y2],
      "results": { ...same as single detection },
      "rank": 2,
      "image_base64": "<base64_encoded_image>"
    },
    {
      "image_id": "camel_003",
      "body_bbox": [x1, y1, x2, y2],
      "results": { ...same as single detection },
      "rank": 3,
      "image_base64": "<base64_encoded_image>"
    }
  ]
  // Sorted from highest total_score to lowest
}


# Endpoint 3: Get Model Paths Configuration
GET /api/v1/config/models
Response:
{
  "success": true,
  "models": {
    "body_model": "/content/runs/segment/train_Body_mosaic_0.6/weights/best.pt",
    "face_model": "/content/runs/segment/train_Face_mosaic_0.6/weights/best.pt",
    "scorer_model": "/content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth"
  }
}
```

=================================================================================
PART 1: CAMEL BEAUTY DETECTION FEATURE (COMPLETE INTEGRATION)
=================================================================================

SINGLE IMAGE DETECTION PAGE:

Component: BeautyDetectionPage.tsx
- Drag-and-drop upload zone with visual feedback
- File validation (JPG, PNG, WebP max 5MB)
- Real-time upload progress indicator
- Image preview before processing
- API call to /api/v1/detect/single
- Display results with beautiful scoring visualization

RESULTS DISPLAY COMPONENT:

Component: BeautyResultsCard.tsx
Displays:
1. Original image with bounding boxes (body in green, face in red)
2. Overall Beauty Score:
   - Large number display (0-100)
   - 5-star rating visualization (0-5 stars)
   - Category badge (Beautiful = Green, Ugly = Red)
3. Individual Attribute Cards (4 cards in grid):
   
   CARD 1 - Head Beauty:
   - Gauge chart (0-100) with color coding
   - Score: 95.5/100
   - Arabic: جمال الرأس
   
   CARD 2 - Neck Beauty:
   - Gauge chart (0-100)
   - Score: 92.3/100
   - Arabic: جمال الرقبة
   
   CARD 3 - Body, Limbs & Hump:
   - Gauge chart (0-100)
   - Score: 98.1/100
   - Arabic: جمال الجسم والأطراف والسنام
   
   CARD 4 - Body Size Beauty:
   - Gauge chart (0-100)
   - Score: 89.7/100
   - Arabic: جمال ضخامة الجسم

4. Export Options:
   - PDF Report
   - JSON Data
   - PNG Image

BATCH UPLOAD FEATURE:

Component: BatchBeautyDetection.tsx
- Upload 1-50 images simultaneously
- File validation for all
- Progress bar showing total completion
- Real-time individual image processing status
- API call to /api/v1/detect/batch

Results Display:
- Grid view sorted by score (highest → lowest)
- Each card shows:
  * Rank badge (1st, 2nd, 3rd, etc.)
  * Thumbnail image
  * Overall score (0-100)
  * Star rating (0-5)
  * Total score display prominently
  * Quick view button for details
- Sortable table view alternative
- Bulk export as ZIP

CODE EXAMPLE FOR FRONTEND:

```typescript
// BeautyDetectionPage.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Toast, Button, ProgressBar, Card } from '@/components/ui';

interface BeautyResult {
  body_bbox: [number, number, number, number];
  face_bbox: [number, number, number, number] | null;
  results: {
    scores_dict: {
      head_beauty_score: { score_0_100: number; label_ar: string };
      neck_beauty_score: { score_0_100: number; label_ar: string };
      body_limb_hump_beauty_score: { score_0_100: number; label_ar: string };
      body_size_beauty_score: { score_0_100: number; label_ar: string };
      category_encoded: {
        predicted_label: 'Beautiful' | 'Ugly';
        probs: [number, number];
      };
    };
    total_score_0_100: number;
    star_rating_0_5: number;
  };
  image_base64: string;
}

export default function BeautyDetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BeautyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', uploadedFile);

    try {
      const response = await axios.post('/api/v1/detect/single', formData);
      if (response.data.success) {
        setResult(response.data);
        Toast.success('جمال الإبل تم اكتشافه بنجاح! / Detection completed!');
      }
    } catch (err) {
      setError('خطأ في المعالجة / Error processing image');
      Toast.error('Failed to detect camel beauty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-sand-50 to-cream-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-brown-700 mb-2">
          اكتشف جمال إبلك
        </h1>
        <h2 className="text-3xl font-bold text-center text-brown-600 mb-12">
          Discover Your Camel's Beauty
        </h2>

        {!result ? (
          <DragDropUpload onFileSelect={handleFileUpload} loading={loading} />
        ) : (
          <BeautyResultsDisplay result={result} onReset={() => setResult(null)} />
        )}
      </div>
    </div>
  );
}

// BeautyResultsDisplay Component
function BeautyResultsDisplay({ result, onReset }: { result: BeautyResult; onReset: () => void }) {
  const scores = result.results.scores_dict;
  const totalScore = result.results.total_score_0_100;
  const starRating = result.results.star_rating_0_5;

  return (
    <div className="space-y-8">
      {/* Image with bounding boxes */}
      <Card className="p-6">
        <img
          src={`data:image/png;base64,${result.image_base64}`}
          alt="Camel Beauty Detection"
          className="w-full rounded-lg shadow-lg"
        />
      </Card>

      {/* Overall Score Section */}
      <Card className="p-8 bg-gradient-to-r from-gold-400 to-gold-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {/* Total Score */}
          <div>
            <p className="text-white text-lg font-semibold mb-2">الدرجة الإجمالية</p>
            <div className="text-6xl font-bold text-white">{totalScore.toFixed(1)}</div>
            <p className="text-white text-sm">out of 100</p>
          </div>

          {/* Star Rating */}
          <div>
            <p className="text-white text-lg font-semibold mb-2">التقييم بالنجوم</p>
            <div className="text-6xl font-bold text-white">{starRating.toFixed(1)}</div>
            <div className="flex justify-center mt-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-3xl ${i < Math.floor(starRating) ? '⭐' : '☆'}`} />
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p className="text-white text-lg font-semibold mb-2">الفئة</p>
            <div
              className={`text-4xl font-bold px-6 py-3 rounded-lg inline-block ${
                scores.category_encoded.predicted_label === 'Beautiful'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {scores.category_encoded.predicted_label}
            </div>
          </div>
        </div>
      </Card>

      {/* Individual Attribute Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AttributeCard
          label="Head Beauty"
          labelAr="جمال الرأس"
          score={scores.head_beauty_score.score_0_100}
        />
        <AttributeCard
          label="Neck Beauty"
          labelAr="جمال الرقبة"
          score={scores.neck_beauty_score.score_0_100}
        />
        <AttributeCard
          label="Body, Limbs & Hump"
          labelAr="جمال الجسم والأطراف والسنام"
          score={scores.body_limb_hump_beauty_score.score_0_100}
        />
        <AttributeCard
          label="Body Size"
          labelAr="جمال ضخامة الجسم"
          score={scores.body_size_beauty_score.score_0_100}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button className="bg-blue-600 hover:bg-blue-700">📥 PDF Report</Button>
        <Button className="bg-green-600 hover:bg-green-700">📊 JSON Data</Button>
        <Button className="bg-purple-600 hover:bg-purple-700">🖼️ Export Image</Button>
        <Button className="bg-gray-600 hover:bg-gray-700" onClick={onReset}>
          🔄 Upload Another
        </Button>
      </div>
    </div>
  );
}

// AttributeCard Component
interface AttributeCardProps {
  label: string;
  labelAr: string;
  score: number;
}

function AttributeCard({ label, labelAr, score }: AttributeCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card className={`p-6 text-center ${getScoreColor(score)}`}>
      <p className="text-sm font-semibold text-gray-600 mb-1">{labelAr}</p>
      <p className="text-xs text-gray-500 mb-4">{label}</p>
      
      {/* Gauge Chart */}
      <div className="mb-4">
        <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Score Display */}
      <div className="text-4xl font-bold">{score.toFixed(1)}</div>
      <p className="text-xs text-gray-600">out of 100</p>
    </Card>
  );
}
```

BATCH DETECTION EXAMPLE:

```typescript
// BatchBeautyDetection.tsx
export default function BatchBeautyDetection() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleBatchUpload = async (uploadedFiles: File[]) => {
    setLoading(true);
    setProgress(0);
    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await axios.post('/api/v1/detect/batch', formData, {
        onUploadProgress: (progressEvent) => {
          setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        },
      });

      if (response.data.success) {
        // Results already sorted from highest to lowest score
        setResults(response.data.results);
        Toast.success(`تم اكتشاف ${response.data.successful} من ${response.data.total_images} إبل`);
      }
    } catch (err) {
      Toast.error('Failed to process batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-sand-50 to-cream-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          تحليل مجموعة إبل / Batch Camel Analysis
        </h1>

        {results.length === 0 ? (
          <BatchUploadZone onFilesSelect={handleBatchUpload} loading={loading} progress={progress} />
        ) : (
          <BatchResultsGrid results={results} />
        )}
      </div>
    </div>
  );
}

// BatchResultsGrid Component
function BatchResultsGrid({ results }: { results: any[] }) {
  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Camels" value={results.length} icon="📊" />
        <StatCard label="Average Score" value={
          (results.reduce((sum, r) => sum + r.results.total_score_0_100, 0) / results.length).toFixed(1)
        } icon="⭐" />
        <StatCard label="Highest Score" value={
          Math.max(...results.map(r => r.results.total_score_0_100)).toFixed(1)
        } icon="👑" />
        <StatCard label="Lowest Score" value={
          Math.min(...results.map(r => r.results.total_score_0_100)).toFixed(1)
        } icon="📉" />
      </div>

      {/* Results Grid - Sorted by Score High to Low */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
            {/* Rank Badge */}
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-gold-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                #{result.rank}
              </div>
            </div>

            {/* Image */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              <img
                src={`data:image/png;base64,${result.image_base64}`}
                alt={`Camel ${result.rank}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Score Display */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Overall Score</p>
                  <p className="text-3xl font-bold text-brown-700">
                    {result.results.total_score_0_100.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">/100</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-3xl font-bold text-gold-500">
                    {result.results.star_rating_0_5.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">/5</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center mb-4 gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < Math.floor(result.results.star_rating_0_5) ? '⭐' : '☆'
                    }`}
                  />
                ))}
              </div>

              {/* Category Badge */}
              <div className="text-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                    result.results.scores_dict.category_encoded.predicted_label === 'Beautiful'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                >
                  {result.results.scores_dict.category_encoded.predicted_label}
                </span>
              </div>

              {/* Quick Details */}
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-semibold">Head:</span>{' '}
                  {result.results.scores_dict.head_beauty_score.score_0_100.toFixed(1)}
                </p>
                <p>
                  <span className="font-semibold">Neck:</span>{' '}
                  {result.results.scores_dict.neck_beauty_score.score_0_100.toFixed(1)}
                </p>
              </div>

              {/* View Details Button */}
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                View Full Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

=================================================================================
PART 2: PYTHON FLASK BACKEND SETUP (HANDLES INFERENCE)
=================================================================================

Create: app.py (Flask Backend)

```python
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import base64
import numpy as np
import cv2
import torch
import os
from io import BytesIO
from PIL import Image

# Import your inference utilities
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
MODEL_PATHS = {
    'body_model': '/content/runs/segment/train_Body_mosaic_0.6/weights/best.pt',
    'face_model': '/content/runs/segment/train_Face_mosaic_0.6/weights/best.pt',
    'scorer_model': '/content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth'
}

def image_to_base64(image_array):
    """Convert numpy array to base64 string"""
    _, buffer = cv2.imencode('.png', image_array)
    return base64.b64encode(buffer).decode('utf-8')

def create_annotated_image(image_path, body_bbox, face_bbox):
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

@app.route('/api/v1/detect/single', methods=['POST'])
def detect_single():
    """Single image beauty detection"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image provided'}), 400
        
        file = request.files['image']
        temp_path = f'/tmp/{file.filename}'
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
            return jsonify({'success': False, 'error': 'No camel detected'}), 400
        
        # Create annotated image
        image_b64 = create_annotated_image(temp_path, body_bbox, None)
        
        # Prepare response
        response = {
            'success': True,
            'body_bbox': body_bbox,
            'face_bbox': None,
            'results': result,
            'image_base64': image_b64
        }
        
        os.remove(temp_path)
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/v1/detect/batch', methods=['POST'])
def detect_batch():
    """Batch images detection with sorting"""
    try:
        if 'images' not in request.files:
            return jsonify({'success': False, 'error': 'No images provided'}), 400
        
        files = request.files.getlist('images')
        temp_paths = []
        
        for file in files:
            temp_path = f'/tmp/{file.filename}'
            file.save(temp_path)
            temp_paths.append(temp_path)
        
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
            zip(bboxes_sorted, results_sorted, temp_paths), 1
        ):
            image_b64 = create_annotated_image(path, bbox, None)
            batch_results.append({
                'image_id': f'camel_{rank:03d}',
                'body_bbox': bbox,
                'face_bbox': None,
                'results': result,
                'rank': rank,
                'image_base64': image_b64
            })
        
        # Cleanup
        for path in temp_paths:
            os.remove(path)
        
        return jsonify({
            'success': True,
            'total_images': len(files),
            'successful': len(batch_results),
            'failed': len(files) - len(batch_results),
            'results': batch_results
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/v1/config/models', methods=['GET'])
def get_model_paths():
    """Get model paths configuration"""
    return jsonify({
        'success': True,
        'models': MODEL_PATHS
    }), 200

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'CamelBeauty API'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

=================================================================================
EXAMPLE API RESPONSES
=================================================================================

SINGLE IMAGE DETECTION RESPONSE:
```json
{
  "success": true,
  "body_bbox": [150, 200, 450, 600],
  "face_bbox": [250, 220, 400, 320],
  "results": {
    "scores_dict": {
      "head_beauty_score": {
        "raw_class_score": 9.55,
        "score_0_100": 94.4,
        "label_ar": "جمال الرأس",
        "top_indices": [9, 8, 7],
        "top_probs": [0.45, 0.35, 0.2]
      },
      "neck_beauty_score": {
        "raw_class_score": 9.23,
        "score_0_100": 91.3,
        "label_ar": "جمال الرقبة",
        "top_indices": [9, 8, 7],
        "top_probs": [0.42, 0.38, 0.2]
      },
      "body_limb_hump_beauty_score": {
        "raw_class_score": 9.81,
        "score_0_100": 97.8,
        "label_ar": "جمال الجسم والأطراف والسنام",
        "top_indices": [9, 8, 7],
        "top_probs": [0.5, 0.32, 0.18]
      },
      "body_size_beauty_score": {
        "raw_class_score": 8.97,
        "score_0_100": 88.5,
        "label_ar": "جمال ضخامة الجسم",
        "top_indices": [8, 9, 7],
        "top_probs": [0.43, 0.35, 0.22]
      },
      "category_encoded": {
        "predicted_class": 0,
        "predicted_label": "Beautiful",
        "probs": [0.98, 0.02],
        "label_ar": "الفئة"
      }
    },
    "total_score_0_100": 93.0,
    "star_rating_0_5": 4.65
  },
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

BATCH DETECTION RESPONSE:
```json
{
  "success": true,
  "total_images": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "image_id": "camel_001",
      "body_bbox": [150, 200, 450, 600],
      "face_bbox": null,
      "results": {
        "scores_dict": { ... },
        "total_score_0_100": 93.0,
        "star_rating_0_5": 4.65
      },
      "rank": 1,
      "image_base64": "iVBORw0KGg..."
    },
    {
      "image_id": "camel_002",
      "body_bbox": [200, 250, 500, 650],
      "face_bbox": null,
      "results": {
        "scores_dict": { ... },
        "total_score_0_100": 88.5,
        "star_rating_0_5": 4.43
      },
      "rank": 2,
      "image_base64": "iVBORw0KGg..."
    },
    {
      "image_id": "camel_003",
      "body_bbox": [180, 220, 480, 620],
      "face_bbox": null,
      "results": {
        "scores_dict": { ... },
        "total_score_0_100": 85.2,
        "star_rating_0_5": 4.26
      },
      "rank": 3,
      "image_base64": "iVBORw0KGg..."
    }
  ]
}
```

=================================================================================
DEPLOYMENT INSTRUCTIONS
=================================================================================

1. FLASK BACKEND SETUP:
   - Install dependencies: pip install flask flask-cors torch torchvision transformers ultralytics
   - Place app.py in project root
   - Copy inference_utils.py to project root
   - Ensure model paths are accessible:
     * /content/runs/segment/train_Body_mosaic_0.6/weights/best.pt
     * /content/runs/segment/train_Face_mosaic_0.6/weights/best.pt
     * /content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth
   - Run: python app.py
   - Backend will be available at http://localhost:5000

2. FRONTEND CONFIGURATION:
   - Set API_BASE_URL environment variable: VITE_API_URL=http://localhost:5000
   - Install frontend dependencies
   - Frontend will call /api/v1/* endpoints

3. ENVIRONMENT VARIABLES (.env):
   VITE_API_URL=http://localhost:5000
   VITE_LANGUAGE=ar
   VITE_ENABLE_BATCH_UPLOAD=true
   VITE_MAX_FILE_SIZE=5242880
   VITE_MAX_BATCH_SIZE=52428800

=================================================================================
COMPLETE INTEGRATION CHECKLIST
=================================================================================

✓ Backend Flask app with /api/v1/detect/single endpoint
✓ Backend /api/v1/detect/batch endpoint with sorted results
✓ Frontend Beauty Detection page with single image upload
✓ Frontend Batch Upload page with progress tracking
✓ Beautiful Results Display with:
  - Original image with bounding boxes
  - Overall score (0-100) prominently displayed
  - Star rating (0-5) with visual stars
  - Category badge (Beautiful/Ugly)
  - 4 attribute cards with gauge charts
  - Export options (PDF, JSON, PNG)
✓ Batch Results Grid sorted by score (highest → lowest)
✓ Rank badges for ordering
✓ Real-time image processing feedback
✓ Error handling and user feedback
✓ Mobile responsive design
✓ Arabic/English language support
✓ RTL layout support
✓ Base64 image encoding/decoding
✓ File validation and security
✓ CORS configuration for cross-origin requests
✓ Model path management
✓ Device detection (CUDA/CPU)

=================================================================================

Now paste this comprehensive prompt into Bolt with the following additional request:

"Build the complete CamelBeauty website with full Flask backend integration for:
1. Single image beauty detection with beautiful results display
2. Batch image upload and processing with automatic sorting (highest to lowest score)
3. Display scores as 0-100 and star ratings as 0-5 stars
4. Show individual attribute scores with gauge charts
5. Include bounding boxes for detected body and face regions
6. All backend API endpoints must call the inference_utils.py functions
7. Models are at the paths specified in the Flask app
8. Full Arabic/English support with RTL layout
9. Mobile responsive design
10. Beautiful camel hero background image
11. Professional card-based layouts with Tailwind CSS
12. Real-time upload progress indicators
13. Batch results grid with rank badges sorted by score

Generate the complete frontend React code, Flask backend code, and ensure all connections work perfectly."
```

This comprehensive prompt gives Bolt everything needed to build your complete camel beauty detection website with full AI integration!
