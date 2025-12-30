# ML Backend Integration Guide

Complete guide to integrate the Python ML backend with your CamelBeauty platform.

## Overview

Your platform now has a complete ML backend that provides real AI-powered camel beauty detection. This guide explains how to set up and integrate everything.

## Architecture

```
┌──────────────────┐
│  React Frontend  │
│  (Port 5173)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Supabase Edge    │────▶│  Flask ML API    │
│ Functions        │     │  (Port 5000)     │
└──────────────────┘     └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────┐     ┌──────────────────┐
│  Supabase DB     │     │   ML Models      │
│  (PostgreSQL)    │     │  - YOLOv8 Body   │
└──────────────────┘     │  - YOLOv8 Face   │
                         │  - ViT Scorer    │
                         └──────────────────┘
```

## Setup Steps

### Step 1: Download ML Models

```bash
cd backend
./download_models.sh
```

This will download:
- Body Detection Model (~6.5 MB)
- Face Detection Model (~6.5 MB)
- Beauty Scorer Model (~350 MB)

**Manual Alternative:**
1. Download from Google Drive links (see backend/MODEL_SETUP.md)
2. Place in `backend/models/` directory

### Step 2: Update Model Paths

Edit `backend/inference_utils.py` (lines 822-824):

```python
# Change from:
body_seg_model_path = '/content/runs/segment/train_Body_mosaic_0.6/weights/best.pt'
face_seg_model_path = '/content/runs/segment/train_Face_mosaic_0.6/weights/best.pt'
beauty_scorer_checkpoint_path = '/content/Camel_beuty_scoring_model/best_camel_beauty_all_data_model.pth'

# To:
body_seg_model_path = 'models/body/best.pt'
face_seg_model_path = 'models/face/best.pt'
beauty_scorer_checkpoint_path = 'models/scorer/best_camel_beauty_all_data_model.pth'
```

### Step 3: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**For GPU Support (Recommended):**
```bash
# CUDA 11.8
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

### Step 4: Test ML Backend

```bash
cd backend
python app.py
```

You should see:
```
============================================================
CamelBeauty ML API Server
============================================================
Device: cuda:0  (or cpu)
Models loaded successfully
Upload folder: /tmp/camel_uploads
============================================================
 * Running on http://127.0.0.1:5000
```

Test health endpoint:
```bash
curl http://localhost:5000/health
```

### Step 5: Update Environment Variables

Add to `.env`:
```bash
# ML Backend API
VITE_ML_API_URL=http://localhost:5000
VITE_USE_ML_BACKEND=true
```

## Integration Options

### Option 1: Direct Frontend → Flask (Development)

Frontend calls Flask directly:

```typescript
// src/lib/ml-api.ts
const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';

export async function detectCamelBeauty(imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`${ML_API_URL}/api/v1/detect/single`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Detection failed');
  }

  return response.json();
}

