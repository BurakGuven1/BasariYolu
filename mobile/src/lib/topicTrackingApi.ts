import { supabase } from './supabase';

// ==================== TYPES ====================

export interface Topic {
  id: string;
  grade_level: number;
  subject: string;
  main_topic: string;
  sub_topic: string | null;
  topic_order: number;
  exam_type: string | null;
}

export interface StudentTopicProgress {
  id: string;
  student_id: string;
  topic_id: string;
  completion_percentage: number;
  is_completed: boolean;
  total_questions_solved: number;
  correct_answers: number;
  wrong_answers: number;
  source_books: string[]; // Array of book names
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_studied_at: string | null;
  // Joined topic data
  topic?: Topic;
}

export interface StudySession {
  id: string;
  student_id: string;
  topic_id: string;
  session_date: string;
  duration_minutes: number | null;
  questions_solved: number;
  correct_count: number;
  wrong_count: number;
  source_book: string | null;
  session_notes: string | null;
}

export interface TopicStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  totalQuestionsSolved: number;
  accuracy: number; // percentage
}

// ==================== API FUNCTIONS ====================

/**
 * Get all topics for a specific grade level
 */
export const getTopicsByGrade = async (gradeLevel: number): Promise<Topic[]> => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('grade_level', gradeLevel)
    .order('topic_order');

  if (error) {
    if (error.code === 'PGRST204' || error.code === 'PGRST205') {
      console.warn('Topics table not found');
      return [];
    }
    throw error;
  }
  return data || [];
};

/**
 * Get topics filtered by subject
 */
export const getTopicsBySubject = async (
  gradeLevel: number,
  subject: string
): Promise<Topic[]> => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('grade_level', gradeLevel)
    .eq('subject', subject)
    .order('topic_order');

  if (error) throw error;
  return data || [];
};

/**
 * Get all subjects for a grade level
 */
export const getSubjectsByGrade = async (gradeLevel: number): Promise<string[]> => {
  const { data, error } = await supabase
    .from('topics')
    .select('subject')
    .eq('grade_level', gradeLevel);

  if (error) throw error;

  // Get unique subjects
  const subjects = [...new Set((data || []).map((t) => t.subject))];
  return subjects;
};

/**
 * Get student's progress for all topics
 */
