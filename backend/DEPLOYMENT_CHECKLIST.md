# HuggingFace Deployment Checklist

## Pre-Deployment

### ✅ Code Issues Fixed
- [x] Changed `opencv-python` → `opencv-python-headless`
- [x] Added `gunicorn` for production Flask serving
- [x] Added `gdown` for model downloading
- [x] Created Gradio interface (`app_gradio.py`)
- [x] Created separate requirements file (`requirements_gradio.txt`)

### ⚠️ Critical Issues to Address

1. **Model Files (2GB total)**
   - [ ] Models cannot be pushed directly to git
   - [ ] Choose one solution:
     - **Option A**: Use Git LFS (Large File Storage)
     - **Option B**: Download models at runtime from Google Drive
     - **Option C**: Upload models to Hugging Face Hub separately

2. **Storage Requirements**
   - Free HF Spaces: 50GB disk space (sufficient)
   - RAM: 16GB on free tier (sufficient for CPU inference)
   - For GPU: Upgrade to paid tier

## Deployment Options Comparison

| Feature | Gradio Space | Docker Space | Inference Endpoint |
|---------|--------------|--------------|-------------------|
| Cost | **FREE** | **FREE** | Paid (~$0.60/hr) |
| Setup Difficulty | Easy | Medium | Hard |
| Use Case | Demo/Portfolio | API Testing | Production |
| Auto-scaling | ❌ | ❌ | ✅ |
| Custom UI | Limited | Full | N/A |
| Best For | **Recommended** | Development | Enterprise |

## Option 1: Gradio Space Deployment (Recommended)

### Step-by-Step Guide

#### 1. Prepare Files
```bash
cd backend

# Create deployment folder
mkdir -p hf-deploy
cd hf-deploy

# Copy necessary files
cp ../app_gradio.py app.py
cp ../inference_utils.py .
cp ../requirements_gradio.txt requirements.txt
cp ../README_HUGGINGFACE.md README.md
```

#### 2. Handle Model Files

**Method A: Git LFS (If models < 5GB each)**
```bash
git lfs install
git lfs track "*.pt"
git lfs track "*.pth"

# Copy models
mkdir -p models/body models/face models/scorer
cp ../models/body/best.pt models/body/
cp ../models/face/best.pt models/face/
cp ../models/scorer/best_camel_beauty_all_data_model.pth models/scorer/
```

**Method B: Runtime Download (Recommended for large files)**

Create `download_models.py`:
```python
import os
import gdown

def download_models():
    models_dir = 'models'
    os.makedirs(f'{models_dir}/body', exist_ok=True)
    os.makedirs(f'{models_dir}/face', exist_ok=True)
    os.makedirs(f'{models_dir}/scorer', exist_ok=True)

    # Replace with your Google Drive file IDs
    files = {
        'body': 'YOUR_BODY_MODEL_GDRIVE_ID',
        'face': 'YOUR_FACE_MODEL_GDRIVE_ID',
        'scorer': 'YOUR_SCORER_MODEL_GDRIVE_ID'
    }

    print("Downloading models...")
    gdown.download(f'https://drive.google.com/uc?id={files["body"]}',
                   f'{models_dir}/body/best.pt', quiet=False)
    gdown.download(f'https://drive.google.com/uc?id={files["face"]}',
                   f'{models_dir}/face/best.pt', quiet=False)
    gdown.download(f'https://drive.google.com/uc?id={files["scorer"]}',
                   f'{models_dir}/scorer/best_camel_beauty_all_data_model.pth', quiet=False)
    print("Models downloaded!")

if __name__ == "__main__":
    download_models()
```

Modify `app.py` to download on startup:
```python
import os
if not os.path.exists('models/body/best.pt'):
    print("Models not found. Downloading...")
    from download_models import download_models
    download_models()
```

#### 3. Create HuggingFace Space

```bash
# Install HF CLI
pip install huggingface_hub

# Login
huggingface-cli login
# Paste your token from: https://huggingface.co/settings/tokens

# Create Space
# Go to: https://huggingface.co/new-space
# - Name: camel-beauty-ai
# - License: MIT
# - SDK: Gradio
# - Hardware: CPU Basic (free) or T4 Small (paid for faster inference)
# - Make it public

# Clone the space
cd ~/projects
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
cd camel-beauty-ai

# Copy files from hf-deploy folder
cp -r ../backend/hf-deploy/* .

# Commit and push
git add .
git commit -m "Initial deployment of CamelBeauty AI"
git push
```

