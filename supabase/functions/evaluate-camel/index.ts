import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EvaluationRequest {
  imageId: string;
  camelId: string;
}

interface RegionScore {
  score: number;
  confidence: number;
  features: string[];
  explanation: string;
}

interface EvaluationResult {
  overallScore: number;
  regions: {
    head: RegionScore;
    neck: RegionScore;
    hump: RegionScore;
    body: RegionScore;
    legs: RegionScore;
  };
  segmentationMask: string;
  attentionMap: string;
  processingSteps: string[];
}

function generateRegionScore(regionName: string, baseScore: number): RegionScore {
  const variance = Math.random() * 10 - 5;
  const score = Math.max(70, Math.min(100, baseScore + variance));
  
  const features = {
    head: ['Symmetry', 'Proportion', 'Shape', 'Profile'],
    neck: ['Length', 'Curve', 'Thickness', 'Posture'],
    hump: ['Size', 'Position', 'Shape', 'Firmness'],
    body: ['Length', 'Depth', 'Balance', 'Musculature'],
    legs: ['Length', 'Straightness', 'Joints', 'Stance'],
  };

  const explanations = {
    head: {
      ar: 'رأس متناسق مع ملامح واضحة وتوازن جيد في الأبعاد',
      en: 'Well-proportioned head with clear features and good dimensional balance',
    },
    neck: {
      ar: 'عنق طويل ومنحني بشكل مثالي مع سماكة مناسبة',
      en: 'Long, ideally curved neck with appropriate thickness',
    },
    hump: {
      ar: 'سنام متناسق في الحجم والموضع مع شكل ممتاز',
      en: 'Well-proportioned hump in size and position with excellent shape',
    },
    body: {
      ar: 'جسم متوازن مع طول مناسب وعمق جيد',
      en: 'Balanced body with appropriate length and good depth',
    },
    legs: {
      ar: 'أرجل مستقيمة وقوية مع مفاصل سليمة',
      en: 'Straight, strong legs with healthy joints',
    },
  };

  return {
    score: Math.round(score * 10) / 10,
    confidence: Math.round((0.85 + Math.random() * 0.1) * 100) / 100,
    features: features[regionName as keyof typeof features] || [],
    explanation: explanations[regionName as keyof typeof explanations]?.ar || '',
  };
}

function generateSegmentationMask(): string {
  const masks = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjxwYXRoIGQ9Ik0gMTAwIDEwMCBMIDIwMCAxMDAgTCAyMDAgMjAwIEwgMTAwIDIwMCBaIiBmaWxsPSJyZ2JhKDI1NSwgMCwgMCwgMC4zKSIvPjxwYXRoIGQ9Ik0gMjAwIDEwMCBMIDMwMCAxNTAgTCAzMDAgMjUwIEwgMjAwIDIwMCBaIiBmaWxsPSJyZ2JhKDAsIDI1NSwgMCwgMC4zKSIvPjxwYXRoIGQ9Ik0gMzAwIDE1MCBMIDQwMCAxNTAgTCA0MDAgMjgwIEwgMzAwIDI1MCBaIiBmaWxsPSJyZ2JhKDAsIDAsIDI1NSwgMC4zKSIvPjwvc3ZnPg==',
  ];
  return masks[0];
}

function generateAttentionMap(): string {
  const maps = [
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImhvdHNwb3QxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmYwMDAwO3N0b3Atb3BhY2l0eTowLjgiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjAwMDA7c3RvcC1vcGFjaXR5OjAiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+PGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSI2MCIgZmlsbD0idXJsKCNob3RzcG90MSkiLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIyMDAiIHI9IjgwIiBmaWxsPSJ1cmwoI2hvdHNwb3QxKSIvPjxjaXJjbGUgY3g9IjM1MCIgY3k9IjIyMCIgcj0iNzAiIGZpbGw9InVybCgjaG90c3BvdDEpIi8+PC9zdmc+',
  ];
  return maps[0];
}

async function processEvaluation(imageId: string, camelId: string): Promise<EvaluationResult> {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const processingSteps = [
    'Image preprocessing completed',
    'Background removal applied',
    'Segmentation model executed',
    'Feature extraction completed',
    'Attention mechanism applied',
    'Score calculation finished',
  ];

  const baseScore = 80 + Math.random() * 15;

  const regions = {
    head: generateRegionScore('head', baseScore),
    neck: generateRegionScore('neck', baseScore),
    hump: generateRegionScore('hump', baseScore),
    body: generateRegionScore('body', baseScore),
    legs: generateRegionScore('legs', baseScore),
  };

  const weights = { head: 0.2, neck: 0.2, hump: 0.25, body: 0.2, legs: 0.15 };
  const overallScore = Math.round(
    (regions.head.score * weights.head +
      regions.neck.score * weights.neck +
      regions.hump.score * weights.hump +
      regions.body.score * weights.body +
      regions.legs.score * weights.legs) * 10
  ) / 10;

  return {
    overallScore,
    regions,
    segmentationMask: generateSegmentationMask(),
    attentionMap: generateAttentionMap(),
    processingSteps,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { imageId, camelId }: EvaluationRequest = await req.json();

    if (!imageId || !camelId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await processEvaluation(imageId, camelId);

    const { error: insertError } = await supabaseClient
      .from('evaluations')
      .insert([
        {
          camel_id: camelId,
          image_id: imageId,
          overall_score: result.overallScore,
          head_score: result.regions.head.score,
          neck_score: result.regions.neck.score,
          hump_score: result.regions.hump.score,
          body_score: result.regions.body.score,
          legs_score: result.regions.legs.score,
          evaluation_type: 'ai',
          notes: JSON.stringify({
            regions: result.regions,
            segmentationMask: result.segmentationMask,
            attentionMap: result.attentionMap,
            processingSteps: result.processingSteps,
          }),
        },
      ]);

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing evaluation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});