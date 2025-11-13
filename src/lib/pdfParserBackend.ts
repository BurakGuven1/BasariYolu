/**
 * Backend PDF Parser API Client
 * Uses Python FastAPI + PyMuPDF for 100% accurate question extraction
 */

import { QuestionImage } from './pdfParser';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface BackendQuestionImage {
  question_number: number;
  page_number: number;
  text: string;
  choices: string[];  // ["A) ...", "B) ...", "C) ..."]
  answer: string | null;
  image_base64: string;  // data:image/png;base64,...
  crop_info: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    width: number;
    height: number;
  };
}

export interface BackendParseResult {
  success: boolean;
  total_questions: number;
  questions: BackendQuestionImage[];
}

/**
 * Parse PDF using backend PyMuPDF service
 * Returns question images with PERFECT accuracy
 */
export async function parsePDFWithBackend(
  file: File
): Promise<{
  questionImages: QuestionImage[];
  pageCount: number;
}> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${BACKEND_URL}/api/parse-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Backend parsing failed');
    }

    const result: BackendParseResult = await response.json();

    // Convert backend format to frontend QuestionImage format
    const questionImages: (QuestionImage & { text?: string; choices?: string[]; answer?: string | null })[] = await Promise.all(
      result.questions.map(async (q) => {
        // Convert base64 data URI to Blob
        // Format: "data:image/png;base64,iVBORw0KGgo..."
        let blob: Blob;

        if (q.image_base64.startsWith('data:image')) {
          // Extract base64 part after comma
          const base64Data = q.image_base64.split(',')[1];
          const imageBytes = atob(base64Data);
          const imageArray = new Uint8Array(imageBytes.length);
          for (let i = 0; i < imageBytes.length; i++) {
            imageArray[i] = imageBytes.charCodeAt(i);
          }
          blob = new Blob([imageArray], { type: 'image/png' });
        } else {
          // Fallback for plain base64
          const imageBytes = atob(q.image_base64);
          const imageArray = new Uint8Array(imageBytes.length);
          for (let i = 0; i < imageBytes.length; i++) {
            imageArray[i] = imageBytes.charCodeAt(i);
          }
          blob = new Blob([imageArray], { type: 'image/png' });
        }

        // Parse choices to extract label and value
        const parsedChoices = q.choices.map(choice => {
          // Extract "A) text" -> {label: "A", value: "text"}
          const match = choice.match(/^([A-E])\)\s*(.+)/);
          if (match) {
            return { label: match[1], value: match[2].trim() };
          }
          return { label: '', value: choice };
        });

        return {
          questionNumber: q.question_number,
          pageNumber: q.page_number,
          imageBlob: blob,
          text: q.text,  // OCR/PyMuPDF extracted text
          choices: q.choices,  // Raw choices array
          answer: q.answer,  // Correct answer letter
          text_content: {  // Backward compatibility
            stem: q.text,
            options: parsedChoices,
            answer: q.answer,
          },
          cropInfo: {
            startY: q.crop_info.y0,
            endY: q.crop_info.y1,
            width: q.crop_info.width,
            height: q.crop_info.height,
          },
        };
      })
    );

    // Determine page count from max page_number
    const pageCount = Math.max(...result.questions.map(q => q.page_number));

    console.log(`✅ Backend parsed ${result.total_questions} questions from ${pageCount} pages`);

    return {
      questionImages,
      pageCount,
    };
  } catch (error) {
    console.error('Backend PDF parsing error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Backend PDF parsing failed. Make sure backend server is running on port 8000.'
    );
  }
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
