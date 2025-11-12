import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedQuestion {
  question_number: number;
  subject: string;
  topic: string;
  stem: string;
  options: Array<{ label: string; value: string }>;
  correct_answer: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface PDFParseResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<PDFParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    const textPromises: Promise<string>[] = [];

    for (let i = 1; i <= pageCount; i++) {
      textPromises.push(
        pdf.getPage(i).then(async (page) => {
          const textContent = await page.getTextContent();
          return textContent.items
            .map((item: any) => item.str)
            .join(' ');
        })
      );
    }

    const pageTexts = await Promise.all(textPromises);
    const text = pageTexts.join('\n\n');

    return {
      text,
      pageCount,
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('PDF dosyası okunamadı. Lütfen geçerli bir PDF yükleyin.');
  }
}

/**
 * Simple pattern-based parser (fallback)
 * Tries to extract questions using regex patterns
 */
export function parseQuestionsWithPattern(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  // First, find and extract the answer key section to avoid it interfering with question matching
  const answerKeySectionPattern = /(?:Cevap(?:\s+Anahtarı)?|CEVAPLAR)[:\s]*/i;
  const answerKeySectionMatch = text.search(answerKeySectionPattern);
  const questionsText = answerKeySectionMatch > 0 ? text.substring(0, answerKeySectionMatch) : text;
  const answerKeyText = answerKeySectionMatch > 0 ? text.substring(answerKeySectionMatch) : '';

  // Pattern: Soru 1) ... A) ... B) ... C) ... D) ... E) ...
  // More flexible pattern to capture all questions including those with passages
  const questionPattern = /(?:Soru\s+)?(\d+)[.)]\s*([\s\S]*?)(?=(?:Soru\s+)?\d+[.)]|$)/gi;
  const optionPattern = /([A-E])\)\s*([^A-E)]+)/gi;

  let match;
  while ((match = questionPattern.exec(questionsText)) !== null) {
    const questionNumber = parseInt(match[1]);
    const questionText = match[2].trim();

    // Skip if question text is too short (likely not a real question)
    if (questionText.length < 10) continue;

    // Extract stem (everything before first option, including any passage text)
    const firstOptionIndex = questionText.search(/[A-E]\)/);
    const stem = firstOptionIndex > 0
      ? questionText.substring(0, firstOptionIndex).trim()
      : questionText;

    // Extract options
    const options: Array<{ label: string; value: string }> = [];
    const optionsText = firstOptionIndex > 0
      ? questionText.substring(firstOptionIndex)
      : '';

    let optionMatch;
    while ((optionMatch = optionPattern.exec(optionsText)) !== null) {
      options.push({
        label: optionMatch[1],
        value: optionMatch[2].trim(),
      });
    }

    // Only add questions with valid stem and at least 2 options
    if (stem && stem.length >= 10 && options.length >= 2) {
      questions.push({
        question_number: questionNumber,
        subject: 'Belirtilmemiş', // AI will determine
        topic: 'Belirtilmemiş',
        stem,
        options,
        correct_answer: '',
        difficulty: 'medium',
      });
    }
  }

  // Extract answers from answer key section only
  if (answerKeyText) {
    const answerPattern = /(\d+)[-.:)]\s*([A-E])/gi;

    let answerMatch;
    while ((answerMatch = answerPattern.exec(answerKeyText)) !== null) {
      const questionNum = parseInt(answerMatch[1]);
      const answer = answerMatch[2];

      const question = questions.find(q => q.question_number === questionNum);
      if (question) {
        question.correct_answer = answer;
      }
    }
  }

  return questions;
}

/**
 * Validate parsed questions
 */
export function validateParsedQuestions(questions: ParsedQuestion[]): {
  valid: ParsedQuestion[];
  invalid: Array<{ question: ParsedQuestion; errors: string[] }>;
} {
  const valid: ParsedQuestion[] = [];
  const invalid: Array<{ question: ParsedQuestion; errors: string[] }> = [];

  questions.forEach(question => {
    const errors: string[] = [];

    if (!question.stem || question.stem.length < 10) {
      errors.push('Soru metni çok kısa');
    }

    if (question.options.length < 2) {
      errors.push('En az 2 şık gerekli');
    }

    if (!question.correct_answer) {
      errors.push('Doğru cevap belirtilmemiş');
    }

    // Note: Don't validate subject for pattern matching as it's determined later by the institution
    // Subject validation is handled at bulk insert level

    if (errors.length > 0) {
      invalid.push({ question, errors });
    } else {
      valid.push(question);
    }
  });

  return { valid, invalid };
}
