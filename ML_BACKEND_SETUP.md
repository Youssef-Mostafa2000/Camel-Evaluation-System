# ML Backend Setup Guide

## Architecture Overview

```
Frontend (React) → Flask ML Backend (localhost:5000) → ML Models (Local Files)
```

The CamelBeauty platform uses a Python Flask backend for AI-powered camel beauty detection. The frontend sends images directly to the Flask API, which processes them using deep learning models and returns beauty scores.

## Prerequisites

- Python 3.9+
- 4GB+ free disk space (for models)
- CUDA GPU (optional, but recommended for faster inference)
- Node.js 18+ (for frontend)

## Step 1: Download ML Models

The ML models are ~2GB total and must be downloaded from Google Drive.

### Option A: Automated Download (Recommended)

```bash
cd backend
python download_models.py
```

### Option B: Manual Download

If automated download fails:

1. Download models from Google Drive:
   - Body Detection Model: https://drive.google.com/uc?id=1z-4wlAHLoPicz2opaVawf-uteLIbY9cs
   - Face Detection Model: https://drive.google.com/uc?id=1Rk7fiatvsR1XurXL8BvEsyoMFINn6YGZ
   - Beauty Scorer Model: (Contact team for link)

2. Place models in the correct directories:
```bash
mkdir -p backend/models/body
mkdir -p backend/models/face
mkdir -p backend/models/scorer

# Move downloaded files
mv body_best.pt backend/models/body/best.pt
mv face_best.pt backend/models/face/best.pt
mv best_camel_beauty_all_data_model.pth backend/models/scorer/best_camel_beauty_all_data_model.pth
```

## Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

For GPU support (recommended):
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## Step 3: Verify Setup

Test that models load correctly:

```bash
cd backend
python -c "from inference_utils import *; print('✓ Models loaded successfully!')"
```

## Step 4: Start the ML Backend

```bash
cd backend
python app.py
```

You should see:
```
============================================================
CamelBeauty ML API Server
============================================================
Device: cuda:0  (or cpu if no GPU)
Models loaded successfully
Upload folder: /tmp/camel_uploads
============================================================
 * Running on http://0.0.0.0:5000
```

## Step 5: Start the Frontend

In a new terminal:

```bash
npm install
npm run dev
```

The frontend will automatically connect to the ML backend at `http://localhost:5000`.

## Testing the Integration

### Test Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "CamelBeauty ML API",
  "device": "cuda:0",
  "models_loaded": true
}
```

### Test Single Image Detection

```bash
curl -X POST -F "image=@path/to/camel.jpg" http://localhost:5000/api/v1/detect/single
```

## Environment Variables

The `.env` file has been updated with:

```env
VITE_ML_API_URL=http://localhost:5000
```

For production deployment, change this to your deployed ML backend URL:

```env
VITE_ML_API_URL=https://ml.yourdomain.com
```

## Docker Deployment

### Build and Run with Docker

```bash
# Make sure models are downloaded first
docker-compose up -d ml-backend
```

The docker-compose configuration:
- Mounts models directory as read-only
- Exposes port 5000
- Includes GPU support (if available)
- Automatic health checks and restart

### CPU-Only Docker

If you don't have NVIDIA GPU, remove the GPU configuration from `docker-compose.yml`:

```yaml
# Remove these lines:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

## Production Deployment Options

### Option 1: Separate VPS/Server

Deploy the ML backend on a dedicated server with GPU:

1. Set up on a cloud instance (AWS EC2 with GPU, Google Cloud, etc.)
2. Install dependencies and download models
3. Run with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

4. Update frontend `.env`:
```env
VITE_ML_API_URL=https://ml.yourdomain.com
```

### Option 2: Docker with GPU

On a GPU-enabled server:

```bash
# Install NVIDIA Docker runtime
# Then:
docker-compose up -d ml-backend
```

### Option 3: Cloud ML Services

For production at scale, consider:
- AWS SageMaker
- Google Cloud AI Platform
- Azure ML

## Troubleshooting

### Models Not Found Error

```
FileNotFoundError: models/body/best.pt
```

**Solution**: Download models using `python download_models.py`

### CUDA Out of Memory

```
RuntimeError: CUDA out of memory
```

**Solution**: Use CPU mode or reduce batch size
```python
device = torch.device("cpu")
```

### Slow Inference

**CPU Mode**: 5-10 seconds per image (expected)
**GPU Mode**: 0.5-1 second per image (expected)

**Solution**: Use GPU-enabled instance for production

### Connection Refused

```
Failed to fetch: http://localhost:5000
```

**Solution**:
1. Make sure ML backend is running: `python app.py`
2. Check firewall settings
3. Verify `.env` has correct URL

### Storage Limit While Downloading

**Problem**: Cannot download 2GB models due to storage constraints

**Solutions**:
1. Download models on a different machine with more storage
2. Upload models to cloud storage (S3, Google Cloud Storage)
3. Mount external storage/volume
4. Use a machine with larger disk

```bash
# Check available space
df -h

# Download to external location
cd /mnt/external-drive
python /path/to/download_models.py

# Then copy to project
cp -r models /path/to/project/backend/
```

## API Endpoints Reference

### Single Image Detection
```
POST /api/v1/detect/single
Content-Type: multipart/form-data
Body: image=<file>

Response:
{
  "success": true,
  "body_bbox": [x1, y1, x2, y2],
  "results": {
    "total_score_0_100": 93.0,
    "star_rating_0_5": 4.65,
    "scores_dict": {
      "head_beauty_score": {"score_0_100": 94.4},
      "neck_beauty_score": {"score_0_100": 91.3},
      "body_limb_hump_beauty_score": {"score_0_100": 97.8},
      "body_size_beauty_score": {"score_0_100": 88.5},
      "category_encoded": {
        "predicted_class": 0,
        "predicted_label": "Beautiful"
      }
    }
  }
}
```

### Batch Detection
```
POST /api/v1/detect/batch
Content-Type: multipart/form-data
Body: images=<file1>&images=<file2>&images=<file3>

Response: Array of detection results sorted by score
```

### Health Check
```
GET /health

Response:
{
  "status": "ok",
  "service": "CamelBeauty ML API",
  "device": "cuda:0",
  "models_loaded": true
}
```

## Performance Benchmarks

| Hardware | Single Image | Batch (10 images) |
|----------|--------------|-------------------|
| CPU (Intel i7) | ~8 seconds | ~80 seconds |
| GPU (RTX 3080) | ~0.7 seconds | ~7 seconds |
| Cloud GPU (T4) | ~1.2 seconds | ~12 seconds |

## Security Notes

- ML backend should run in a secure network
- Use HTTPS in production
- Implement rate limiting for public APIs
- Validate file uploads (type, size limits)
- Run with non-root user in production

## Next Steps

1. ✓ Models downloaded
2. ✓ Backend running
3. ✓ Frontend connected
4. Test with sample images
5. Deploy to production server
6. Set up monitoring and logging

## Support

For issues with model downloads or setup, contact the development team.
