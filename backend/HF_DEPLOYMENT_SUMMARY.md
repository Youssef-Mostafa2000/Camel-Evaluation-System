# HuggingFace Deployment - Review & Steps

## ✅ Requirements.txt Analysis

### Current Issues Fixed
```diff
- opencv-python==4.8.1.78        # ❌ Has GUI dependencies
+ opencv-python-headless==4.8.1.78  # ✅ Smaller, Docker-friendly

+ gunicorn==21.2.0                # ✅ Production WSGI server
+ gdown==4.7.1                    # ✅ For downloading models from Google Drive
```

### Dependencies Status
| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| flask | 3.0.0 | ✅ OK | Web framework |
| flask-cors | 4.0.0 | ✅ OK | CORS handling |
| torch | 2.1.0 | ✅ OK | ~800MB, use CPU version for free tier |
| torchvision | 0.16.0 | ✅ OK | Computer vision utilities |
| transformers | 4.35.0 | ✅ OK | For ViT model |
| ultralytics | 8.0.230 | ✅ OK | YOLOv8 framework |
| opencv-python-headless | 4.8.1.78 | ✅ OK | Image processing (fixed) |
| pillow | 10.1.0 | ✅ OK | Image handling |
| numpy | 1.24.3 | ✅ OK | Numerical computing |

**Total Size**: ~3.5GB installed

## ✅ App.py Analysis

### Structure
```
app.py (218 lines)
├── Flask app initialization
├── CORS configuration
├── Model path configuration (✅ Fixed to use relative paths)
├── Helper functions
│   ├── image_to_base64()
│   └── create_annotated_image()
├── API Endpoints
│   ├── GET /health
│   ├── GET /api/v1/config/models
│   ├── POST /api/v1/detect/single
│   └── POST /api/v1/detect/batch
└── Main execution
```

### Issues Fixed
```diff
- MODEL_PATHS = {'/content/runs/...'}  # ❌ Hardcoded Colab paths
+ MODEL_PATHS = {
+     'body_model': os.path.join(BASE_DIR, 'models/body/best.pt'),
+     ...
+ }  # ✅ Relative paths
```

### Ready for HuggingFace
- ✅ Relative paths for models
- ✅ CORS configured
- ✅ Health check endpoint
- ✅ Proper error handling
- ✅ Temp directory handling

## 📋 Deployment Options

### Option 1: Gradio Space (Recommended) ⭐

**Pros:**
- ✅ Free tier available (16GB RAM, 50GB storage)
- ✅ Built-in UI (no frontend coding needed)
- ✅ Easy to deploy and share
- ✅ Perfect for demos and portfolios
- ✅ No Docker knowledge required

**Cons:**
- ❌ Limited customization of UI
- ❌ CPU inference slower (~8 sec/image)
- ❌ Not ideal for production API

**Best For:** Demo, portfolio, testing, free hosting

**Files Created:**
- ✅ `app_gradio.py` - Gradio interface wrapper
- ✅ `requirements_gradio.txt` - Dependencies for Gradio
- ✅ `README_HUGGINGFACE.md` - HF Space README
- ✅ `prepare_hf_deployment.sh` - Automated setup script

### Option 2: Docker Space

**Pros:**
- ✅ Keep your Flask API as-is
- ✅ Full control over backend
- ✅ Can be called as API from your React frontend
- ✅ RESTful endpoints maintained

**Cons:**
- ❌ Requires Docker knowledge
- ❌ More complex setup
- ❌ Still limited by free tier resources

**Best For:** API development, integration testing

**Files Ready:**
- ✅ `Dockerfile` - Already created and updated
- ✅ `app.py` - Flask API ready
- ✅ `requirements.txt` - Updated with fixes

### Option 3: Inference Endpoints (Production)

**Pros:**
- ✅ Auto-scaling
- ✅ High availability
- ✅ Load balancing
- ✅ Production-ready
- ✅ Monitoring included

**Cons:**
- ❌ Paid only (~$0.60/hour minimum)
- ❌ More complex setup
- ❌ Overkill for demos

**Best For:** Production deployments with traffic

## 🚀 Quick Start Guide

### For Gradio Deployment (Easiest)

```bash
# 1. Run preparation script
cd backend
bash prepare_hf_deployment.sh

# 2. Update model file IDs in hf-deploy/download_models.py
# Replace 'YOUR_*_MODEL_FILE_ID' with actual Google Drive IDs

# 3. Test locally (optional)
cd hf-deploy
pip install -r requirements.txt
python download_models.py  # Download models
python app.py              # Test Gradio interface

# 4. Deploy to HuggingFace
huggingface-cli login
# Create Space at: https://huggingface.co/new-space (SDK: Gradio)
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
cd camel-beauty-ai
cp -r ../hf-deploy/* .
git add .
git commit -m "Initial deployment"
git push

# 5. Visit your Space!
# https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
```

### For Docker Deployment

```bash
# 1. Create Docker Space at: https://huggingface.co/new-space (SDK: Docker)

# 2. Clone and setup
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-api
cd camel-api

# 3. Copy files
cp ../backend/Dockerfile .
cp ../backend/app.py .
cp ../backend/inference_utils.py .
cp ../backend/requirements.txt .

# 4. Create README
cat > README.md << 'EOF'
---
title: CamelBeauty ML API
emoji: 🐫
sdk: docker
---
# CamelBeauty ML API
REST API for camel beauty assessment.
EOF

# 5. Push
git add .
git commit -m "Deploy Flask API"
git push
```

