// Supabase Edge Function for AI Question Answering
// This function handles OpenAI API calls with credit checking and rate limiting

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  question: string;
  category?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { question, category }: RequestBody = await req.json();

    if (!question || question.trim().length === 0) {
      throw new Error('Question is required');
    }

    // Check if user has professional package (optional - graceful degradation)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single();

    // Only check plan if profile exists and has subscription_plan field
    if (profile && profile.subscription_plan && profile.subscription_plan !== 'professional') {
      return new Response(
        JSON.stringify({
          error: 'AI özelliği sadece Profesyonel paket sahiplerine açıktır.',
          code: 'PLAN_RESTRICTION',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log profile check result for debugging
    if (profileError) {
      console.warn('Profile check skipped:', profileError.message);
    }

    // Get student's remaining credits (optional - graceful degradation)
    let creditData: any = null;
    let hasCreditsSystem = true;

    try {
      const { data: credits, error: creditsError } = await supabaseClient.rpc(
        'get_student_ai_credits',
        { p_student_id: user.id }
      );

      if (creditsError) {
        console.warn('Credits system not available:', creditsError.message);
        hasCreditsSystem = false;
      } else {
        creditData = credits?.[0];

        // Check if credits are exhausted
        if (creditData && creditData.remaining_credits <= 0) {
          return new Response(
            JSON.stringify({
              error: 'Bu hafta için AI krediniz bitti. Yeni krediler her Pazartesi yüklenir.',
              code: 'NO_CREDITS',
              weekStartDate: creditData.week_start_date,
              weekEndDate: creditData.week_end_date,
            }),
            {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } catch (error) {
      console.warn('Credits check failed, continuing without credits system:', error);
      hasCreditsSystem = false;
    }

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Sen BaşarıYolu platformunun yapay zeka asistanısın. Türk öğrencilere TYT, AYT, LGS gibi sınavlara hazırlanırken yardımcı oluyorsun.

Görevlerin:
- Matematik, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, Türkçe gibi derslerde soru çözme
- Konu anlatımı ve açıklama
- Çalışma teknikleri ve motivasyon önerileri
- Sınav stratejileri

Önemli:
- Türkçe konuş
- Açık, anlaşılır ve öğretici ol
- Gerektiğinde adım adım çözüm göster
- Öğrenciye özgüven ver
- Akademik dürüstlüğe önem ver (kopya/hile teşvik etme)`,
          },
          {
            role: 'user',
            content: question,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI error:', errorData);
      throw new Error('OpenAI API çağrısı başarısız oldu');
    }

    const openaiData = await openaiResponse.json();
    const answer = openaiData.choices[0]?.message?.content;
    const tokensUsed = openaiData.usage?.total_tokens || 0;

    if (!answer) {
      throw new Error('OpenAI cevap oluşturamadı');
    }

    // Use credit and save question/answer (only if credits system is available)
    let updatedCredits: any = null;

    if (hasCreditsSystem) {
      try {
        const { error: useCreditError } = await supabaseClient.rpc('use_ai_credit', {
          p_student_id: user.id,
          p_question: question,
          p_answer: answer,
          p_tokens_used: tokensUsed,
          p_model_used: 'gpt-4o-mini',
          p_category: category || null,
        });

        if (useCreditError) {
          console.warn('Use credit error:', useCreditError.message);
        } else {
          // Get updated credits
          const { data } = await supabaseClient.rpc('get_student_ai_credits', {
            p_student_id: user.id,
          });
          updatedCredits = data?.[0];
        }
      } catch (error) {
        console.warn('Credit tracking failed, continuing without credit tracking:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        tokensUsed,
        remainingCredits: updatedCredits?.remaining_credits || 999,
        weekEndDate: updatedCredits?.week_end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Bir hata oluştu',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
