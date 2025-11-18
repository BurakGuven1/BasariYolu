// Supabase Edge Function for AI Question Answering
// This function handles OpenAI API calls with credit checking and rate limiting

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_CREDIT_LIMIT = 15;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
}

interface StoredMessage {
  role: string;
  content: string;
  image_url?: string | null;
}

interface RequestBody {
  question: string;
  category?: string;
  conversationId?: string;
  messages?: Message[]; // Conversation history
  imageUrl?: string; // URL to image in storage
  imageBase64?: string; // Base64 encoded image
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
    const {
      question,
      category,
      conversationId,
      messages,
      imageUrl,
      imageBase64,
    }: RequestBody = await req.json();

    // Log request details for debugging
    console.log('=== Request Received ===');
    console.log('Question:', question);
    console.log('ConversationId:', conversationId);
    console.log('Messages count:', messages?.length || 0);
    console.log('Has imageUrl:', !!imageUrl);
    console.log('Has imageBase64:', !!imageBase64);

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
    // AI feature is available for both Professional and Advanced plans
    const allowedPlans = ['professional', 'advanced'];
    if (profile && profile.subscription_plan && !allowedPlans.includes(profile.subscription_plan)) {
      return new Response(
        JSON.stringify({
          error: 'AI özelliği sadece Profesyonel ve Gelişmiş paket sahiplerine açıktır.',
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
              error: 'Bugün için AI kredi limitinize ulaştınız. Krediler her 24 saatte otomatik yenilenir.',
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

    // Attempt to hydrate conversation history if frontend didn't send messages
    let conversationHistory: Message[] = Array.isArray(messages) ? messages : [];

    if (conversationHistory.length === 0 && conversationId) {
      try {
        const { data: storedMessages, error: historyError } = await supabaseClient
          .from('ai_messages')
          .select('role, content, image_url')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(20);

        if (historyError) {
          console.warn('Failed to load stored conversation history:', historyError.message);
        } else if (storedMessages && storedMessages.length > 0) {
          conversationHistory = storedMessages.map(
            (msg: StoredMessage): Message => ({
              role: msg.role === 'assistant' || msg.role === 'system' ? (msg.role as 'assistant' | 'system') : 'user',
              content: msg.content,
              image_url: msg.image_url ?? undefined,
            })
          );
        }
      } catch (historyException) {
        console.warn('Error hydrating conversation history:', historyException);
      }
    }

    // Determine if we have an image
    const hasImage = !!(imageUrl || imageBase64);

    // Choose model based on whether we have an image
    const model = hasImage ? 'gpt-4o' : 'gpt-4o-mini';

    // Build messages array with conversation history
    const systemMessage = {
      role: 'system',
      content: `Sen BaşarıYolu platformunun yapay zeka asistanısın. Türk öğrencilere TYT, AYT, LGS gibi sınavlara hazırlanırken yardımcı oluyorsun.

Görevlerin:
- Matematik, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, Türkçe gibi derslerde soru çözme
- Fotoğrafı verilen soruları analiz etme ve çözme
- Konu anlatımı ve açıklama
- Çalışma teknikleri ve motivasyon önerileri
- Sınav stratejileri

Önemli:
- Türkçe konuş
- Açık, anlaşılır ve öğretici ol
- Gerektiğinde adım adım çözüm göster
- Öğrenciye özgüven ver
- Akademik dürüstlüğe önem ver (kopya/hile teşvik etme)
- Görsel içeren sorularda, görseldeki soruyu önce oku, sonra adım adım çöz`,
    };

    // Start with system message
    const openaiMessages: any[] = [systemMessage];

    // Add conversation history if provided
    const normalizedHistory = conversationHistory
      .filter(
        (m) =>
          m &&
          typeof m.content === 'string' &&
          (m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      )
      .slice(-12); // keep last 12 turns to control token usage

    if (normalizedHistory.length > 0) {
      // Add previous messages (excluding system messages from history)
      // Support both text-only and vision messages
      const historyMessages = normalizedHistory
        .filter((m) => m.role !== 'system')
        .map((m) => {
          // If message has an image, use Vision API format
          if (m.image_url) {
            return {
              role: m.role,
              content: [
                {
                  type: 'text',
                  text: m.content,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: m.image_url,
                  },
                },
              ],
            };
          }
          // Otherwise, use text-only format
          return {
            role: m.role,
            content: m.content,
          };
        });

      openaiMessages.push(...historyMessages);
    }

    // Add current user question
    if (hasImage) {
      // Vision API format with image
      const imageContent: any[] = [
        {
          type: 'text',
          text: question,
        },
      ];

      // Add image (either URL or base64)
      if (imageUrl) {
        imageContent.push({
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        });
      } else if (imageBase64) {
        imageContent.push({
          type: 'image_url',
          image_url: {
            url: imageBase64.startsWith('data:')
              ? imageBase64
              : `data:image/jpeg;base64,${imageBase64}`,
          },
        });
      }

      openaiMessages.push({
        role: 'user',
        content: imageContent,
      });
    } else {
      // Text-only format
      openaiMessages.push({
        role: 'user',
        content: question,
      });
    }

    // Log the messages being sent to OpenAI for debugging
    console.log('=== OpenAI Request ===');
    console.log('Model:', model);
    console.log('Messages count:', openaiMessages.length);
    console.log('Messages:', JSON.stringify(openaiMessages, null, 2));

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 2000,
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

    // Get or create conversation
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const { data: newConvData, error: convError } = await supabaseClient.rpc(
        'get_or_create_conversation',
        {
          p_student_id: user.id,
          p_conversation_id: null,
        }
      );

      if (convError) {
        console.warn('Conversation creation failed:', convError.message);
      } else {
        activeConversationId = newConvData;
      }
    }

    // Save messages to conversation (if conversation exists)
    if (activeConversationId) {
      try {
        // Save user message
        await supabaseClient.from('ai_messages').insert({
          conversation_id: activeConversationId,
          role: 'user',
          content: question,
          image_url: imageUrl || null,
        });

        // Save assistant message
        await supabaseClient.from('ai_messages').insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: answer,
          tokens_used: tokensUsed,
          model_used: model,
        });

        // Update conversation title if this is the first message
        const { data: existingMessages } = await supabaseClient
          .from('ai_messages')
          .select('id')
          .eq('conversation_id', activeConversationId)
          .limit(3);

        if (existingMessages && existingMessages.length <= 2) {
          // This is the first Q&A, generate title from question
          const title = question.length > 50 ? question.substring(0, 50) + '...' : question;
          await supabaseClient
            .from('ai_conversations')
            .update({ title })
            .eq('id', activeConversationId);
        }
      } catch (error) {
        console.warn('Failed to save messages to conversation:', error);
      }
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

    const fallbackRemaining =
      updatedCredits?.remaining_credits ??
      (creditData ? Math.max(creditData.remaining_credits - 1, 0) : DAILY_CREDIT_LIMIT);

    const fallbackResetsAt =
      updatedCredits?.resets_at ||
      creditData?.resets_at ||
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        tokensUsed,
        remainingCredits: fallbackRemaining,
        resetsAt: fallbackResetsAt,
        conversationId: activeConversationId,
        modelUsed: model,
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
