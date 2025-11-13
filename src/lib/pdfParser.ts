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
  page_number?: number;
}

export interface PDFPageImage {
  pageNumber: number;
  imageBlob: Blob;
  width: number;
  height: number;
}

export interface QuestionImage {
  questionNumber: number;
  pageNumber: number;
  imageBlob: Blob;
  cropInfo: {
    startY: number;
    endY: number;
    width: number;
    height: number;
  };
}

export interface PDFParseResult {
  text: string;
  pageCount: number;
  pageImages?: PDFPageImage[];
  pageTexts?: string[]; // Individual page texts for mapping questions to pages
}

/**
 * Extract text from PDF file (legacy - kept for compatibility)
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
      pageTexts,
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('PDF dosyası okunamadı. Lütfen geçerli bir PDF yükleyin.');
  }
}

/**
 * Extract both text and images from PDF file
 * This is the recommended function to use for question parsing with visual support
 */
export async function extractTextAndImagesFromPDF(
  file: File,
  options: {
    extractImages?: boolean;
    imageScale?: number; // Scale for image rendering (1 = 72 DPI, 2 = 144 DPI, etc.)
    imageFormat?: 'png' | 'jpeg';
    imageQuality?: number; // 0-1 for JPEG quality
  } = {}
): Promise<PDFParseResult> {
  const {
    extractImages = true,
    imageScale = 2, // 144 DPI for good quality
    imageFormat = 'jpeg',
    imageQuality = 0.92,
  } = options;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    const pageTexts: string[] = [];
    const pageImages: PDFPageImage[] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Extract text
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      pageTexts.push(pageText);

      // Extract image if requested
      if (extractImages) {
        const viewport = page.getViewport({ scale: imageScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
            imageFormat === 'jpeg' ? imageQuality : undefined
          );
        });

        pageImages.push({
          pageNumber: pageNum,
          imageBlob: blob,
          width: viewport.width,
          height: viewport.height,
        });
      }
    }

    const text = pageTexts.join('\n\n');

    return {
      text,
      pageCount,
      pageTexts,
      pageImages: extractImages ? pageImages : undefined,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('PDF dosyası okunamadı. Lütfen geçerli bir PDF yükleyin.');
  }
}

/**
 * Extract individual question images by cropping based on question positions
 */
export async function extractQuestionImages(
  file: File,
  questions: ParsedQuestion[],
  options: {
    imageScale?: number;
    imageFormat?: 'png' | 'jpeg';
    imageQuality?: number;
    padding?: number; // Extra padding around each question in pixels
  } = {}
): Promise<QuestionImage[]> {
  const {
    imageScale = 2, // 144 DPI
    imageFormat = 'jpeg',
    imageQuality = 0.92,
    padding = 20,
  } = options;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const questionImages: QuestionImage[] = [];

    // Group questions by page number
    const questionsByPage = new Map<number, ParsedQuestion[]>();
    questions.forEach(q => {
      if (q.page_number) {
        if (!questionsByPage.has(q.page_number)) {
          questionsByPage.set(q.page_number, []);
        }
        questionsByPage.get(q.page_number)!.push(q);
      }
    });

    // Process each page that has questions
    for (const [pageNum, pageQuestions] of questionsByPage.entries()) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: imageScale });

      // Find Y positions of each question number
      const questionPositions = new Map<number, number>();

      textContent.items.forEach((item: any) => {
        const text = item.str.trim();
        // Match patterns like "Soru 1)", "1)", "1.", "Soru 1."
        const questionNumMatch = text.match(/^(?:Soru\s+)?(\d+)[.)]/);
        if (questionNumMatch) {
          const qNum = parseInt(questionNumMatch[1]);
          // Transform Y coordinate (PDF coordinates start from bottom)
          const yPos = viewport.height - (item.transform[5] * imageScale);
          if (!questionPositions.has(qNum) || yPos < questionPositions.get(qNum)!) {
            questionPositions.set(qNum, yPos);
          }
        }
      });

      // Sort questions by their position on page
      pageQuestions.sort((a, b) => a.question_number - b.question_number);

      // Render full page to canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Crop each question
      for (let i = 0; i < pageQuestions.length; i++) {
        const question = pageQuestions[i];
        const startY = questionPositions.get(question.question_number) || 0;
        const nextQuestion = pageQuestions[i + 1];
        const endY = nextQuestion && questionPositions.has(nextQuestion.question_number)
          ? questionPositions.get(nextQuestion.question_number)!
          : viewport.height;

        // Add padding
        const cropStartY = Math.max(0, startY - padding);
        const cropEndY = Math.min(viewport.height, endY + padding);
        const cropHeight = cropEndY - cropStartY;

        if (cropHeight <= 0) continue;

        // Create cropped canvas
        const cropCanvas = document.createElement('canvas');
        const cropContext = cropCanvas.getContext('2d');
        if (!cropContext) continue;

        cropCanvas.width = viewport.width;
        cropCanvas.height = cropHeight;

        // Copy the cropped region
        cropContext.drawImage(
          canvas,
          0, cropStartY,  // Source x, y
          viewport.width, cropHeight,  // Source width, height
          0, 0,  // Dest x, y
          viewport.width, cropHeight  // Dest width, height
        );

        // Convert to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          cropCanvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            },
            imageFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
            imageFormat === 'jpeg' ? imageQuality : undefined
          );
        });

        questionImages.push({
          questionNumber: question.question_number,
          pageNumber: pageNum,
          imageBlob: blob,
          cropInfo: {
            startY: cropStartY,
            endY: cropEndY,
            width: viewport.width,
            height: cropHeight,
          },
        });
      }
    }

    return questionImages;
  } catch (error) {
    console.error('Question image extraction error:', error);
    throw new Error('Soru görselleri oluşturulamadı.');
  }
}

/**
 * Map questions to page numbers based on question number and page text content
 */
export function mapQuestionsToPages(
  questions: ParsedQuestion[],
  pageTexts: string[]
): ParsedQuestion[] {
  return questions.map(question => {
    // Try to find which page contains this question number
    const questionNumberPattern = new RegExp(
      `(?:Soru\\s+)?${question.question_number}[.)]`,
      'i'
    );

    for (let i = 0; i < pageTexts.length; i++) {
      if (questionNumberPattern.test(pageTexts[i])) {
        return {
          ...question,
          page_number: i + 1, // Pages are 1-indexed
        };
      }
    }

    // If not found, estimate based on question number distribution
    // Assume questions are evenly distributed across pages
    const questionsPerPage = Math.ceil(questions.length / pageTexts.length);
    const estimatedPage = Math.ceil(question.question_number / questionsPerPage);

    return {
      ...question,
      page_number: Math.min(estimatedPage, pageTexts.length),
    };
  });
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
