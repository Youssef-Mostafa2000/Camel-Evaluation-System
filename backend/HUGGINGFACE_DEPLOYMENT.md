# Deploying CamelBeauty ML Backend to Hugging Face

## Overview

You have **3 options** for deploying your ML backend to Hugging Face:

1. **Gradio Space** (Recommended) - Free, easy, purpose-built for ML demos
2. **Docker Space** - Keeps your Flask API as-is, requires Docker SDK
3. **Inference Endpoints** - Production-grade, auto-scaling (paid)

## Current Setup Analysis

### ✅ What's Good
- Flask app is well-structured
- Model loading is clean
- API endpoints are RESTful
- CORS is configured

### ⚠️ Issues for HuggingFace Deployment

1. **Large Model Files** (~2GB)
   - Cannot be stored in git repository
   - Need to use Git LFS or download at runtime

2. **opencv-python** dependency
   - Replace with `opencv-python-headless` for Docker/HF Spaces
   - Smaller size, no GUI dependencies

3. **Memory Requirements**
   - Models require ~4-6GB RAM when loaded
   - HF Free tier: 16GB RAM (should work)
   - Consider model quantization for smaller footprint

---

## Option 1: Gradio Space (Recommended for Demo/Free Hosting)

### Step 1: Create Gradio Wrapper

Create `app_gradio.py` in the `backend/` folder:

```python
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

    # Save image temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
        image.save(tmp_file.name)
        temp_path = tmp_file.name

    try:
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
            return "No camel detected in the image", None

        # Draw bounding box
        img_cv = cv2.imread(temp_path)
        img_rgb = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
        x1, y1, x2, y2 = body_bbox
        cv2.rectangle(img_rgb, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(img_rgb, "Camel Body", (x1, y1 - 10),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        # Format results
        scores = result['scores_dict']
        output_text = f"""
# Camel Beauty Analysis Results

## Overall Score
**{result['total_score_0_100']:.1f}/100** ⭐ {result['star_rating_0_5']:.2f}/5

## Detailed Scores
- **Head Beauty**: {scores['head_beauty_score']['score_0_100']:.1f}/100
- **Neck Beauty**: {scores['neck_beauty_score']['score_0_100']:.1f}/100
- **Body/Limb/Hump**: {scores['body_limb_hump_beauty_score']['score_0_100']:.1f}/100
- **Body Size**: {scores['body_size_beauty_score']['score_0_100']:.1f}/100

## Category
**{scores['category_encoded']['predicted_label']}** (Confidence: {scores['category_encoded']['probs'][scores['category_encoded']['predicted_class']]:.1%})
        """

        return output_text, Image.fromarray(img_rgb)

    except Exception as e:
        return f"Error: {str(e)}", None

    finally:
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

# Create Gradio Interface
demo = gr.Interface(
    fn=predict_camel_beauty,
    inputs=gr.Image(type="pil", label="Upload Camel Image"),
    outputs=[
        gr.Markdown(label="Beauty Analysis"),
        gr.Image(type="pil", label="Detected Camel")
    ],
    title="🐫 CamelBeauty AI - Beauty Assessment System",
    description="""
    Upload a camel image to get AI-powered beauty assessment.

    The system analyzes:
    - Head beauty characteristics
    - Neck proportions and aesthetics
    - Body, limb, and hump structure
    - Overall body size and proportions
    """,
    examples=[
        # Add example image paths if you have sample images
    ],
    theme=gr.themes.Soft(),
    allow_flagging="never"
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
```

### Step 2: Update requirements.txt for Gradio

Create `backend/requirements_gradio.txt`:

```txt
gradio==4.10.0
torch==2.1.0
torchvision==0.16.0
transformers==4.35.0
ultralytics==8.0.230
opencv-python-headless==4.8.1.78
pillow==10.1.0
numpy==1.24.3
```

**Important**: Changed `opencv-python` → `opencv-python-headless`

### Step 3: Create Model Download Script

Create `backend/download_models_hf.py`:

