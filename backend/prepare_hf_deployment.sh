#!/bin/bash

# CamelBeauty AI - HuggingFace Deployment Preparation Script

echo "=========================================="
echo "🐫 CamelBeauty AI - HF Deployment Prep"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create deployment directory
DEPLOY_DIR="hf-deploy"
echo "📁 Creating deployment directory: $DEPLOY_DIR"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Copy necessary files
echo "📋 Copying necessary files..."
cp ../app_gradio.py app.py
cp ../inference_utils.py .
cp ../requirements_gradio.txt requirements.txt
cp ../README_HUGGINGFACE.md README.md

# Create .gitattributes for Git LFS
echo "🔧 Creating .gitattributes for Git LFS..."
cat > .gitattributes << 'EOF'
*.pt filter=lfs diff=lfs merge=lfs -text
*.pth filter=lfs diff=lfs merge=lfs -text
*.bin filter=lfs diff=lfs merge=lfs -text
*.h5 filter=lfs diff=lfs merge=lfs -text
EOF

# Create model download script
echo "📥 Creating model download script..."
cat > download_models.py << 'EOF'
import os
import gdown

def download_models():
    """
    Download models from Google Drive
    Replace the file IDs with your actual Google Drive file IDs
    """
    models_dir = 'models'

    # Create directories
    os.makedirs(f'{models_dir}/body', exist_ok=True)
    os.makedirs(f'{models_dir}/face', exist_ok=True)
    os.makedirs(f'{models_dir}/scorer', exist_ok=True)

    print("=" * 60)
    print("Downloading CamelBeauty AI Models")
    print("=" * 60)

    # TODO: Replace these with your actual Google Drive file IDs
    # Get file ID from share link: https://drive.google.com/file/d/FILE_ID/view

    files = {
        'body': {
            'id': 'YOUR_BODY_MODEL_FILE_ID',
            'path': f'{models_dir}/body/best.pt',
            'name': 'Body Detection Model'
        },
        'face': {
            'id': 'YOUR_FACE_MODEL_FILE_ID',
            'path': f'{models_dir}/face/best.pt',
            'name': 'Face Detection Model'
        },
        'scorer': {
            'id': 'YOUR_SCORER_MODEL_FILE_ID',
            'path': f'{models_dir}/scorer/best_camel_beauty_all_data_model.pth',
            'name': 'Beauty Scorer Model'
        }
    }

    for key, file_info in files.items():
        if file_info['id'] == f'YOUR_{key.upper()}_MODEL_FILE_ID':
            print(f"⚠️  WARNING: {file_info['name']} ID not set!")
            print(f"   Please update the file ID in download_models.py")
            continue

        if os.path.exists(file_info['path']):
            print(f"✓ {file_info['name']} already exists, skipping...")
            continue

        print(f"📥 Downloading {file_info['name']}...")
        try:
            gdown.download(
                f'https://drive.google.com/uc?id={file_info["id"]}',
                file_info['path'],
                quiet=False
            )
            print(f"✓ {file_info['name']} downloaded successfully!")
        except Exception as e:
            print(f"✗ Error downloading {file_info['name']}: {e}")

    print("=" * 60)
    print("Model download complete!")
    print("=" * 60)

if __name__ == "__main__":
    download_models()
EOF

# Update app.py to download models on first run
echo "🔄 Updating app.py with model download check..."
cat > app_updated.py << 'EOF'
import os

# Download models if not present
if not os.path.exists('models/body/best.pt'):
    print("=" * 60)
    print("Models not found. Downloading from Google Drive...")
    print("=" * 60)
    try:
        from download_models import download_models
        download_models()
        print("✓ Models ready!")
    except Exception as e:
        print(f"✗ Error downloading models: {e}")
        print("Please download models manually and place them in:")
        print("  - models/body/best.pt")
        print("  - models/face/best.pt")
        print("  - models/scorer/best_camel_beauty_all_data_model.pth")
        raise

# Import the rest of app.py
EOF

cat app.py >> app_updated.py
mv app_updated.py app.py

# Create deployment instructions
echo "📝 Creating deployment instructions..."
cat > DEPLOY_INSTRUCTIONS.md << 'EOF'
# HuggingFace Deployment Instructions

## Step 1: Update Model Download Script

Edit `download_models.py` and replace the placeholder file IDs with your actual Google Drive file IDs:

```python
'body': {
    'id': 'YOUR_ACTUAL_FILE_ID_HERE',  # Replace this
    ...
}
```

To get file IDs from Google Drive:
1. Right-click file → Share → Copy link
2. Extract ID from: `https://drive.google.com/file/d/FILE_ID_HERE/view`

## Step 2: Install HuggingFace CLI

```bash
pip install huggingface_hub
huggingface-cli login
```

Paste your token from: https://huggingface.co/settings/tokens

## Step 3: Create HuggingFace Space

1. Go to: https://huggingface.co/new-space
2. Settings:
   - Name: `camel-beauty-ai`
   - License: `MIT`
   - SDK: `Gradio`
   - Hardware: `CPU Basic` (free) or `T4 Small` (paid)
   - Visibility: `Public`

## Step 4: Clone and Deploy

```bash
# Clone your new space
git clone https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai
cd camel-beauty-ai

# Copy deployment files
cp -r ../hf-deploy/* .

# Initialize Git LFS (if using local models)
git lfs install
git lfs track "*.pt" "*.pth"

# Commit and push
git add .
git commit -m "Initial deployment"
git push
```

## Step 5: Monitor Deployment

Visit your space: `https://huggingface.co/spaces/YOUR_USERNAME/camel-beauty-ai`

Check logs for build progress and any errors.

## Troubleshooting

### Models not downloading
- Ensure Google Drive files are publicly accessible
- Check file IDs are correct
- Verify internet connectivity in HF build environment

### Build timeout
- Reduce model size or use CPU-only PyTorch
- Upgrade to paid tier for longer build times

### Out of memory
- Use CPU inference for free tier
- Upgrade to GPU tier for faster inference

## Alternative: Use Git LFS for Models

If models are < 5GB each:

```bash
# In your space directory
git lfs track "*.pt" "*.pth"

# Copy models
mkdir -p models/body models/face models/scorer
cp /path/to/models/body/best.pt models/body/
cp /path/to/models/face/best.pt models/face/
cp /path/to/models/scorer/best_camel_beauty_all_data_model.pth models/scorer/

# Commit
git add .
git commit -m "Add model files"
git push
```

## Need Help?

- HF Docs: https://huggingface.co/docs/hub/spaces
- HF Forum: https://discuss.huggingface.co/
- HF Discord: https://discord.gg/huggingface
EOF

echo ""
echo -e "${GREEN}✓ Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. cd $DEPLOY_DIR"
echo "2. Edit download_models.py with your Google Drive file IDs"
echo "3. Follow instructions in DEPLOY_INSTRUCTIONS.md"
echo ""
echo "Files created:"
echo "  - app.py (Gradio interface)"
echo "  - inference_utils.py (ML inference code)"
echo "  - requirements.txt (Python dependencies)"
echo "  - README.md (Space description)"
echo "  - download_models.py (Model download script)"
echo "  - .gitattributes (Git LFS configuration)"
echo "  - DEPLOY_INSTRUCTIONS.md (Step-by-step guide)"
echo ""
echo -e "${YELLOW}⚠️  Remember to update download_models.py with your file IDs!${NC}"
