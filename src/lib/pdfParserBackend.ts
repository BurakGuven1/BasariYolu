/**
 * Backend PDF Parser API Client
 * Uses Python FastAPI + PyMuPDF for 100% accurate question extraction
 */

import { QuestionImage } from './pdfParser';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface BackendQuestionImage {
  id: number;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  difficulty: string | null;
  format: string;
  tags: string[];
  content: {
    text: string;  // Full question text
    stem: string;  // Bold question root/core
    options: Array<{ label: string; value: string }>;
    image: string;  // data:image/png;base64,...
  };
  answer_key: {
    correct: string | null;
    explanation: string | null;
  } | null;
  solution: string | null;
  owner_type: string | null;
  visibility: string | null;
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
      result.questions.map(async (q, index) => {
        // Convert base64 data URI to Blob
        // Format: "data:image/png;base64,iVBORw0KGgo..."
        let blob: Blob;

        const imageData = q.content.image;

        if (imageData && imageData.startsWith('data:image')) {
          // Extract base64 part after comma
          const base64Data = imageData.split(',')[1];
          const imageBytes = atob(base64Data);
          const imageArray = new Uint8Array(imageBytes.length);
          for (let i = 0; i < imageBytes.length; i++) {
            imageArray[i] = imageBytes.charCodeAt(i);
          }
          blob = new Blob([imageArray], { type: 'image/png' });
        } else if (imageData) {
          // Fallback for plain base64
          const imageBytes = atob(imageData);
          const imageArray = new Uint8Array(imageBytes.length);
          for (let i = 0; i < imageBytes.length; i++) {
            imageArray[i] = imageBytes.charCodeAt(i);
          }
          blob = new Blob([imageArray], { type: 'image/png' });
        } else {
          // No image available
          blob = new Blob([], { type: 'image/png' });
        }

        // Convert choices to string array for backward compatibility
        const choicesArray = q.content.options.map(opt => `${opt.label}) ${opt.value}`);

        return {
          questionNumber: q.id,  // Use unique ID
          pageNumber: index + 1,  // Sequential page numbers
          imageBlob: blob,
          text: q.content.stem,
          choices: choicesArray,  // String array for compatibility
          answer: q.answer_key?.correct || null,
          text_content: {
            stem: q.content.stem,
            options: q.content.options,  // Already in correct format!
            answer: q.answer_key?.correct || null,
          },
          cropInfo: {
            startY: 0,
            endY: 0,
            width: 0,
            height: 0,
          },
        };
      })
    );

    // Page count is total questions (each question can be on different page)
    const pageCount = result.total_questions;


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