```python
import os
from huggingface_hub import hf_hub_download

def download_models():
    """
    Download models from Hugging Face Hub or Google Drive
    """
    models_dir = os.path.join(os.path.dirname(__file__), 'models')

    # Create directories
    os.makedirs(f'{models_dir}/body', exist_ok=True)
    os.makedirs(f'{models_dir}/face', exist_ok=True)
    os.makedirs(f'{models_dir}/scorer', exist_ok=True)

    print("📦 Downloading models...")

    # Option 1: If models are on HuggingFace Hub
    # Uncomment and replace with your repo
    # hf_hub_download(repo_id="your-username/camel-models",
    #                 filename="body_best.pt",
    #                 local_dir=f'{models_dir}/body')

    # Option 2: Download from Google Drive (fallback)
    import gdown

    print("Downloading Body Detection Model...")
    gdown.download(
        'https://drive.google.com/uc?id=YOUR_BODY_MODEL_ID',
        f'{models_dir}/body/best.pt',
        quiet=False
    )

    print("Downloading Face Detection Model...")
    gdown.download(
        'https://drive.google.com/uc?id=YOUR_FACE_MODEL_ID',
        f'{models_dir}/face/best.pt',
        quiet=False
    )

    print("Downloading Beauty Scorer Model...")
    gdown.download(
        'https://drive.google.com/uc?id=YOUR_SCORER_MODEL_ID',
        f'{models_dir}/scorer/best_camel_beauty_all_data_model.pth',
        quiet=False
    )

    print("✅ All models downloaded successfully!")

if __name__ == "__main__":
    download_models()
```

### Step 4: Create README for HuggingFace

Create `backend/README_HF.md`:

```markdown
---
title: CamelBeauty AI Assessment
emoji: 🐫
colorFrom: blue
colorTo: yellow
sdk: gradio
sdk_version: 4.10.0
app_file: app_gradio.py
pinned: false
---

# CamelBeauty AI - Automated Beauty Assessment System

AI-powered system for assessing camel beauty characteristics using computer vision and deep learning.

## Features
- Camel detection and localization
- Multi-aspect beauty scoring
- Head, neck, body, and size analysis
- Real-time inference

## Model Architecture
- YOLO v8 for body/face detection
- Vision Transformer (ViT) for beauty assessment
- Multi-task learning for comprehensive scoring

## Usage
Upload a clear image of a camel to get instant beauty assessment scores.
```

### Step 5: Deployment Steps

```bash
# 1. Install Hugging Face CLI
pip install huggingface_hub

# 2. Login to Hugging Face
huggingface-cli login

# 3. Create a new Space
# Go to: https://huggingface.co/new-space
# - Name: camel-beauty-ai
# - SDK: Gradio
# - Hardware: CPU Basic (free) or T4 GPU (paid)

# 4. Clone your space
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
cd camel-beauty-ai

# 5. Copy files
cp ../backend/app_gradio.py app.py
cp ../backend/inference_utils.py .
cp ../backend/requirements_gradio.txt requirements.txt
cp ../backend/README_HF.md README.md

# 6. Upload models using Git LFS (for files <5GB)
git lfs install
git lfs track "*.pt"
git lfs track "*.pth"

# Copy your models
mkdir -p models/body models/face models/scorer
cp ../backend/models/body/best.pt models/body/
cp ../backend/models/face/best.pt models/face/
cp ../backend/models/scorer/best_camel_beauty_all_data_model.pth models/scorer/

# 7. Commit and push
git add .
git commit -m "Initial deployment"
git push
```

---

## Option 2: Docker Space (Keep Flask API)

### Step 1: Fix requirements.txt

Update `backend/requirements.txt`:

```txt
flask==3.0.0
flask-cors==4.0.0
gunicorn==21.2.0
torch==2.1.0
torchvision==0.16.0
transformers==4.35.0
ultralytics==8.0.230
opencv-python-headless==4.8.1.78
pillow==10.1.0
numpy==1.24.3
```

### Step 2: Update Dockerfile

