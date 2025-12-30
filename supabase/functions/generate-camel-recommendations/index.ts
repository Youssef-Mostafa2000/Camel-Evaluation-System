import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RecommendationRequest {
  detectionId: string;
  recommendationType: 'care' | 'breeding' | 'health' | 'custom';
  customPrompt?: string;
  scores?: {
    overall: number;
    head: number;
    neck: number;
    body: number;
    size: number;
  };
  metadata?: {
    age?: number;
    sex?: string;
    breed?: string;
    [key: string]: any;
  };
}

/**
 * Generate AI-powered recommendations using OpenAI GPT-4
 * 
 * IMPORTANT: To use this function, you need to:
 * 1. Get an OpenAI API key from https://platform.openai.com/api-keys
 * 2. Add it to your environment variables as OPENAI_API_KEY
 * 
 * For now, this returns mock recommendations. Once you have an API key,
 * uncomment the actual OpenAI API call below.
 */
async function generateRecommendation(
  type: string,
  scores: any,
  metadata: any,
  customPrompt?: string
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    return getMockRecommendation(type, scores, metadata);
  }

  const systemPrompt = `You are an expert camel breeding and care specialist with deep knowledge of camel beauty standards, health, nutrition, and genetics. Provide detailed, actionable recommendations based on the camel's beauty assessment scores.`;

  let userPrompt = '';
  
  if (customPrompt) {
    userPrompt = customPrompt;
  } else {
    switch (type) {
      case 'care':
        userPrompt = `Based on these beauty scores:
- Overall: ${scores.overall}/100
- Head Beauty: ${scores.head}/100
- Neck Beauty: ${scores.neck}/100
- Body/Hump/Limbs: ${scores.body}/100
- Body Size: ${scores.size}/100

Camel Details:
- Age: ${metadata.age || 'Unknown'}
- Sex: ${metadata.sex || 'Unknown'}
- Breed: ${metadata.breed || 'Unknown'}

Provide a comprehensive care routine recommendation including:
1. Nutrition plan to improve weak areas
2. Exercise routine
3. Grooming recommendations
4. Supplement suggestions
5. Timeline for expected improvements`;
        break;
        
      case 'breeding':
        userPrompt = `Based on these beauty scores:
- Overall: ${scores.overall}/100
- Head Beauty: ${scores.head}/100
- Neck Beauty: ${scores.neck}/100
- Body/Hump/Limbs: ${scores.body}/100
- Body Size: ${scores.size}/100

Camel Details:
- Sex: ${metadata.sex || 'Unknown'}
- Breed: ${metadata.breed || 'Unknown'}

Provide breeding recommendations:
1. Ideal breeding partner traits to improve offspring
2. Specific attributes to look for
3. Genetic considerations
4. Best breeding timing
5. Expected offspring improvements`;
        break;
        
      case 'health':
        userPrompt = `Based on these beauty scores:
- Overall: ${scores.overall}/100
- Head Beauty: ${scores.head}/100
- Neck Beauty: ${scores.neck}/100
- Body/Hump/Limbs: ${scores.body}/100
- Body Size: ${scores.size}/100

Camel Details:
- Age: ${metadata.age || 'Unknown'}
- Sex: ${metadata.sex || 'Unknown'}

Provide a health and fitness assessment:
1. Health indicators from beauty scores
2. Potential health concerns
3. Fitness improvement strategies
4. Preventive care recommendations
5. Monitoring guidelines`;
        break;
        
      default:
        userPrompt = customPrompt || 'Provide general camel care recommendations.';
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return getMockRecommendation(type, scores, metadata);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getMockRecommendation(type, scores, metadata);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getMockRecommendation(type, scores, metadata);
  }
}

