import gradio as gr
import numpy as np
from PIL import Image
import cv2
from inference_utils import (
    infer_single_image,
    body_yolo_model,
    face_yolo_model,
    beauty_scorer_model,
    image_transform,
    mask_transform,
    device
)
import tempfile
import os

def predict_camel_beauty(image):
    """
    Process uploaded image and return beauty scores
    """
    if image is None:
        return "Please upload an image", None

    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
        image.save(tmp_file.name)
        temp_path = tmp_file.name

    try:
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
            return "❌ No camel detected in the image. Please upload a clear image of a camel.", None

        img_cv = cv2.imread(temp_path)
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        x1, y1, x2, y2 = body_bbox
        cv2.rectangle(img_rgb, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(img_rgb, "Camel Body", (x1, y1 - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        scores = result['scores_dict']

        star_rating = result['star_rating_0_5']
        stars = "⭐" * int(star_rating) + "✨" if star_rating % 1 >= 0.5 else "⭐" * int(star_rating)

        category = scores['category_encoded']['predicted_label']
        category_emoji = "✨" if category.lower() == "beautiful" else "📊"

        output_text = f"""
# 🐫 Camel Beauty Analysis Results

## Overall Assessment
**Score: {result['total_score_0_100']:.1f}/100** {stars} ({result['star_rating_0_5']:.2f}/5)

## Detailed Breakdown

### 📊 Beauty Scores
| Aspect | Score |
|--------|-------|
| Head Beauty | **{scores['head_beauty_score']['score_0_100']:.1f}**/100 |
| Neck Beauty | **{scores['neck_beauty_score']['score_0_100']:.1f}**/100 |
| Body/Limb/Hump | **{scores['body_limb_hump_beauty_score']['score_0_100']:.1f}**/100 |
| Body Size | **{scores['body_size_beauty_score']['score_0_100']:.1f}**/100 |

## {category_emoji} Classification
**Category:** {category}
**Confidence:** {scores['category_encoded']['probs'][scores['category_encoded']['predicted_class']]:.1%}

---
*Powered by AI using Vision Transformer and YOLO detection*
        """

        return output_text, Image.fromarray(img_rgb)

    except Exception as e:
        return f"❌ Error processing image: {str(e)}", None

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

css = """
.gradio-container {
    font-family: 'IBM Plex Sans', sans-serif;
}
.gr-button {
    color: white;
    border-color: #9d7e3a;
    background: linear-gradient(90deg, #9d7e3a 0%, #c9a961 100%);
}
"""

demo = gr.Interface(
    fn=predict_camel_beauty,
    inputs=gr.Image(type="pil", label="📸 Upload Camel Image"),
    outputs=[
        gr.Markdown(label="🔍 Beauty Analysis Results"),
        gr.Image(type="pil", label="🎯 Detected Camel with Bounding Box")
    ],
    title="🐫 CamelBeauty AI - Automated Beauty Assessment",
    description="""
    ### Welcome to CamelBeauty AI!

    Upload a **clear image** of a camel to receive a comprehensive AI-powered beauty assessment.

    **The system analyzes:**
    - 🗿 Head beauty and facial features
    - 🦒 Neck proportions and aesthetics
    - 💪 Body, limb, and hump structure
    - 📏 Overall body size and proportions

    **Powered by:**
    - YOLOv8 for precise camel detection
    - Vision Transformer (ViT) for beauty assessment
    - Multi-task deep learning model

    *For best results, use high-quality images with good lighting and a clear view of the camel.*
    """,
    examples=[],
    css=css,
    theme=gr.themes.Soft(
        primary_hue="amber",
        secondary_hue="orange",
    ),
    allow_flagging="never",
    analytics_enabled=False
)

if __name__ == "__main__":
    print("=" * 60)
    print("🐫 CamelBeauty AI - Gradio Interface")
    print("=" * 60)
    print(f"Device: {device}")
    print("Models loaded successfully!")
    print("=" * 60)
    demo.launch(server_name="0.0.0.0", server_port=7860)