Update `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .
COPY inference_utils.py .

# Create directories
RUN mkdir -p /app/models/body /app/models/face /app/models/scorer
RUN mkdir -p /tmp/camel_uploads

# Download models at build time
COPY download_models_hf.py .
RUN python download_models_hf.py

# Expose port
EXPOSE 7860

# Run with gunicorn
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:7860", "--timeout", "300", "app:app"]
```

### Step 3: Create README

Create `README_DOCKER.md`:

```markdown
---
title: CamelBeauty ML API
emoji: 🐫
colorFrom: blue
colorTo: yellow
sdk: docker
pinned: false
---

# CamelBeauty ML API

REST API for camel beauty assessment.

## Endpoints

### POST /api/v1/detect/single
Upload single camel image for analysis.

### POST /api/v1/detect/batch
Upload multiple images for batch processing.

### GET /health
Health check endpoint.
```

### Step 4: Deploy to Docker Space

```bash
# 1. Create Docker Space on HuggingFace
# SDK: Docker

# 2. Clone and setup
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-api
cd camel-api

# 3. Copy files
cp ../backend/app.py .
cp ../backend/inference_utils.py .
cp ../backend/Dockerfile .
cp ../backend/requirements.txt .
cp ../backend/download_models_hf.py .
cp README_DOCKER.md README.md

# 4. Commit and push
git add .
git commit -m "Deploy Flask API"
git push
```

---

## Option 3: Hugging Face Inference Endpoints (Production)

Best for production with auto-scaling and high availability.

### Pricing
- Small: ~$0.60/hour
- Medium: ~$1.30/hour
- GPU: ~$4.50/hour

### Steps

1. **Upload Model to HF Hub**
```bash
# Create model repo
huggingface-cli repo create camel-beauty-model --type model

# Upload
git clone https://huggingface.co/YOUR_USERNAME/camel-beauty-model
cd camel-beauty-model

# Copy models with Git LFS
git lfs track "*.pt" "*.pth"
cp -r ../backend/models/* .
git add .
git commit -m "Upload models"
git push
```

2. **Create Inference Endpoint**
   - Go to: https://ui.endpoints.huggingface.co/
   - Click "New Endpoint"
   - Select your model
   - Choose instance type
   - Deploy

3. **Update Frontend**
```env
VITE_ML_API_URL=https://YOUR-ENDPOINT.endpoints.huggingface.cloud
```

---

## Recommendations

### For Demo/Portfolio
✅ **Use Gradio Space** (Option 1)
- Free tier available
- Easy to showcase
- Built-in UI
- Fast deployment

### For Development API
✅ **Use Docker Space** (Option 2)
- Free tier available
- Keeps Flask API
- Can be called from frontend
- Good for testing

### For Production
✅ **Use Inference Endpoints** (Option 3)
- Auto-scaling
- High availability
- Load balancing
- Monitoring included

---

## Common Issues & Solutions

### Issue: "Model files too large"
**Solution**: Use Git LFS
```bash
git lfs install
git lfs track "*.pt" "*.pth"
```

### Issue: "Out of memory"
**Solution**:
1. Use CPU inference for demo
2. Implement model quantization
3. Upgrade to GPU instance

### Issue: "Slow cold start"
**Solution**:
1. Keep models in HF Hub cache
2. Use persistent storage
3. Implement model warming

### Issue: "OpenCV import error"
**Solution**: Use `opencv-python-headless`

---

## Testing Your Deployment

Once deployed, test with:

```bash
# For Gradio
# Just visit the Space URL in browser

# For Docker/API
curl -X POST \
  https://YOUR-USERNAME-camel-api.hf.space/api/v1/detect/single \
  -F "image=@test_camel.jpg"
```

## Monitoring

- View logs in HF Space settings
- Monitor usage in Space analytics
- Set up status alerts

## Next Steps

1. Deploy to HF Space using Option 1 (Gradio)
2. Test with sample images
3. Share Space URL with users
4. Optionally: Add more features (comparison, history, etc.)
5. If needed, upgrade to GPU instance for faster inference