export async function detectCamelBatch(imageFiles: File[]) {
  const formData = new FormData();
  imageFiles.forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch(`${ML_API_URL}/api/v1/detect/batch`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Batch detection failed');
  }

  return response.json();
}
```

### Option 2: Edge Function → Flask (Production)

Update your Edge Function to proxy to Flask:

```typescript
// supabase/functions/detect-camel-beauty/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ML_API_URL = Deno.env.get('ML_API_URL') || 'http://localhost:5000';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();

    // Forward to Flask backend
    const mlResponse = await fetch(`${ML_API_URL}/api/v1/detect/single`, {
      method: 'POST',
      body: formData,
    });

    const result = await mlResponse.json();

    // Save to database if needed
    if (result.success && req.method === 'POST') {
      const { data: { user } } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.replace('Bearer ', '')
      );

      if (user) {
        await supabase.from('camel_detections').insert({
          user_id: user.id,
          overall_score: result.results.total_score_0_100,
          head_beauty_score: result.results.scores_dict.head_beauty_score.score_0_100,
          neck_beauty_score: result.results.scores_dict.neck_beauty_score.score_0_100,
          body_hump_limbs_score: result.results.scores_dict.body_limb_hump_beauty_score.score_0_100,
          body_size_score: result.results.scores_dict.body_size_beauty_score.score_0_100,
          category: result.results.scores_dict.category_encoded.predicted_label,
          confidence: result.results.scores_dict.category_encoded.probs[0] * 100,
          image_url: result.image_base64,
          bounding_boxes: [result.body_bbox, result.face_bbox],
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

## Frontend Updates

Update `src/pages/CamelDetection.tsx` to use ML backend:

```typescript
const detectCamelBeauty = async (imageUrl: string) => {
  const USE_ML_BACKEND = import.meta.env.VITE_USE_ML_BACKEND === 'true';

  if (USE_ML_BACKEND) {
    // Use Flask ML backend directly
    const ML_API_URL = import.meta.env.VITE_ML_API_URL;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image', file);

    const mlResponse = await fetch(`${ML_API_URL}/api/v1/detect/single`, {
      method: 'POST',
      body: formData,
    });

    const data = await mlResponse.json();
    return data;
  } else {
    // Use existing Edge Function
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-camel-beauty`;
    // ... existing code
  }
};
```

## Deployment

### Development Setup

1. **Run Flask Backend:**
   ```bash
   cd backend
   python app.py
   ```

2. **Run Frontend:**
   ```bash
   npm run dev
   ```

3. **Test:**
   - Go to http://localhost:5173/detection
   - Upload a camel image
   - See real AI results!

### Production Setup

#### Option A: Separate Servers

**Flask Backend (Port 5000):**
```bash
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

**Frontend (Port 5173):**
```bash
npm run build
npm run preview
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
    }

    # ML API
    location /ml-api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option B: Docker Compose

```yaml
version: '3.8'

services:
  ml-backend:
    build: ./backend
    ports:
      - "5000:5000"
    volumes:
      - ./backend/models:/app/models
    environment:
      - FLASK_ENV=production
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  frontend:
    build: .
    ports:
      - "5173:5173"
    environment:
      - VITE_ML_API_URL=http://ml-backend:5000
      - VITE_USE_ML_BACKEND=true
    depends_on:
      - ml-backend
```

## Performance Considerations

### GPU vs CPU

**GPU (CUDA):**
- Single image: ~0.5-1 second
- Batch (10 images): ~5-10 seconds
- Recommended for production

**CPU:**
- Single image: ~5-10 seconds
- Batch (10 images): ~50-100 seconds
- OK for development/testing

### Optimization Tips

1. **Use GPU if available:**
   ```python
   device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   ```

2. **Batch processing for multiple images:**
   - Use `/api/v1/detect/batch` endpoint
   - More efficient than multiple single calls

3. **Model caching:**
   - Models are loaded once at startup
   - Keep server running for faster responses

4. **Image preprocessing:**
   - Resize large images before upload
   - Optimal size: 800-1200px width

## API Response Format

### Single Detection Response

```json
{
  "success": true,
  "body_bbox": [150, 200, 450, 600],
  "face_bbox": null,
  "results": {
    "scores_dict": {
      "head_beauty_score": {
        "raw_class_score": 9.44,
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
        "probs": [0.98, 0.02],
        "label_ar": "الفئة"
      }
    },
    "total_score_0_100": 93.0,
    "star_rating_0_5": 4.65
  },
  "image_base64": "iVBORw0KGgoAAAANS..."
}
```

## Monitoring & Debugging

### Check Backend Logs

```bash
cd backend
python app.py 2>&1 | tee backend.log
```

### Test Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Single detection
curl -X POST -F "image=@test_camel.jpg" http://localhost:5000/api/v1/detect/single

# Check response time
time curl -X POST -F "image=@test_camel.jpg" http://localhost:5000/api/v1/detect/single
```

### Common Issues

1. **"No camel detected"**
   - Image quality too low
   - Camel not clearly visible
   - Try different angle/lighting

2. **Slow inference**
   - Using CPU instead of GPU
   - Check: `python -c "import torch; print(torch.cuda.is_available())"`

3. **CORS errors**
   - CORS is enabled in Flask backend
   - Check browser console for details

4. **Memory errors**
   - Models require ~1.5GB RAM/VRAM
   - Reduce batch size or use CPU

## Next Steps

1. ✅ Download models
2. ✅ Install dependencies
3. ✅ Start Flask backend
4. ✅ Test API endpoints
5. ✅ Update frontend configuration
6. ✅ Test full integration
7. ✅ Deploy to production

## Support

- Backend Issues: Check `backend/README.md`
- Model Setup: See `backend/MODEL_SETUP.md`
- API Documentation: See backend/app.py
- Frontend Integration: See src/pages/CamelDetection.tsx

## Summary

You now have:
- ✅ Complete Python ML backend
- ✅ Flask REST API
- ✅ Three trained models (body, face, scorer)
- ✅ Single & batch detection endpoints
- ✅ Real-time beauty scoring
- ✅ Production-ready deployment options

Your camel beauty detection platform is now powered by real AI models!
