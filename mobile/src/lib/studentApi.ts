import { supabase } from './supabase';

const isoDate = (date: Date) => date.toISOString().split('T')[0];

// ==================== PROFILE & STUDENT DATA ====================

export const fetchStudentProfile = async (userId: string) => {
  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('students').select('*').eq('user_id', userId).maybeSingle(),
  ]);
  return { profile, student };
};

export const getStudentInviteCode = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('invite_code')
    .eq('id', studentId)
    .single();
  if (error) throw error;
  return data?.invite_code;
};

// ==================== EXAM RESULTS ====================

export const fetchExamResults = async (studentId: string) => {
  const { data, error } = await supabase
    .from('exam_results')
    .select(`
      *,
      topic_scores(*)
    `)
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const addExamResult = async (studentId: string, payload: any) => {
  const { data, error } = await supabase
    .from('exam_results')
    .insert([{ student_id: studentId, ...payload }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateExamResult = async (examId: string, updates: any) => {
  const { error } = await supabase
    .from('exam_results')
    .update(updates)
    .eq('id', examId);
  if (error) throw error;
};

export const deleteExamResultById = async (examId: string) => {
  const { error } = await supabase.from('exam_results').delete().eq('id', examId);
  if (error) throw error;
};

// ==================== HOMEWORKS ====================

export const fetchHomeworks = async (studentId: string) => {
  const { data, error } = await supabase
    .from('homeworks')
    .select('*')
    .eq('student_id', studentId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const addHomeworkItem = async (studentId: string, payload: { title: string; due_date: string; description?: string }) => {
  const { data, error } = await supabase
    .from('homeworks')
    .insert([{ student_id: studentId, completed: false, ...payload }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateHomework = async (homeworkId: string, updates: any) => {
  const { error } = await supabase
    .from('homeworks')
    .update(updates)
    .eq('id', homeworkId);
  if (error) throw error;
};

export const deleteHomework = async (homeworkId: string) => {
  const { error } = await supabase
    .from('homeworks')
    .delete()
    .eq('id', homeworkId);
  if (error) throw error;
};

export const toggleHomeworkStatus = async (homeworkId: string, completed: boolean) => {
  const { error } = await supabase
    .from('homeworks')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', homeworkId);
  if (error) throw error;
};

// ==================== WEEKLY GOALS ====================

export const fetchWeeklyGoal = async (studentId: string) => {
  const { data, error } = await supabase
    .from('weekly_study_goals')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
};

export const upsertWeeklyGoal = async (studentId: string, weeklyHours: number) => {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const goal = {
    student_id: studentId,
    weekly_hours_target: weeklyHours,
    start_date: isoDate(start),
    end_date: isoDate(end),
    is_active: true,
  };
  const { error } = await supabase.from('weekly_study_goals').upsert(goal, { onConflict: 'student_id,is_active' });
  if (error) throw error;
};

export const updateWeeklyGoal = async (goalId: string, updates: any) => {
  const { error } = await supabase
    .from('weekly_study_goals')
    .update(updates)
    .eq('id', goalId);
  if (error) throw error;
};

// ==================== QUESTION PLANS ====================

export const fetchQuestionPlan = async (studentId: string) => {
  const start = new Date();
  const weekStart = isoDate(new Date(start.setDate(start.getDate() - ((start.getDay() + 6) % 7))));
  const { data, error } = await supabase
    .from('weekly_question_plans')
    .select('*')
    .eq('student_id', studentId)
    .eq('week_start_date', weekStart)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
};

export const upsertQuestionPlan = async (studentId: string, target: number, completedDelta?: number) => {
  const start = new Date();
  const weekStart = isoDate(new Date(start.setDate(start.getDate() - ((start.getDay() + 6) % 7))));
  const weekEnd = isoDate(new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000));
  const existing = await fetchQuestionPlan(studentId);
  const completed = Math.max(0, (existing?.questions_completed ?? 0) + (completedDelta ?? 0));

  const { data, error } = await supabase
    .from('weekly_question_plans')
    .upsert(
      {
        id: existing?.id,
        student_id: studentId,
        week_start_date: weekStart,
        week_end_date: weekEnd,
        question_target: target,
        questions_completed: completed,
      },
      { onConflict: 'student_id,week_start_date' },
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateQuestionPlan = async (planId: string, updates: any) => {
  const { error } = await supabase
    .from('weekly_question_plans')
    .update(updates)
    .eq('id', planId);
  if (error) throw error;
};

// ==================== STUDY SESSIONS ====================

export const addStudySession = async (sessionData: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert([sessionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getStudySession = async (studentId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const getWeeklyStudySessions = async (studentId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('student_id', studentId)
    .gte('session_date', startDate)
    .lte('session_date', endDate)
    .order('session_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

// ==================== POMODORO ====================

export const savePomodoroSession = async (sessionData: {
  student_id: string;
  session_date: string;
  duration_minutes: number;
  subject?: string;
  notes?: string;
  completed: boolean;
}) => {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert([sessionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getTodayPomodoroStats = async (studentId: string) => {
  const today = isoDate(new Date());
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('duration_minutes, completed')
    .eq('student_id', studentId)
    .eq('session_date', today);

  if (error) throw error;

  const sessions = data ?? [];
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return {
    totalSessions,
    completedSessions,
    totalMinutes,
    sessions
  };
};

export const getPomodoroSessions = async (studentId: string, startDate?: string, endDate?: string) => {
  let query = supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });

  if (startDate) {
    query = query.gte('session_date', startDate);
  }
  if (endDate) {
    query = query.lte('session_date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const getPomodoroStats = async (studentId: string) => {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('duration_minutes, completed, session_date')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
};

// ==================== CLASS DATA ====================

export const getClassAssignmentsForStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('class_assignments')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getClassAnnouncementsForStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('class_announcements')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getClassExamResultsForStudent = async (studentId: string) => {
  const { data, error } = await supabase
    .from('class_exam_results')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
