import { supabase } from './supabase';
import { ParsedQuestion, PDFPageImage, QuestionImage } from './pdfParser';
import { QuestionDifficulty, QuestionFormat } from './questionBank';
import { uploadImage, generateQuestionImagePath } from './imageStorage';

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
  page_number?: number;
  page_image_url?: string;
  question_number?: number; // ADDED: For matching with cropped images
}

/**
 * Convert ParsedQuestion to database format
 */
export function convertParsedQuestionToDBFormat(
  parsed: ParsedQuestion,
  institutionId: string,
  tags: string[] = [],
  pageImageUrl?: string
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
    page_number: parsed.page_number,
    page_image_url: pageImageUrl,
    question_number: parsed.question_number, // ADDED: Preserve question number
  };
}

/**
 * Bulk insert questions with image support
 * Uploads page images to storage and links them to questions
 */
export async function bulkInsertQuestionsWithImages(
  questions: BulkInsertQuestion[],
  pageImages: PDFPageImage[],
  institutionId: string,
  progressCallback?: (current: number, total: number, message: string) => void
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

  // Step 1: Upload all unique page images to storage
  progressCallback?.(0, questions.length, 'Görseller yükleniyor...');

  const pageImageMap = new Map<number, string>(); // pageNumber -> imageUrl
  const uniquePages = new Set(questions.map(q => q.page_number).filter(p => p !== undefined) as number[]);

  for (const pageNumber of uniquePages) {
    const pageImage = pageImages.find(img => img.pageNumber === pageNumber);
    if (pageImage) {
      const imagePath = generateQuestionImagePath(
        institutionId,
        0, // Use 0 for page images (not specific to a question)
        pageNumber,
        'jpeg'
      );

      const uploadResult = await uploadImage('question-images', pageImage.imageBlob, imagePath);

      if (uploadResult.success && uploadResult.url) {
        pageImageMap.set(pageNumber, uploadResult.url);
      } else {
        console.warn(`Failed to upload image for page ${pageNumber}:`, uploadResult.error);
      }
    }
  }

  // Step 2: Add image URLs to questions
  const questionsWithImages = questions.map(q => ({
    ...q,
    page_image_url: q.page_number ? pageImageMap.get(q.page_number) : undefined,
  }));

  // Step 3: Insert questions in batches
  const batchSize = 50;
  for (let i = 0; i < questionsWithImages.length; i += batchSize) {
    const batch = questionsWithImages.slice(i, i + batchSize);
    progressCallback?.(
      i,
      questionsWithImages.length,
      `Sorular kaydediliyor (${i + 1}-${Math.min(i + batchSize, questionsWithImages.length)}/${questionsWithImages.length})...`
    );

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(batch)
        .select('id');

      if (error) {
        // If batch fails, try inserting one by one
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

  progressCallback?.(questionsWithImages.length, questionsWithImages.length, 'Tamamlandı!');

  return {
    success: inserted > 0,
    inserted,
    errors,
  };
}

/**
 * Bulk insert questions with cropped question images
 * Uses individual cropped images for each question instead of full page images
 */
export async function bulkInsertQuestionsWithCroppedImages(
  questions: BulkInsertQuestion[],
  questionImages: QuestionImage[],
  institutionId: string,
  progressCallback?: (current: number, total: number, message: string) => void
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

  // Step 1: Upload all cropped question images to storage
  progressCallback?.(0, questions.length + questionImages.length, 'Soru görselleri yükleniyor...');

  const questionImageMap = new Map<number, string>(); // questionNumber -> imageUrl

  for (let i = 0; i < questionImages.length; i++) {
    const qImage = questionImages[i];
    const imagePath = generateQuestionImagePath(
      institutionId,
      qImage.questionNumber,
      qImage.pageNumber,
      'jpeg'
    );

    const uploadResult = await uploadImage('question-images', qImage.imageBlob, imagePath);

    if (uploadResult.success && uploadResult.url) {
      questionImageMap.set(qImage.questionNumber, uploadResult.url);
      progressCallback?.(
        i + 1,
        questions.length + questionImages.length,
        `Görsel ${i + 1}/${questionImages.length} yüklendi`
      );
    } else {
      console.warn(`Failed to upload image for question ${qImage.questionNumber}:`, uploadResult.error);
    }
  }

  // Step 2: Find matching question numbers and add image URLs
  const questionsWithImages = questions.map((q) => {
    // FIXED: Use actual question_number from question, not index
    // This is critical for multi-column layouts where questions may not be in numerical order
    const questionNumber = q.question_number;
    const imageUrl = questionNumber ? questionImageMap.get(questionNumber) : undefined;

    if (questionNumber && imageUrl) {
      console.log(`✅ Matched Question ${questionNumber} with image: ${imageUrl.slice(0, 50)}...`);
    } else if (questionNumber) {
      console.warn(`⚠️ No image found for Question ${questionNumber}`);
    }

    return {
      ...q,
      page_image_url: imageUrl,
    };
  });

  // Step 3: Insert questions in batches
  const batchSize = 50;
  for (let i = 0; i < questionsWithImages.length; i += batchSize) {
    const batch = questionsWithImages.slice(i, i + batchSize);
    const currentProgress = questionImages.length + i;
    progressCallback?.(
      currentProgress,
      questions.length + questionImages.length,
      `Sorular kaydediliyor (${i + 1}-${Math.min(i + batchSize, questionsWithImages.length)}/${questionsWithImages.length})...`
    );

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(batch)
        .select('id');

      if (error) {
        // If batch fails, try inserting one by one
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

  progressCallback?.(
    questions.length + questionImages.length,
    questions.length + questionImages.length,
    'Tamamlandı!'
  );

  return {
    success: inserted > 0,
    inserted,
    errors,
  };
}

/**
 * Bulk insert questions to database (without image support - legacy)
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