export const getStudentProgress = async (studentId: string): Promise<StudentTopicProgress[]> => {
  const { data, error } = await supabase
    .from('student_topic_progress')
    .select(`
      *,
      topic:topics(*)
    `)
    .eq('student_id', studentId)
    .order('last_studied_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get student's progress for specific grade/subject
 */
export const getStudentProgressBySubject = async (
  studentId: string,
  gradeLevel: number,
  subject?: string
): Promise<StudentTopicProgress[]> => {
  let query = supabase
    .from('student_topic_progress')
    .select(`
      *,
      topic:topics!inner(*)
    `)
    .eq('student_id', studentId)
    .eq('topic.grade_level', gradeLevel);

  if (subject) {
    query = query.eq('topic.subject', subject);
  }

  const { data, error } = await query.order('topic.topic_order');

  if (error) throw error;
  return data || [];
};

/**
 * Create or update topic progress
 */
export const upsertTopicProgress = async (
  studentId: string,
  topicId: string,
  progress: Partial<Omit<StudentTopicProgress, 'id' | 'student_id' | 'topic_id'>>
): Promise<StudentTopicProgress> => {
  const { data, error } = await supabase
    .from('student_topic_progress')
    .upsert({
      student_id: studentId,
      topic_id: topicId,
      ...progress,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update completion percentage
 */
export const updateCompletionPercentage = async (
  studentId: string,
  topicId: string,
  percentage: number
): Promise<void> => {
  const { error } = await supabase
    .from('student_topic_progress')
    .upsert({
      student_id: studentId,
      topic_id: topicId,
      completion_percentage: percentage,
      is_completed: percentage === 100,
      started_at: new Date().toISOString(),
    });

  if (error) throw error;
};

/**
 * Mark topic as completed
 */
export const markTopicCompleted = async (
  studentId: string,
  topicId: string
): Promise<void> => {
  const { error } = await supabase
    .from('student_topic_progress')
    .upsert({
      student_id: studentId,
      topic_id: topicId,
      completion_percentage: 100,
      is_completed: true,
      completed_at: new Date().toISOString(),
    });

  if (error) throw error;
};

/**
 * Update question statistics
 */
export const updateQuestionStats = async (
  studentId: string,
  topicId: string,
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
  }
): Promise<void> => {
  const { error } = await supabase
    .from('student_topic_progress')
    .upsert({
      student_id: studentId,
      topic_id: topicId,
      total_questions_solved: stats.totalQuestions,
      correct_answers: stats.correctAnswers,
      wrong_answers: stats.wrongAnswers,
    });

  if (error) throw error;
};

/**
 * Add source book to topic
 */
export const addSourceBook = async (
  studentId: string,
  topicId: string,
  bookName: string
): Promise<void> => {
  // First, get current source books
  const { data: current } = await supabase
    .from('student_topic_progress')
    .select('source_books')
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .maybeSingle();

  const currentBooks = (current?.source_books as string[]) || [];

  // Add new book if not already present
  if (!currentBooks.includes(bookName)) {
    const { error } = await supabase
      .from('student_topic_progress')
      .upsert({
        student_id: studentId,
        topic_id: topicId,
        source_books: [...currentBooks, bookName],
      });

    if (error) throw error;
  }
};

/**
 * Add a study session
 */
export const addStudySession = async (
  session: Omit<StudySession, 'id'>
): Promise<StudySession> => {
  const { data, error } = await supabase
    .from('topic_study_sessions')
    .insert(session)
    .select()
    .single();

  if (error) throw error;

  // Also update progress stats
  await updateProgressFromSession(session.student_id, session.topic_id);

  return data;
};

/**
 * Get study sessions for a topic
 */
export const getStudySessions = async (
  studentId: string,
  topicId?: string
): Promise<StudySession[]> => {
  let query = supabase
    .from('topic_study_sessions')
    .select('*')
    .eq('student_id', studentId);

  if (topicId) {
    query = query.eq('topic_id', topicId);
  }

  const { data, error } = await query.order('session_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get topic statistics for student
 */
export const getTopicStats = async (studentId: string): Promise<TopicStats> => {
  const { data, error } = await supabase
    .from('student_topic_progress')
    .select('*')
    .eq('student_id', studentId);

  if (error) throw error;

  const progress = data || [];
  const totalTopics = progress.length;
  const completedTopics = progress.filter((p) => p.is_completed).length;
  const inProgressTopics = progress.filter(
    (p) => p.completion_percentage > 0 && !p.is_completed
  ).length;

  const totalQuestionsSolved = progress.reduce(
    (sum, p) => sum + (p.total_questions_solved || 0),
    0
  );
  const totalCorrect = progress.reduce((sum, p) => sum + (p.correct_answers || 0), 0);

  const accuracy = totalQuestionsSolved > 0
    ? Math.round((totalCorrect / totalQuestionsSolved) * 100)
    : 0;

  return {
    totalTopics,
    completedTopics,
    inProgressTopics,
    totalQuestionsSolved,
    accuracy,
  };
};

/**
 * Helper: Update progress from all sessions
 */
const updateProgressFromSession = async (
  studentId: string,
  topicId: string
): Promise<void> => {
  // Get all sessions for this topic
  const { data: sessions } = await supabase
    .from('topic_study_sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('topic_id', topicId);

  if (!sessions || sessions.length === 0) return;

  // Calculate totals
  const totalQuestions = sessions.reduce((sum, s) => sum + (s.questions_solved || 0), 0);
  const correctAnswers = sessions.reduce((sum, s) => sum + (s.correct_count || 0), 0);
  const wrongAnswers = sessions.reduce((sum, s) => sum + (s.wrong_count || 0), 0);

  // Update progress
  await supabase
    .from('student_topic_progress')
    .upsert({
      student_id: studentId,
      topic_id: topicId,
      total_questions_solved: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      last_studied_at: new Date().toISOString(),
    });
};

/**
 * Delete topic progress
 */
export const deleteTopicProgress = async (
  studentId: string,
  topicId: string
): Promise<void> => {
  const { error } = await supabase
    .from('student_topic_progress')
    .delete()
    .eq('student_id', studentId)
    .eq('topic_id', topicId);

  if (error) throw error;
};
