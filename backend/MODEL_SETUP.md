# ML Models Setup Guide

This guide explains how to download and set up the ML models for the CamelBeauty platform.

## Model Files

Three model files are required for the camel beauty detection system:

1. **Body Detection Model** (best_body_model.pt)
   - Google Drive: https://drive.google.com/file/d/1z-4wlAHLoPicz2opaVawf-uteLIbY9cs/view?usp=drive_link
   - Purpose: Detects and segments the camel's body in images
   - Type: YOLOv8 segmentation model

2. **Face Detection Model** (best_face_model.pt)
   - Google Drive: https://drive.google.com/file/d/1Rk7fiatvsR1XurXL8BvEsyoMFINn6YGZ/view?usp=drive_link
   - Purpose: Detects and segments the camel's face within the body region
   - Type: YOLOv8 segmentation model

3. **Beauty Scorer Model** (best_camel_beauty_model.pth)
   - Google Drive: https://drive.google.com/file/d/1WDXhFo-wJYu1RzKNcRNY3ZEyKdvyXvAi/view?usp=drive_link
   - Purpose: Scores camel beauty attributes based on extracted features
   - Type: Custom Vision Transformer (ViT) based model

## Directory Structure

Create the following directory structure for the models:

```
backend/
├── models/
│   ├── body/
│   │   └── best.pt              (body detection model)
│   ├── face/
│   │   └── best.pt              (face detection model)
│   └── scorer/
│       └── best_camel_beauty_all_data_model.pth  (beauty scorer)
├── app.py
├── inference_utils.py
└── requirements.txt
```

## Download Instructions

### Option 1: Manual Download (Recommended)

1. **Download Body Detection Model:**
   ```bash
   mkdir -p backend/models/body
   # Download from: https://drive.google.com/file/d/1z-4wlAHLoPicz2opaVawf-uteLIbY9cs/view?usp=drive_link
   # Save as: backend/models/body/best.pt
   ```

2. **Download Face Detection Model:**
   ```bash
   mkdir -p backend/models/face
   # Download from: https://drive.google.com/file/d/1Rk7fiatvsR1XurXL8BvEsyoMFINn6YGZ/view?usp=drive_link
   # Save as: backend/models/face/best.pt
   ```

3. **Download Beauty Scorer Model:**
   ```bash
   mkdir -p backend/models/scorer
   # Download from: https://drive.google.com/file/d/1WDXhFo-wJYu1RzKNcRNY3ZEyKdvyXvAi/view?usp=drive_link
   # Save as: backend/models/scorer/best_camel_beauty_all_data_model.pth
   ```

### Option 2: Using gdown (Automated)

Install gdown:
```bash
pip install gdown
```

Download all models:
```bash
# Create directories
mkdir -p backend/models/body backend/models/face backend/models/scorer

# Download Body Model
gdown "https://drive.google.com/uc?id=1z-4wlAHLoPicz2opaVawf-uteLIbY9cs" -O backend/models/body/best.pt

# Download Face Model
gdown "https://drive.google.com/uc?id=1Rk7fiatvsR1XurXL8BvEsyoMFINn6YGZ" -O backend/models/face/best.pt

# Download Beauty Scorer Model
gdown "https://drive.google.com/uc?id=1WDXhFo-wJYu1RzKNcRNY3ZEyKdvyXvAi" -O backend/models/scorer/best_camel_beauty_all_data_model.pth
```

## Update Model Paths

After downloading, update the model paths in `backend/inference_utils.py` (lines 822-824):

```python
# Old paths (default):
body_seg_model_path = '/content/runs/segment/train_Body_mosaic_0.6/weights/best.pt'
face_seg_model_path = '/content/runs/segment/train_Face_mosaic_0.6/weights/best.pt'
beauty_scorer_checkpoint_path = '/content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth'

# New paths (update to):
body_seg_model_path = 'backend/models/body/best.pt'
face_seg_model_path = 'backend/models/face/best.pt'
beauty_scorer_checkpoint_path = 'backend/models/scorer/best_camel_beauty_all_data_model.pth'
```

