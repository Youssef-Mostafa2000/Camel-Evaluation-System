#!/bin/bash

# CamelBeauty ML Models Download Script
# This script downloads all required ML models from Google Drive

echo "============================================================"
echo "CamelBeauty ML Models Download Script"
echo "============================================================"

# Check if gdown is installed
if ! command -v gdown &> /dev/null; then
    echo "gdown not found. Installing..."
    pip install gdown
fi

# Create model directories
echo "Creating model directories..."
mkdir -p models/body
mkdir -p models/face
mkdir -p models/scorer

# Download Body Detection Model
echo ""
echo "Downloading Body Detection Model..."
gdown "https://drive.google.com/uc?id=1z-4wlAHLoPicz2opaVawf-uteLIbY9cs" -O models/body/best.pt

if [ -f "models/body/best.pt" ]; then
    echo "✓ Body Detection Model downloaded successfully"
    ls -lh models/body/best.pt
else
    echo "✗ Failed to download Body Detection Model"
    exit 1
fi

# Download Face Detection Model
echo ""
echo "Downloading Face Detection Model..."
gdown "https://drive.google.com/uc?id=1Rk7fiatvsR1XurXL8BvEsyoMFINn6YGZ" -O models/face/best.pt

if [ -f "models/face/best.pt" ]; then
    echo "✓ Face Detection Model downloaded successfully"
    ls -lh models/face/best.pt
else
    echo "✗ Failed to download Face Detection Model"
    exit 1
fi

# Download Beauty Scorer Model
echo ""
echo "Downloading Beauty Scorer Model..."
gdown "https://drive.google.com/uc?id=1WDXhFo-wJYu1RzKNcRNY3ZEyKdvyXvAi" -O models/scorer/best_camel_beauty_all_data_model.pth

if [ -f "models/scorer/best_camel_beauty_all_data_model.pth" ]; then
    echo "✓ Beauty Scorer Model downloaded successfully"
    ls -lh models/scorer/best_camel_beauty_all_data_model.pth
else
    echo "✗ Failed to download Beauty Scorer Model"
    exit 1
fi

# Summary
echo ""
echo "============================================================"
echo "Download Summary"
echo "============================================================"
echo "Body Model: $(ls -lh models/body/best.pt | awk '{print $5}')"
echo "Face Model: $(ls -lh models/face/best.pt | awk '{print $5}')"
echo "Scorer Model: $(ls -lh models/scorer/best_camel_beauty_all_data_model.pth | awk '{print $5}')"
echo ""
echo "Total Size: $(du -sh models/ | awk '{print $1}')"
echo ""
echo "✓ All models downloaded successfully!"
echo ""
echo "Next steps:"
echo "1. Update model paths in inference_utils.py"
echo "2. Install dependencies: pip install -r requirements.txt"
echo "3. Test setup: python -c 'from inference_utils import *; print(\"Models loaded!\")'"
echo "4. Run Flask server: python app.py"
echo "============================================================"