#### 4. Monitor Deployment

- Go to your Space URL: `https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai`
- Check build logs for any errors
- Wait for build to complete (5-15 minutes)
- Test with sample images

## Option 2: Docker Space Deployment

### Prerequisites
- Docker experience
- Larger model handling

### Files Needed

1. **Dockerfile** (use existing one)
2. **requirements.txt** (updated with opencv-python-headless)
3. **app.py** (Flask API)
4. **inference_utils.py**

### Deployment

```bash
# Create Docker Space on HF
# SDK: Docker

# Clone
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-api
cd camel-api

# Copy files
cp ../backend/Dockerfile .
cp ../backend/app.py .
cp ../backend/inference_utils.py .
cp ../backend/requirements.txt .

# Create README.md for Docker
cat > README.md << 'EOF'
---
title: CamelBeauty ML API
emoji: 🐫
sdk: docker
pinned: false
---

# CamelBeauty ML API
REST API for camel beauty assessment.
EOF

# Commit and push
git add .
git commit -m "Deploy Flask API"
git push
```

## Common Issues & Solutions

### Issue 1: Build Fails - "No such file or directory: models/body/best.pt"
**Solution**: Implement runtime model download using `gdown` or Git LFS

### Issue 2: "ImportError: libGL.so.1: cannot open shared object file"
**Solution**: Using `opencv-python-headless` instead of `opencv-python` (already fixed)

### Issue 3: Out of Memory During Build
**Solution**:
- Use CPU-only PyTorch: `torch==2.1.0+cpu -f https://download.pytorch.org/whl/cpu/torch_stable.html`
- Or upgrade to GPU instance

### Issue 4: Inference Too Slow (>30 seconds)
**Solution**:
- Upgrade to GPU tier (T4 Small: $0.60/hour)
- Implement model quantization
- Use smaller ViT model (vit-small instead of vit-base)

### Issue 5: Git LFS Quota Exceeded
**Solution**: Switch to runtime download method or use HF Hub for model hosting

## Testing Your Deployment

### For Gradio Space
```bash
# Just visit the URL in browser
https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
```

### For Docker Space (API)
```bash
curl -X POST \
  https://YOUR_USERNAME-camel-api.hf.space/health

curl -X POST \
  https://YOUR_USERNAME-camel-api.hf.space/api/v1/detect/single \
  -F "image=@test_camel.jpg"
```

## After Deployment

### Update Frontend
Once deployed, update your frontend `.env`:

```env
# For Gradio (if you add API mode)
VITE_ML_API_URL=https://YOUR_USERNAME-camel-beauty-ai.hf.space

# For Docker Space
VITE_ML_API_URL=https://YOUR_USERNAME-camel-api.hf.space
```

### Share Your Space
- Add to your portfolio
- Share on social media
- Submit to HF community showcase

## Cost Estimation

### Free Tier (CPU)
- Cost: $0
- Performance: ~8 sec/image
- Concurrent users: Limited
- Best for: Demo, portfolio

### Paid Tier (T4 Small GPU)
- Cost: ~$0.60/hour ($432/month if always on)
- Performance: ~1 sec/image
- Concurrent users: Multiple
- Best for: Active development, small production

### Paid Tier (A10G GPU)
- Cost: ~$3.15/hour
- Performance: ~0.5 sec/image
- Concurrent users: Many
- Best for: Production with high traffic

## Recommendations

### For Your Use Case (Demo/Testing)
1. ✅ **Deploy Gradio Space on Free CPU tier**
2. ✅ Use runtime model download from Google Drive
3. ✅ Keep original Flask API running locally for development
4. ⏭️ If you need faster inference later, upgrade to T4 GPU

### Next Steps
1. [ ] Upload models to Google Drive (make them publicly accessible)
2. [ ] Get Google Drive file IDs for each model
3. [ ] Create HuggingFace account (if not already)
4. [ ] Create Gradio Space
5. [ ] Push code with model download script
6. [ ] Test with sample images
7. [ ] Share Space URL

## Support

If you encounter issues:
1. Check HF Space logs
2. Review build logs for errors
3. Test models locally first
4. Check HF documentation: https://huggingface.co/docs/hub/spaces
5. HF Discord community: https://discord.gg/huggingface
