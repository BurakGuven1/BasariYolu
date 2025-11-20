import { supabase } from './supabase';

export interface QuestionSolveData {
  studentId: string;
  questionId: string;
  questionSource: 'institution' | 'platform' | 'external';
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeSpentSeconds?: number;
  studentAnswer?: string;
}

/**
 * Record that a student solved a question
 * This updates weekly goals and checks for achievements automatically
 */
export async function recordQuestionSolve(data: QuestionSolveData) {
  try {
    const { data: result, error } = await supabase.rpc('record_question_solve', {
      p_student_id: data.studentId,
      p_question_id: data.questionId,
      p_question_source: data.questionSource,
      p_subject: data.subject,
      p_topic: data.topic,
      p_difficulty: data.difficulty,
      p_is_correct: data.isCorrect,
      p_time_spent_seconds: data.timeSpentSeconds || null,
      p_student_answer: data.studentAnswer || null,
    });

    if (error) throw error;

    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error recording question solve:', error);
    return { data: null, error };
  }
}

/**
 * Get student's question statistics
 */
export async function getStudentQuestionStats(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('student_question_stats')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    return {
      data: data || {
        total_questions_solved: 0,
        correct_answers: 0,
        subjects_practiced: 0,
        questions_this_week: 0,
        questions_today: 0,
        success_rate: 0,
        avg_time_seconds: 0,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching question stats:', error);
    return { data: null, error };
  }
}

/**
 * Get solved questions history
 */
export async function getSolvedQuestionsHistory(
  studentId: string,
  options?: {
    limit?: number;
    offset?: number;
    subject?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  try {
    let query = supabase
      .from('student_solved_questions')
      .select('*')
      .eq('student_id', studentId)
      .order('solved_at', { ascending: false });

    if (options?.subject) {
      query = query.eq('subject', options.subject);
    }

    if (options?.startDate) {
      query = query.gte('solved_at', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('solved_at', options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching solved questions:', error);
    return { data: [], error };
  }
}

/**
 * Get weekly question progress
 */
export async function getWeeklyQuestionProgress(studentId: string) {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);

    // Get weekly plan
    const { data: plan, error: planError } = await supabase
      .from('weekly_question_plans')
      .select('*')
      .eq('student_id', studentId)
      .eq('week_start_date', weekStart.toISOString().split('T')[0])
      .single();

    if (planError && planError.code !== 'PGRST116') {
      throw planError;
    }

    // Get actual count for this week
    const { count, error: countError } = await supabase
      .from('student_solved_questions')
      .select('question_id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .gte('solved_at', weekStart.toISOString())
      .lte('solved_at', weekEnd.toISOString());

    if (countError) throw countError;

    return {
      data: {
        target: plan?.question_target || 50,
        completed: count || 0,
        percentage: Math.round(((count || 0) / (plan?.question_target || 50)) * 100),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching weekly progress:', error);
    return { data: null, error };
  }
}

/**
 * Get subject-wise performance
 */
export async function getSubjectPerformance(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('student_solved_questions')
      .select('subject, is_correct, difficulty')
      .eq('student_id', studentId);

    if (error) throw error;

    // Group by subject
    const subjectStats: Record<
      string,
      {
        total: number;
        correct: number;
        successRate: number;
        easy: number;
        medium: number;
        hard: number;
      }
    > = {};

    data.forEach((q: any) => {
      if (!subjectStats[q.subject]) {
        subjectStats[q.subject] = {
          total: 0,
          correct: 0,
          successRate: 0,
          easy: 0,
          medium: 0,
          hard: 0,
        };
      }

      subjectStats[q.subject].total++;
      if (q.is_correct) subjectStats[q.subject].correct++;

      if (q.difficulty === 'easy') subjectStats[q.subject].easy++;
      else if (q.difficulty === 'medium') subjectStats[q.subject].medium++;
      else if (q.difficulty === 'hard') subjectStats[q.subject].hard++;
    });

    // Calculate success rates
    Object.keys(subjectStats).forEach((subject) => {
      const stats = subjectStats[subject];
      stats.successRate = Math.round((stats.correct / stats.total) * 100);
    });

    return {
      data: Object.entries(subjectStats).map(([subject, stats]) => ({
        subject,
        ...stats,
      })),
      error: null,
    };
  } catch (error: any) {
    console.error('Error fetching subject performance:', error);
    return { data: [], error };
  }
}
