import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DetectionRequest {
  imageUrl?: string;
  imageFile?: string;
  metadata?: {
    age?: number;
    sex?: string;
    breed?: string;
    [key: string]: any;
  };
  saveToDatabase?: boolean;
  isPublic?: boolean;
}

interface BeautyScores {
  overall_score: number;
  head_beauty_score: number;
  neck_beauty_score: number;
  body_hump_limbs_score: number;
  body_size_score: number;
  category: 'beautiful' | 'ugly';
  confidence: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

interface DetectionResult extends BeautyScores {
  bounding_boxes: BoundingBox[];
  processing_time: number;
}

/**
 * Mock camel beauty detection function
 * 
 * In production, replace this with actual API call to your camel detection model.
 * For example:
 * 
 * const response = await fetch('https://your-detection-api.com/detect', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${Deno.env.get('DETECTION_API_KEY')}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({ image_url: imageUrl }),
 * });
 * 
 * const result = await response.json();
 * return result;
 */
async function detectCamelBeauty(imageUrl: string): Promise<DetectionResult> {
  const startTime = Date.now();
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const headScore = 70 + Math.random() * 30;
  const neckScore = 65 + Math.random() * 35;
  const bodyScore = 75 + Math.random() * 25;
  const sizeScore = 80 + Math.random() * 20;
  
  const overallScore = (
    headScore * 0.25 +
    neckScore * 0.25 +
    bodyScore * 0.30 +
    sizeScore * 0.20
  );
  
  const category: 'beautiful' | 'ugly' = overallScore >= 75 ? 'beautiful' : 'ugly';
  const confidence = 85 + Math.random() * 10;
  
  const boundingBoxes: BoundingBox[] = [
    {
      x: 150,
      y: 100,
      width: 200,
      height: 180,
      label: 'head',
    },
    {
      x: 100,
      y: 250,
      width: 400,
      height: 350,
      label: 'body',
    },
  ];
  
  const processingTime = Date.now() - startTime;
  
  return {
    overall_score: Math.round(overallScore * 100) / 100,
    head_beauty_score: Math.round(headScore * 100) / 100,
    neck_beauty_score: Math.round(neckScore * 100) / 100,
    body_hump_limbs_score: Math.round(bodyScore * 100) / 100,
    body_size_score: Math.round(sizeScore * 100) / 100,
    category,
    confidence: Math.round(confidence * 100) / 100,
    bounding_boxes: boundingBoxes,
    processing_time: processingTime,
  };
}

function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id || null;
    }

    const requestData: DetectionRequest = await req.json();
    const { imageUrl, metadata = {}, saveToDatabase = true, isPublic = false } = requestData;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const detectionResult = await detectCamelBeauty(imageUrl);

    let savedDetection = null;
    if (saveToDatabase) {
      const filename = imageUrl.split('/').pop() || 'unknown.jpg';
      const shareToken = generateShareToken();

      const { data, error } = await supabaseClient
        .from('camel_detections')
        .insert([
          {
            user_id: userId,
            image_url: imageUrl,
            image_filename: filename,
            overall_score: detectionResult.overall_score,
            head_beauty_score: detectionResult.head_beauty_score,
            neck_beauty_score: detectionResult.neck_beauty_score,
            body_hump_limbs_score: detectionResult.body_hump_limbs_score,
            body_size_score: detectionResult.body_size_score,
            category: detectionResult.category,
            confidence: detectionResult.confidence,
            bounding_boxes: detectionResult.bounding_boxes,
            metadata: metadata,
            is_public: isPublic,
            share_token: shareToken,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error saving detection:', error);
        throw error;
      }

      savedDetection = data;
    }

    return new Response(
      JSON.stringify({
        success: true,
        detection: detectionResult,
        saved: savedDetection,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in detect-camel-beauty:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
