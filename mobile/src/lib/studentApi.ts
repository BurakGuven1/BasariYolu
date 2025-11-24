import { supabase } from './supabase';

const isoDate = (date: Date) => date.toISOString().split('T')[0];

export const fetchStudentProfile = async (userId: string) => {
  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from('profiles').select('full_name,grade,school_name,package_type').eq('id', userId).maybeSingle(),
    supabase.from('students').select('id, invite_code').eq('user_id', userId).maybeSingle(),
  ]);
  return { profile, student };
};

export const fetchExamResults = async (studentId: string) => {
  const { data, error } = await supabase
    .from('exam_results')
    .select('id, exam_name, exam_date, score, total_score')
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
};

export const addExamResult = async (studentId: string, payload: { exam_name: string; exam_date: string; score?: number; total_score?: number }) => {
  const { error } = await supabase.from('exam_results').insert([{ student_id: studentId, ...payload }]);
  if (error) throw error;
};

export const deleteExamResultById = async (examId: string) => {
  const { error } = await supabase.from('exam_results').delete().eq('id', examId);
  if (error) throw error;
};

export const fetchHomeworks = async (studentId: string) => {
  const { data, error } = await supabase
    .from('homeworks')
    .select('id, title, due_date, status, completed, completed_at')
    .eq('student_id', studentId)
    .order('due_date', { ascending: true })
    .limit(20);
  if (error) throw error;
  return data ?? [];
};

export const addHomeworkItem = async (studentId: string, payload: { title: string; due_date: string }) => {
  const { error } = await supabase.from('homeworks').insert([{ student_id: studentId, ...payload }]);
  if (error) throw error;
};

export const toggleHomeworkStatus = async (homeworkId: string, completed: boolean) => {
  const { error } = await supabase
    .from('homeworks')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', homeworkId);
  if (error) throw error;
};

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