Also update in `backend/app.py` (lines 22-24):

```python
MODEL_PATHS = {
    'body_model': 'backend/models/body/best.pt',
    'face_model': 'backend/models/face/best.pt',
    'scorer_model': 'backend/models/scorer/best_camel_beauty_all_data_model.pth'
}
```

## Model File Sizes

Expected file sizes:
- Body Model: ~6.5 MB
- Face Model: ~6.5 MB
- Beauty Scorer: ~350 MB

Total: ~363 MB

## Verification

Verify the models are downloaded correctly:

```bash
# Check if files exist
ls -lh backend/models/body/best.pt
ls -lh backend/models/face/best.pt
ls -lh backend/models/scorer/best_camel_beauty_all_data_model.pth

# Check file sizes
du -h backend/models/body/best.pt
du -h backend/models/face/best.pt
du -h backend/models/scorer/best_camel_beauty_all_data_model.pth
```

## Installing Python Dependencies

Install required Python packages:

```bash
cd backend
pip install -r requirements.txt
```

### GPU Support (Optional but Recommended)

For GPU acceleration, install PyTorch with CUDA support:

```bash
# For CUDA 11.8
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu121
```

## Testing the Setup

Test if models load correctly:

```bash
cd backend
python -c "from inference_utils import body_yolo_model, face_yolo_model, beauty_scorer_model, device; print(f'Device: {device}'); print('All models loaded successfully!')"
```

Expected output:
```
Loaded Body_seg YOLO model from: backend/models/body/best.pt
Loaded Face_seg YOLO model from: backend/models/face/best.pt
Loaded CamelBeautyScorer model from: backend/models/scorer/best_camel_beauty_all_data_model.pth
Models ready on device: cuda:0  (or cpu if no GPU)
Device: cuda:0
All models loaded successfully!
```

## Running the Flask Backend

Start the ML API server:

```bash
cd backend
python app.py
```

Expected output:
```
============================================================
CamelBeauty ML API Server
============================================================
Device: cuda:0
Models loaded successfully
Upload folder: /tmp/camel_uploads
============================================================
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
```

## Testing the API

Test the health endpoint:

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

## Troubleshooting

### Issue: "No module named 'transformers'"
Solution: Install missing dependencies
```bash
pip install transformers
```

### Issue: "CUDA out of memory"
Solution: Use CPU or reduce batch size
```python
device = torch.device("cpu")
```

### Issue: "File not found" error
Solution: Verify model paths are correct and files exist
```bash
ls -la backend/models/body/best.pt
ls -la backend/models/face/best.pt
ls -la backend/models/scorer/best_camel_beauty_all_data_model.pth
```

### Issue: Models load slowly
Solution: This is normal on first load. Models are cached after initial loading.

## Production Deployment

For production deployment:

1. **Use environment variables for model paths:**
   ```bash
   export BODY_MODEL_PATH="/path/to/models/body/best.pt"
   export FACE_MODEL_PATH="/path/to/models/face/best.pt"
   export SCORER_MODEL_PATH="/path/to/models/scorer/best_camel_beauty_all_data_model.pth"
   ```

2. **Use a production WSGI server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Enable GPU if available:**
   - Ensure CUDA drivers are installed
   - Install PyTorch with CUDA support
   - Verify GPU is detected: `python -c "import torch; print(torch.cuda.is_available())"`

## Next Steps

After setting up the models:

1. Update the frontend to call the Flask backend API
2. Configure CORS settings if needed
3. Set up reverse proxy (nginx) for production
4. Implement authentication for API endpoints
5. Set up monitoring and logging

## Support

For issues with:
- Model downloads: Check Google Drive links are accessible
- Model loading: Verify file integrity and paths
- GPU issues: Check CUDA installation
- API errors: Check Flask logs and error messages