## 📊 Resource Requirements

### HuggingFace Free Tier
| Resource | Limit | Your App | Status |
|----------|-------|----------|--------|
| RAM | 16GB | ~6GB (models + inference) | ✅ OK |
| Storage | 50GB | ~4GB (code + models) | ✅ OK |
| CPU | 2 cores | Adequate | ⚠️ Slow |
| Inference Time | N/A | ~8 sec/image | ⚠️ Slow but usable |

### Recommendations
- **For Demo**: Free tier is sufficient
- **For Better Performance**: Upgrade to T4 GPU ($0.60/hour)
  - Inference time: ~1 second/image
  - Better user experience
  - Still affordable ($14.40/day if always running)

## 🎯 Model Files Strategy

### Problem
- Models total ~2GB
- Cannot push large files directly to git
- Git LFS free quota: 1GB/month bandwidth

### Solution Options

#### Option A: Git LFS (If bandwidth sufficient)
```bash
git lfs install
git lfs track "*.pt" "*.pth"
# Add models and push
```

**Pros**: Models in repo, automatic loading
**Cons**: LFS bandwidth limits, slow downloads

#### Option B: Runtime Download from Google Drive (Recommended)
```bash
# In app.py startup:
if not os.path.exists('models/body/best.pt'):
    from download_models import download_models
    download_models()
```

**Pros**: No LFS limits, faster deploys
**Cons**: First run takes longer

#### Option C: Upload to HuggingFace Hub
```bash
huggingface-cli repo create camel-models --type model
# Upload models to model repo
# Load from hub in code
```

**Pros**: Free unlimited bandwidth, integrated with HF
**Cons**: Requires separate model repo

## ⚠️ Critical Pre-Deployment Checklist

- [ ] Upload your 3 model files to Google Drive
- [ ] Set files to "Anyone with link can view"
- [ ] Get Google Drive file IDs (from share links)
- [ ] Update `download_models.py` with actual file IDs
- [ ] Test model download locally
- [ ] Create HuggingFace account
- [ ] Generate HF access token
- [ ] Install HF CLI: `pip install huggingface_hub`
- [ ] Login: `huggingface-cli login`

## 📝 Step-by-Step Deployment

### Phase 1: Prepare Models
1. Upload models to Google Drive
   - `models/body/best.pt` → Get file ID
   - `models/face/best.pt` → Get file ID
   - `models/scorer/best_camel_beauty_all_data_model.pth` → Get file ID

2. Make files publicly accessible
   - Right-click → Share → Anyone with link can view

3. Extract file IDs from share links
   ```
   https://drive.google.com/file/d/FILE_ID_HERE/view
   ```

### Phase 2: Setup Deployment Files
```bash
cd backend
bash prepare_hf_deployment.sh
cd hf-deploy
# Edit download_models.py with your file IDs
```

### Phase 3: Test Locally
```bash
pip install -r requirements.txt
python download_models.py  # Should download all 3 models
python app.py              # Should start Gradio on port 7860
# Visit http://localhost:7860
# Test with a camel image
```

### Phase 4: Deploy to HuggingFace
```bash
# Create Space: https://huggingface.co/new-space
# Then:
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
cd camel-beauty-ai
cp -r ../hf-deploy/* .
git add .
git commit -m "Initial deployment"
git push
```

### Phase 5: Monitor & Test
1. Visit Space URL
2. Watch build logs
3. Wait for "Running" status
4. Test with sample images
5. Share with others!

## 🆘 Troubleshooting

### Build Fails: "No module named 'cv2'"
**Fix**: Already fixed! Changed to `opencv-python-headless`

### Build Fails: "Cannot download models"
**Fix**:
- Check Google Drive file permissions
- Verify file IDs are correct
- Ensure files are <5GB each

### Runtime Error: "CUDA out of memory"
**Fix**: Free tier is CPU-only, this shouldn't happen. If it does:
```python
device = torch.device("cpu")  # Force CPU
```

### Inference Too Slow (>30 seconds)
**Fix**: Upgrade to GPU instance (T4 Small) or accept ~8 sec on CPU

### Space Crashes on Startup
**Fix**: Check logs, usually model loading issue or missing dependencies

## 🎓 Learning Resources

- [HuggingFace Spaces Docs](https://huggingface.co/docs/hub/spaces)
- [Gradio Documentation](https://gradio.app/docs)
- [Git LFS Guide](https://git-lfs.github.com/)
- [HuggingFace Community Forum](https://discuss.huggingface.co/)

## 📧 Support

If stuck, check:
1. ✅ All files in `hf-deploy/` folder
2. ✅ Model file IDs updated
3. ✅ `.gitattributes` for Git LFS
4. ✅ HF Space build logs for errors
5. ✅ Test locally first before deploying

## 🎉 Success Metrics

Once deployed successfully, you'll have:
- ✅ Public demo of your AI model
- ✅ Shareable URL for portfolio
- ✅ Working inference on sample images
- ✅ Professional showcase of your work
- ✅ Free hosting (on CPU tier)

**Estimated Time**: 30-60 minutes for first deployment

Good luck! 🚀
