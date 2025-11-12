import { ParsedQuestion } from './pdfParser';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface OpenAIParseOptions {
  model?: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
  temperature?: number;
}

const SYSTEM_PROMPT = `Sen bir sınav soruları parse uzmanısın. Verilen PDF metninden soruları çıkarıp JSON formatında döndürüyorsun.

Kurallар:
1. Her soruyu ayrı ayrı parse et
2. Soru numarasını, stem (soru metni), şıkları (A, B, C, D, E), doğru cevabı çıkar
3. Mümkünse dersi ve konuyu tahmin et
4. Zorluk seviyesini tahmin et (easy/medium/hard)
5. Cevap anahtarını soruların sonunda ara ve eşleştir

JSON formatı:
{
  "questions": [
    {
      "question_number": 1,
      "subject": "Matematik",
      "topic": "Fonksiyonlar",
      "stem": "f(x) = 2x + 3 fonksiyonu için f(5) kaçtır?",
      "options": [
        {"label": "A", "value": "10"},
        {"label": "B", "value": "13"},
        {"label": "C", "value": "15"},
        {"label": "D", "value": "18"}
      ],
      "correct_answer": "B",
      "difficulty": "medium"
    }
  ],
  "metadata": {
    "total_questions": 50,
    "subjects_detected": ["Matematik", "Türkçe"],
    "has_answer_key": true
  }
}

ÖNEMLI: Sadece JSON döndür, başka açıklama ekleme.`;

export async function parseQuestionsWithAI(
  text: string,
  options: OpenAIParseOptions = {}
): Promise<{
  questions: ParsedQuestion[];
  metadata: {
    total_questions: number;
    subjects_detected: string[];
    has_answer_key: boolean;
  };
}> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to .env file');
  }

  const model = options.model || 'gpt-4o-mini';
  const temperature = options.temperature || 0.2;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `PDF metnini parse et:\n\n${text.slice(0, 50000)}`, // Limit to ~50K chars
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      questions: parsed.questions || [],
      metadata: parsed.metadata || {
        total_questions: parsed.questions?.length || 0,
        subjects_detected: [],
        has_answer_key: false,
      },
    };
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    throw new Error(
      error instanceof Error
        ? `AI Parse hatası: ${error.message}`
        : 'AI ile parse edilemedi'
    );
  }
}

/**
 * Estimate cost for parsing
 */
export function estimateParsingCost(textLength: number, model: string = 'gpt-4o-mini'): {
  estimatedTokens: number;
  estimatedCostUSD: number;
  estimatedCostTRY: number;
} {
  // Rough estimation: 1 token ≈ 4 characters
  const inputTokens = Math.ceil(textLength / 4);
  const outputTokens = Math.ceil(inputTokens * 0.6); // Assume output is 60% of input

  let inputCost: number;
  let outputCost: number;

  switch (model) {
    case 'gpt-4o-mini':
      inputCost = (inputTokens / 1_000_000) * 0.15;
      outputCost = (outputTokens / 1_000_000) * 0.60;
      break;
    case 'gpt-4o':
      inputCost = (inputTokens / 1_000_000) * 2.50;
      outputCost = (outputTokens / 1_000_000) * 10.00;
      break;
    case 'gpt-3.5-turbo':
      inputCost = (inputTokens / 1_000_000) * 0.50;
      outputCost = (outputTokens / 1_000_000) * 1.50;
      break;
    default:
      inputCost = 0;
      outputCost = 0;
  }

  const totalCostUSD = inputCost + outputCost;
  const totalCostTRY = totalCostUSD * 30; // Rough USD to TRY conversion

  return {
    estimatedTokens: inputTokens + outputTokens,
    estimatedCostUSD: parseFloat(totalCostUSD.toFixed(4)),
    estimatedCostTRY: parseFloat(totalCostTRY.toFixed(2)),
  };
}
