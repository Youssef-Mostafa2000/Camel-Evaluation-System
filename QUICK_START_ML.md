# Quick Start: ML Backend

Get your AI-powered camel beauty detection running in 5 minutes!

## Prerequisites

- Python 3.8+
- pip
- 2GB free disk space
- (Optional) NVIDIA GPU with CUDA

## Step-by-Step Setup

### 1. Download Models (2 minutes)

```bash
cd backend
chmod +x download_models.sh
./download_models.sh
```

Wait for download to complete (~363 MB total).

### 2. Install Dependencies (1 minute)

```bash
pip install -r requirements.txt
```

**If you have a GPU:**
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 3. Update Model Paths (30 seconds)

Edit `backend/inference_utils.py`, find lines 822-824 and change:

```python
# From:
body_seg_model_path = '/content/runs/segment/train_Body_mosaic_0.6/weights/best.pt'
face_seg_model_path = '/content/runs/segment/train_Face_mosaic_0.6/weights/best.pt'
beauty_scorer_checkpoint_path = '/content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth'

# To:
body_seg_model_path = 'models/body/best.pt'
face_seg_model_path = 'models/face/best.pt'
beauty_scorer_checkpoint_path = 'models/scorer/best_camel_beauty_all_data_model.pth'
```

### 4. Start Backend (30 seconds)

```bash
python app.py
```

You should see:
```
============================================================
CamelBeauty ML API Server
============================================================
Device: cuda:0
Models loaded successfully
 * Running on http://127.0.0.1:5000
```

### 5. Test It! (30 seconds)

**Terminal 1 (Backend is running):**
```bash
python app.py
```

**Terminal 2 (Test):**
```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {"status": "ok", "device": "cuda:0", "models_loaded": true}
```

**Test with image:**
```bash
# Download test image
curl -o test_camel.jpg "https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&w=800"

# Run detection
curl -X POST -F "image=@test_camel.jpg" http://localhost:5000/api/v1/detect/single
```

## Test with Frontend

### Update .env

Add to your `.env` file:
```bash
VITE_ML_API_URL=http://localhost:5000
VITE_USE_ML_BACKEND=true
```

### Start Frontend

**Terminal 3:**
```bash
npm run dev
```

### Test in Browser

1. Go to http://localhost:5173/detection
2. Upload a camel image
3. See real AI results!

## Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"
```bash
pip install flask flask-cors
```

### "No module named 'torch'"
```bash
pip install torch torchvision
```

### "CUDA out of memory"
Use CPU instead - edit `inference_utils.py` line 819:
```python
device = torch.device("cpu")  # Force CPU
```

### "No camel detected"
- Make sure image contains a camel
- Try different image with clear side view
- Check image is not corrupted

### Slow inference (10+ seconds)
- You're using CPU (normal on CPU)
- To use GPU: Install CUDA and GPU-enabled PyTorch
- Or: Accept slower CPU speeds for development

## What You Get

With this setup running:

✅ **Real AI Detection:**
- Body detection with bounding boxes
- Face detection within body region
- 4 beauty attributes scored 0-100
- Overall score and 0-5 star rating
- Beautiful/Ugly classification

✅ **API Endpoints:**
- `/api/v1/detect/single` - Single image
- `/api/v1/detect/batch` - Multiple images with ranking
- `/health` - System status

✅ **Features:**
- Automatic sorting by beauty score
- Base64 encoded annotated images
- Arabic labels for all attributes
- Top-K probability distributions

## Performance

**GPU (Recommended):**
- Single image: 0.5-1 second
- 10 images batch: 5-10 seconds

**CPU (Development OK):**
- Single image: 5-10 seconds
- 10 images batch: 50-100 seconds

## Next Steps

1. ✅ Backend running
2. ✅ Frontend connected
3. 📖 Read full docs: `ML_BACKEND_INTEGRATION.md`
4. 🚀 Deploy to production

## Production Deployment

Use Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

Use Docker:
```bash
cd backend
docker build -t camel-ml-api .
docker run -p 5000:5000 --gpus all camel-ml-api
```

## Summary

You now have:
- ✅ ML models downloaded and loaded
- ✅ Flask API running on port 5000
- ✅ Frontend ready to use real AI
- ✅ Complete camel beauty detection system

**Total setup time: ~5 minutes**
**Your platform is now AI-powered!** 🐪✨
