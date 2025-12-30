# CamelBeauty ML Backend

Python Flask backend for AI-powered camel beauty detection using deep learning models.

## Overview

This backend provides REST API endpoints for:
- Single image camel beauty detection
- Batch image processing with automatic ranking
- Real-time beauty scoring across multiple attributes
- Bounding box detection for body and face regions

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Flask Backend  │
│   (Python)      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         ML Pipeline                  │
├─────────────────────────────────────┤
│  1. YOLOv8 Body Detection           │
│  2. YOLOv8 Face Detection           │
│  3. ViT Feature Extraction          │
│  4. Beauty Scoring Model            │
└─────────────────────────────────────┘
```

## Quick Start

### 1. Download Models

```bash
cd backend
chmod +x download_models.sh
./download_models.sh
```

Or manually download from Google Drive (see MODEL_SETUP.md).

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

For GPU support:
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 3. Update Model Paths

Edit `inference_utils.py` lines 822-824:

```python
body_seg_model_path = 'models/body/best.pt'
face_seg_model_path = 'models/face/best.pt'
beauty_scorer_checkpoint_path = 'models/scorer/best_camel_beauty_all_data_model.pth'
```

### 4. Start Server

```bash
python app.py
```

Server runs on: http://localhost:5000

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "CamelBeauty ML API",
  "device": "cuda:0",
  "models_loaded": true
}
```

### Single Image Detection

```bash
POST /api/v1/detect/single
Content-Type: multipart/form-data

image: <file>
```

Response:
```json
{
  "success": true,
  "body_bbox": [150, 200, 450, 600],
  "face_bbox": null,
  "results": {
    "scores_dict": {
      "head_beauty_score": {
        "score_0_100": 94.4,
        "label_ar": "جمال الرأس",
        "top_indices": [9, 8, 7],
        "top_probs": [0.45, 0.35, 0.2]
      },
      "neck_beauty_score": {
        "score_0_100": 91.3,
        "label_ar": "جمال الرقبة"
      },
      "body_limb_hump_beauty_score": {
        "score_0_100": 97.8,
        "label_ar": "جمال الجسم والأطراف والسنام"
      },
      "body_size_beauty_score": {
        "score_0_100": 88.5,
        "label_ar": "جمال ضخامة الجسم"
      },
      "category_encoded": {
        "predicted_class": 0,
        "predicted_label": "Beautiful",
        "probs": [0.98, 0.02]
      }
    },
    "total_score_0_100": 93.0,
    "star_rating_0_5": 4.65
  },
  "image_base64": "<base64_encoded_annotated_image>"
}
```

### Batch Image Detection

```bash
POST /api/v1/detect/batch
Content-Type: multipart/form-data

images: <file1>
images: <file2>
images: <file3>
```

Response:
```json
{
  "success": true,
  "total_images": 3,
  "successful": 3,
  "failed": 0,
  "results": [
    {
      "image_id": "camel_001",
      "rank": 1,
      "body_bbox": [150, 200, 450, 600],
      "results": {
        "total_score_0_100": 93.0,
        "star_rating_0_5": 4.65,
        "scores_dict": { ... }
      },
      "image_base64": "..."
    },
    ...
  ]
}
```

Results are automatically sorted by total_score (highest to lowest).

## Beauty Scoring System

### Attributes Evaluated

1. **Head Beauty** (50% weight)
   - Facial symmetry and proportions
   - Head shape and size

2. **Neck Beauty** (20% weight)
   - Neck length and curve
   - Neck thickness

3. **Body, Limbs & Hump** (15% weight)
   - Body proportions
   - Leg structure
   - Hump size and shape

4. **Body Size** (15% weight)
   - Overall body mass
   - Size proportionality

### Scoring Scale

- **0-100 Scale**: Each attribute scored 0-100
- **Star Rating**: 0-5 stars (total_score / 20)
- **Category**: Beautiful (class 0) or Ugly (class 1)

### Total Score Calculation

```
total_score = (head × 0.5) + (neck × 0.2) + (body_hump × 0.15) + (size × 0.15)
```

## Model Details

### 1. Body Detection Model
- **Type**: YOLOv8 Segmentation
- **Input**: RGB image (any size)
- **Output**: Body bounding box + segmentation mask
- **Confidence Threshold**: 0.5

### 2. Face Detection Model
- **Type**: YOLOv8 Segmentation
- **Input**: Cropped body region
- **Output**: Face bounding box + segmentation mask
- **Confidence Threshold**: 0.25

### 3. Beauty Scorer Model
- **Type**: Vision Transformer (ViT) + Custom Heads
- **Input**: Body + Face crops with masks (224x224)
- **Architecture**:
  - Base: google/vit-base-patch16-224
  - Mask-Enhanced ViT encoders
  - Cross-modal fusion
  - Multi-head regression (4 attributes + 1 category)
- **Output**: 5 scores (4 beauty attributes + category)

## Project Structure

```
backend/
├── app.py                    # Flask API server
├── inference_utils.py        # ML models and inference pipeline
├── requirements.txt          # Python dependencies
├── download_models.sh        # Model download script
├── MODEL_SETUP.md           # Detailed setup guide
├── README.md                # This file
└── models/                  # Model files (after download)
    ├── body/
    │   └── best.pt
    ├── face/
    │   └── best.pt
    └── scorer/
        └── best_camel_beauty_all_data_model.pth
```

## Development

### Running Tests

```bash
# Test model loading
python -c "from inference_utils import *; print('Models loaded!')"

# Test API health
curl http://localhost:5000/health

# Test single detection (with sample image)
curl -X POST -F "image=@sample_camel.jpg" http://localhost:5000/api/v1/detect/single
```

### Debugging

Enable Flask debug mode in `app.py`:
```python
app.run(host='0.0.0.0', port=5000, debug=True)
```

Check logs:
```bash
python app.py 2>&1 | tee backend.log
```

## Performance

### Single Image
- CPU: ~5-10 seconds
- GPU (CUDA): ~0.5-1 second

### Batch Processing
- CPU: ~5-10 seconds per image
- GPU (CUDA): ~0.5-1 second per image

### Memory Requirements
- Models: ~1.5 GB VRAM/RAM
- Per image: ~100 MB peak

## Production Deployment

### Using Gunicorn

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

### Environment Variables

```bash
export FLASK_ENV=production
export MODEL_PATH=/path/to/models
export UPLOAD_FOLDER=/tmp/camel_uploads
```

## Integration with Frontend

Update frontend API calls to point to Flask backend:

```typescript
// In your React app
const API_BASE_URL = process.env.VITE_ML_API_URL || 'http://localhost:5000';

const detectCamelBeauty = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE_URL}/api/v1/detect/single`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
};
```

## Troubleshooting

### Common Issues

1. **CUDA out of memory**
   - Solution: Use CPU or reduce batch size
   - Set: `device = torch.device("cpu")`

2. **Model file not found**
   - Solution: Run `./download_models.sh`
   - Verify paths in `inference_utils.py`

3. **Slow inference on CPU**
   - Expected: CPU is 10x slower than GPU
   - Solution: Use GPU-enabled instance

4. **CORS errors**
   - Solution: CORS is enabled by default
   - Check frontend API_BASE_URL

## Support & Documentation

- Full Setup Guide: [MODEL_SETUP.md](MODEL_SETUP.md)
- API Documentation: See endpoints above
- Model Architecture: See `inference_utils.py`

## License

Proprietary - CamelBeauty Platform

## Contributors

AI/ML Pipeline developed for the CamelBeauty platform.
