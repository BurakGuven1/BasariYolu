import { supabase } from './supabase';

// ==================== TYPES ====================

export type BigFiveTrait = 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism';

export interface BigFiveQuestion {
  id: string;
  question_text: string;
  trait: BigFiveTrait;
  reverse_scored: boolean;
  min_grade: number;
  max_grade: number;
  question_order: number;
}

export interface BigFiveResponse {
  id: string;
  student_id: string;
  question_id: string;
  response_value: number;
  created_at: string;
}

export interface BigFiveResult {
  id: string;
  student_id: string;
  openness_score: number;
  conscientiousness_score: number;
  extraversion_score: number;
  agreeableness_score: number;
  neuroticism_score: number;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface BigFiveScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export const TRAIT_LABELS: Record<BigFiveTrait, string> = {
  openness: 'Deneyime Açıklık',
  conscientiousness: 'Sorumluluk',
  extraversion: 'Dışa Dönüklük',
  agreeableness: 'Uyumluluk',
  neuroticism: 'Duygusal Denge',
};

export const TRAIT_DESCRIPTIONS: Record<BigFiveTrait, string> = {
  openness: 'Yeni deneyimlere, fikirlere ve hayal gücüne açıklık',
  conscientiousness: 'Düzenlilik, sorumluluk ve hedef odaklılık',
  extraversion: 'Sosyal etkileşim, enerji ve dışa dönüklük',
  agreeableness: 'İşbirliği, empati ve nazik davranışlar',
  neuroticism: 'Duygusal denge, stres yönetimi ve sakinlik (düşük puan daha iyi)',
};

// ==================== API FUNCTIONS ====================

/**
 * Get Big Five questions appropriate for student's grade level
 */
export const getBigFiveQuestions = async (gradeLevel: number): Promise<BigFiveQuestion[]> => {
  const { data, error } = await supabase
    .from('big_five_questions')
    .select('*')
    .lte('min_grade', gradeLevel)
    .gte('max_grade', gradeLevel)
    .order('question_order');

  if (error) throw error;
  return data || [];
};

/**
 * Get all Big Five questions (for admin use)
 */
export const getAllBigFiveQuestions = async (): Promise<BigFiveQuestion[]> => {
  const { data, error } = await supabase
    .from('big_five_questions')
    .select('*')
    .order('question_order');

  if (error) throw error;
  return data || [];
};

/**
 * Save a student's response to a Big Five question
 */
export const saveBigFiveResponse = async (
  studentId: string,
  questionId: string,
  responseValue: number
): Promise<void> => {
  const { error } = await supabase
    .from('big_five_responses')
    .upsert({
      student_id: studentId,
      question_id: questionId,
      response_value: responseValue,
    });

  if (error) throw error;
};

/**
 * Save multiple responses at once
 */
export const saveBigFiveResponses = async (
  studentId: string,
  responses: Array<{ questionId: string; value: number }>
): Promise<void> => {
  const responseData = responses.map((r) => ({
    student_id: studentId,
    question_id: r.questionId,
    response_value: r.value,
  }));

  const { error } = await supabase
    .from('big_five_responses')
    .upsert(responseData);

  if (error) throw error;
};

/**
 * Get student's responses
 */
export const getStudentResponses = async (studentId: string): Promise<BigFiveResponse[]> => {
  const { data, error } = await supabase
    .from('big_five_responses')
    .select('*')
    .eq('student_id', studentId);

  if (error) throw error;
  return data || [];
};

/**
 * Calculate Big Five scores for a student
 */
export const calculateBigFiveScores = async (studentId: string): Promise<BigFiveScores | null> => {
  const { data, error } = await supabase.rpc('calculate_big_five_scores', {
    p_student_id: studentId,
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return {
    openness: Number(data[0].openness) || 0,
    conscientiousness: Number(data[0].conscientiousness) || 0,
    extraversion: Number(data[0].extraversion) || 0,
    agreeableness: Number(data[0].agreeableness) || 0,
    neuroticism: Number(data[0].neuroticism) || 0,
  };
};

/**
 * Save calculated scores to results table
 */
export const saveBigFiveResults = async (
  studentId: string,
  scores: BigFiveScores
): Promise<void> => {
  const { error } = await supabase
    .from('big_five_results')
    .upsert({
      student_id: studentId,
      openness_score: scores.openness,
      conscientiousness_score: scores.conscientiousness,
      extraversion_score: scores.extraversion,
      agreeableness_score: scores.agreeableness,
      neuroticism_score: scores.neuroticism,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};

/**
 * Get student's Big Five results
 */
export const getStudentBigFiveResults = async (studentId: string): Promise<BigFiveResult | null> => {
  const { data, error } = await supabase
    .from('big_five_results')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Check if student has completed the assessment
 */
export const hasCompletedAssessment = async (
  studentId: string,
  gradeLevel: number
): Promise<boolean> => {
  // Get questions for grade level
  const questions = await getBigFiveQuestions(gradeLevel);
  const totalQuestions = questions.length;

  // Get student responses
  const responses = await getStudentResponses(studentId);
  const responseQuestionIds = new Set(responses.map((r) => r.question_id));

  // Check if all questions are answered
  const answeredCount = questions.filter((q) => responseQuestionIds.has(q.id)).length;

  return answeredCount === totalQuestions && totalQuestions > 0;
};

/**
 * Get completion progress (0-100)
 */
export const getAssessmentProgress = async (
  studentId: string,
  gradeLevel: number
): Promise<number> => {
  const questions = await getBigFiveQuestions(gradeLevel);
  const totalQuestions = questions.length;

  if (totalQuestions === 0) return 0;

  const responses = await getStudentResponses(studentId);
  const responseQuestionIds = new Set(responses.map((r) => r.question_id));

  const answeredCount = questions.filter((q) => responseQuestionIds.has(q.id)).length;

  return Math.round((answeredCount / totalQuestions) * 100);
};

/**
 * Delete all student responses (reset assessment)
 */
export const resetAssessment = async (studentId: string): Promise<void> => {
  const { error } = await supabase
    .from('big_five_responses')
    .delete()
    .eq('student_id', studentId);

  if (error) throw error;

  // Also delete results
  await supabase
    .from('big_five_results')
    .delete()
    .eq('student_id', studentId);
};