function getMockRecommendation(type: string, scores: any, metadata: any): string {
  const weakestArea = getWeakestArea(scores);
  
  const recommendations: Record<string, string> = {
    care: `**Personalized Care Plan**\n\n**Priority Focus: ${weakestArea.name}**\n\nBased on the beauty assessment, here's a comprehensive care routine:\n\n**1. Nutrition Enhancement**\n- High-protein diet with alfalfa hay (3-4 kg daily)\n- Mineral supplements rich in calcium and phosphorus\n- Fresh vegetables (carrots, lettuce) for vitamins\n- Ensure constant access to clean water\n\n**2. Exercise Routine**\n- Daily walks for 30-45 minutes\n- Light training sessions 3x per week\n- Swimming exercises if available (excellent for muscle tone)\n\n**3. Grooming Schedule**\n- Daily brushing to improve coat quality\n- Bi-weekly hoof care\n- Monthly professional grooming session\n- Special attention to ${weakestArea.name.toLowerCase()} area\n\n**4. Supplements**\n- Omega-3 fatty acids for coat shine\n- Joint support supplements\n- Vitamin E and selenium\n\n**Expected Timeline:**\n- Visible improvements in 4-6 weeks\n- Significant changes in 3-4 months\n- Optimal results in 6-8 months`,
    
    breeding: `**Breeding Strategy Recommendation**\n\n**Current Assessment:**\n- Overall Score: ${scores.overall}/100\n- Strongest Feature: ${getStrongestArea(scores).name}\n- Area for Improvement: ${weakestArea.name}\n\n**Ideal Partner Traits:**\n1. **${weakestArea.name}:** Look for exceptional scores (90+/100)\n2. **Body Structure:** Well-proportioned with strong genetics\n3. **Temperament:** Calm and trainable\n4. **Health History:** Clean genetic background\n\n**Breeding Considerations:**\n- Breed during optimal season (cool weather)\n- Ensure both camels are in prime health\n- Document lineage for future reference\n- Consider consulting with breeding specialists\n\n**Expected Offspring:**\n- 60-70% chance of improved ${weakestArea.name.toLowerCase()}\n- Combined strengths from both parents\n- Potential overall score improvement of 10-15 points\n\n**Genetic Factors:**\n- ${weakestArea.name} traits are moderately heritable\n- Multiple breeding cycles may be needed for optimal results\n- Maintain detailed records for breeding program`,
    
    health: `**Health & Fitness Assessment**\n\n**Beauty-Health Correlation Analysis:**\n\n**Overall Health Score: ${Math.round(scores.overall * 0.9)}/100**\n\n**Positive Indicators:**\n- ${getStrongestArea(scores).name}: Excellent (${getStrongestArea(scores).score}/100)\n- Good body proportions suggest healthy development\n- No immediate concerns visible\n\n**Areas Requiring Attention:**\n- ${weakestArea.name}: ${weakestArea.score}/100 (Below optimal)\n- May indicate nutritional deficiency or lack of exercise\n\n**Improvement Strategies:**\n\n**1. Fitness Program**\n- Cardio exercises: 30 min daily walks\n- Strength training: Hill climbing 2x weekly\n- Flexibility: Stretching and rest periods\n\n**2. Nutritional Optimization**\n- Balanced diet with adequate protein\n- Supplements targeting weak areas\n- Regular feeding schedule\n\n**3. Preventive Care**\n- Monthly veterinary checkups\n- Dental care every 6 months\n- Parasite control program\n- Vaccination schedule maintenance\n\n**4. Monitoring Guidelines**\n- Weekly weight tracking\n- Monthly progress photos\n- Quarterly professional assessment\n- Annual comprehensive health exam\n\n**Expected Outcomes:**\n- Improved ${weakestArea.name.toLowerCase()} in 2-3 months\n- Overall health enhancement in 4-6 months\n- Sustained improvement with consistent care`,
  };

  return recommendations[type] || recommendations.care;
}

function getWeakestArea(scores: any): { name: string; score: number } {
  const areas = [
    { name: 'Head Beauty', score: scores.head },
    { name: 'Neck Beauty', score: scores.neck },
    { name: 'Body/Hump/Limbs', score: scores.body },
    { name: 'Body Size', score: scores.size },
  ];
  
  return areas.reduce((min, area) => area.score < min.score ? area : min);
}

function getStrongestArea(scores: any): { name: string; score: number } {
  const areas = [
    { name: 'Head Beauty', score: scores.head },
    { name: 'Neck Beauty', score: scores.neck },
    { name: 'Body/Hump/Limbs', score: scores.body },
    { name: 'Body Size', score: scores.size },
  ];
  
  return areas.reduce((max, area) => area.score > max.score ? area : max);
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

    const requestData: RecommendationRequest = await req.json();
    const {
      detectionId,
      recommendationType,
      customPrompt,
      scores,
      metadata = {},
    } = requestData;

    if (!detectionId || !recommendationType) {
      return new Response(
        JSON.stringify({ error: 'Detection ID and recommendation type are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let detectionScores = scores;
    let detectionMetadata = metadata;

    if (!scores) {
      const { data: detection, error } = await supabaseClient
        .from('camel_detections')
        .select('*')
        .eq('id', detectionId)
        .single();

      if (error || !detection) {
        return new Response(
          JSON.stringify({ error: 'Detection not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      detectionScores = {
        overall: detection.overall_score,
        head: detection.head_beauty_score,
        neck: detection.neck_beauty_score,
        body: detection.body_hump_limbs_score,
        size: detection.body_size_score,
      };
      detectionMetadata = detection.metadata || {};
    }

    const recommendation = await generateRecommendation(
      recommendationType,
      detectionScores,
      detectionMetadata,
      customPrompt
    );

    const { data: savedRecommendation, error: saveError } = await supabaseClient
      .from('ai_recommendations')
      .insert([
        {
          detection_id: detectionId,
          user_id: userId,
          recommendation_type: recommendationType,
          prompt_used: customPrompt || `${recommendationType} recommendation`,
          recommendation_text: recommendation,
          metadata: { scores: detectionScores, ...detectionMetadata },
        },
      ])
      .select()
      .single();

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: recommendation,
        saved: savedRecommendation,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-camel-recommendations:', error);
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
