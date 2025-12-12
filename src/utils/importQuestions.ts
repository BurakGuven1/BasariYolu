/**
 * Utility to bulk import questions into institution_questions table
 * Usage: Import this in a React component or run via Node.js
 */

import { supabase } from '../lib/supabase';
import type { InstitutionQuestionChoice } from '../lib/institutionQuestionApi';

interface QuestionImportData {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'multiple_choice' | 'written';
  tags: string[];
  content: {
    stem: string;
    options?: Array<{ label: string; value: string }>;
  };
  answer_key?: {
    type: 'option' | 'text';
    value: string;
    explanation: string;
  };
  solution?: {
    steps: string[];
  };
  owner_type?: string;
  visibility?: string;
}

/**
 * Convert platform question format to institution question format
 */
function convertToInstitutionFormat(
  question: QuestionImportData,
  institutionId: string,
  createdBy: string
): {
  institution_id: string;
  created_by: string;
  question_type: 'multiple_choice' | 'written';
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  choices: InstitutionQuestionChoice[];
  answer_key: string | null;
  explanation: string | null;
  tags: string[];
  is_published: boolean;
  metadata: Record<string, any>;
} {
  // Convert HTML stem to plain text for question_text
  const questionText = question.content.stem
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n')
    .replace(/<br\/?>/g, '\n')
    .trim();

  // Convert options to choices format
  const choices: InstitutionQuestionChoice[] =
    question.content.options?.map((opt, idx) => ({
      id: opt.label,
      label: opt.label,
      text: opt.value,
      isCorrect: opt.label === question.answer_key?.value,
    })) || [];

  return {
    institution_id: institutionId,
    created_by: createdBy,
    question_type: question.format,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    question_text: questionText,
    choices,
    answer_key: question.answer_key?.value || null,
    explanation: question.answer_key?.explanation || null,
    tags: question.tags,
    is_published: true,
    metadata: {
      subtopic: question.subtopic,
      solution_steps: question.solution?.steps || [],
      import_source: 'platform',
      import_date: new Date().toISOString(),
    },
  };
}

/**
 * Bulk import questions from JSON array
 */
export async function bulkImportQuestions(
  questions: QuestionImportData[],
  institutionId: string,
  createdBy: string
): Promise<{ success: number; failed: number; errors: any[] }> {
  let success = 0;
  let failed = 0;
  const errors: any[] = [];

  for (const question of questions) {
    try {
      const converted = convertToInstitutionFormat(question, institutionId, createdBy);

      const { error } = await supabase
        .from('institution_questions')
        .insert([converted]);

      if (error) {
        failed++;
        errors.push({ question: question.content.stem.substring(0, 50), error });
      } else {
        success++;
      }
    } catch (err) {
      failed++;
      errors.push({ question: question.content.stem.substring(0, 50), error: err });
    }
  }

  return { success, failed, errors };
}