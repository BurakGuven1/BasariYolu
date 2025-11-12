import { supabase } from './supabase';
import { ParsedQuestion } from './pdfParser';
import { QuestionDifficulty, QuestionFormat } from './questionBank';

export interface BulkInsertQuestion {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  format: QuestionFormat;
  tags: string[];
  content: {
    stem: string;
    options?: Array<{ label: string; value: string }>;
  };
  answer_key?: {
    type: 'option' | 'text';
    value: string;
    explanation?: string;
  };
  owner_type: 'platform' | 'institution' | 'teacher';
  owner_id: string | null;
  visibility: 'private' | 'institution_only' | 'public';
}

/**
 * Convert ParsedQuestion to database format
 */
export function convertParsedQuestionToDBFormat(
  parsed: ParsedQuestion,
  institutionId: string,
  tags: string[] = []
): BulkInsertQuestion {
  return {
    subject: parsed.subject,
    topic: parsed.topic,
    difficulty: parsed.difficulty || 'medium',
    format: 'multiple_choice',
    tags: [...tags, 'pdf-import'],
    content: {
      stem: parsed.stem,
      options: parsed.options,
    },
    answer_key: parsed.correct_answer
      ? {
          type: 'option',
          value: parsed.correct_answer,
        }
      : undefined,
    owner_type: 'institution',
    owner_id: institutionId,
    visibility: 'institution_only',
  };
}

/**
 * Bulk insert questions to database
 */
export async function bulkInsertQuestions(
  questions: BulkInsertQuestion[]
): Promise<{
  success: boolean;
  inserted: number;
  errors: Array<{ question: BulkInsertQuestion; error: string }>;
}> {
  if (questions.length === 0) {
    return { success: true, inserted: 0, errors: [] };
  }

  const errors: Array<{ question: BulkInsertQuestion; error: string }> = [];
  let inserted = 0;

  // Insert in batches of 50 to avoid timeouts
  const batchSize = 50;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(batch)
        .select('id');

      if (error) {
        // If batch fails, try inserting one by one to identify problematic questions
        for (const question of batch) {
          const { error: singleError } = await supabase
            .from('questions')
            .insert([question]);

          if (singleError) {
            errors.push({
              question,
              error: singleError.message,
            });
          } else {
            inserted++;
          }
        }
      } else {
        inserted += data?.length || batch.length;
      }
    } catch (error) {
      console.error('Batch insert error:', error);
      errors.push({
        question: batch[0],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: inserted > 0,
    inserted,
    errors,
  };
}

/**
 * Preview parsed questions before insertion
 */
export interface QuestionPreview extends ParsedQuestion {
  id: string;
  selected: boolean;
  edited: boolean;
}

export function createQuestionPreviews(
  parsedQuestions: ParsedQuestion[]
): QuestionPreview[] {
  return parsedQuestions.map((q, index) => ({
    ...q,
    id: `temp-${index}`,
    selected: true,
    edited: false,
  }));
}

/**
 * Validate questions before bulk insert
 */
export function validateBulkInsert(
  questions: BulkInsertQuestion[]
): {
  valid: BulkInsertQuestion[];
  invalid: Array<{ question: BulkInsertQuestion; errors: string[] }>;
} {
  const valid: BulkInsertQuestion[] = [];
  const invalid: Array<{ question: BulkInsertQuestion; errors: string[] }> = [];

  questions.forEach(question => {
    const errors: string[] = [];

    if (!question.subject) {
      errors.push('Ders adı zorunlu');
    }

    if (!question.topic) {
      errors.push('Konu adı zorunlu');
    }

    if (!question.content.stem || question.content.stem.length < 5) {
      errors.push('Soru metni çok kısa');
    }

    if (question.format === 'multiple_choice' && (!question.content.options || question.content.options.length < 2)) {
      errors.push('Çoktan seçmeli sorular için en az 2 şık gerekli');
    }

    if (!question.answer_key || !question.answer_key.value) {
      errors.push('Doğru cevap belirtilmemiş');
    }

    if (errors.length > 0) {
      invalid.push({ question, errors });
    } else {
      valid.push(question);
    }
  });

  return { valid, invalid };
}
