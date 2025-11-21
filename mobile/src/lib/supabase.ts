import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Mobile doesn't need URL session detection
  },
});

// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const createProfile = async (profileData: any) => {
  const { data, error } = await supabase.from('profiles').insert([profileData]);
  return { data, error };
};

export const createStudentRecord = async (studentData: any) => {
  const { data, error } = await supabase.from('students').insert([studentData]);
  return { data, error };
};

export const createParentRecord = async (parentData: any) => {
  const { data, error } = await supabase.from('parents').insert([parentData]);
  return { data, error };
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const getStudentData = async (userId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(
      `
      *,
      profile:profiles!profile_id(*)
    `
    )
    .eq('user_id', userId)
    .single();

  return { data, error };
};

export const getParentData = async (userId: string) => {
  const { data, error } = await supabase
    .from('parents')
    .select(
      `
      *,
      profiles!inner(*),
      parent_student_connections(
        *,
        students(
          *,
          profiles!inner(*)
        )
      )
    `
    )
    .eq('user_id', userId)
    .single();
  return { data, error };
};

export const connectParentToStudent = async (
  parentId: string,
  inviteCode: string
) => {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('invite_code', inviteCode)
    .single();

  if (studentError || !student) {
    return { data: null, error: { message: 'Geçersiz davet kodu' } };
  }

  const { data, error } = await supabase
    .from('parent_student_connections')
    .insert([
      {
        parent_id: parentId,
        student_id: student.id,
      },
    ]);

  return { data, error };
};

export const getStudentInviteCode = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('invite_code')
    .eq('id', studentId)
    .single();
  return { data, error };
};

export const getExamResults = async (studentId: string) => {
  const { data, error } = await supabase
    .from('exam_results')
    .select(
      `
      *,
      topic_scores(*)
    `
    )
    .eq('student_id', studentId)
    .order('exam_date', { ascending: false });
  return { data, error };
};

export const getHomeworks = async (studentId: string) => {
  const { data, error } = await supabase
    .from('homeworks')
    .select('*')
    .eq('student_id', studentId)
    .order('due_date', { ascending: true });
  return { data, error };
};

export const getAIRecommendations = async (studentId: string) => {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getStudySession = async (studentId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });
  return { data, error };
};

export const addExamResult = async (examData: any) => {
  const { data, error } = await supabase
    .from('exam_results')
    .insert([examData])
    .select();

  return { data, error };
};

export const addHomework = async (homeworkData: any) => {
  const { data, error } = await supabase
    .from('homeworks')
    .insert([homeworkData]);
  return { data, error };
};

export const updateHomework = async (homeworkId: string, updates: any) => {
  const { data, error } = await supabase
    .from('homeworks')
    .update(updates)
    .eq('id', homeworkId);
  return { data, error };
};

export const deleteExamResult = async (examId: string) => {
  const { data, error } = await supabase
    .from('exam_results')
    .delete()
    .eq('id', examId);
  return { data, error };
};

export const updateExamResult = async (examId: string, updates: any) => {
  const { data, error } = await supabase
    .from('exam_results')
    .update(updates)
    .eq('id', examId);
  return { data, error };
};

export const deleteHomework = async (homeworkId: string) => {
  const { data, error } = await supabase
    .from('homeworks')
    .delete()
    .eq('id', homeworkId);
  return { data, error };
};

export const addStudySession = async (sessionData: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert([sessionData]);
  return { data, error };
};

// Weekly Study Goals
export const getWeeklyStudyGoal = async (studentId: string) => {
  const { data, error } = await supabase
    .from('weekly_study_goals')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_active', true)
    .maybeSingle();
  return { data, error };
};

export const createWeeklyStudyGoal = async (goalData: any) => {
  const { data, error } = await supabase
    .from('weekly_study_goals')
    .insert([goalData]);
  return { data, error };
};

export const updateWeeklyStudyGoal = async (goalId: string, updates: any) => {
  const { data, error } = await supabase
    .from('weekly_study_goals')
    .update(updates)
    .eq('id', goalId);
  return { data, error };
};

// Pomodoro sessions
export const savePomodoroSession = async (sessionData: {
  student_id: string;
  session_type: 'focus' | 'shortBreak' | 'longBreak';
  duration_minutes: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
}) => {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert([sessionData]);

  if (error) throw error;
  return data;
};

export const getTodayPomodoroStats = async (studentId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('student_id', studentId)
    .gte('started_at', today.toISOString())
    .eq('session_type', 'focus')
    .eq('completed', true);

  if (error) {
    console.error('Error fetching today stats:', error);
    throw error;
  }

  return {
    focusSessions: data?.length || 0,
    totalMinutes:
      data?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0,
    currentStreak: data?.length || 0,
  };
};

export const getPomodoroSessions = async (
  studentId: string,
  startDate?: string,
  endDate?: string
) => {
  let query = supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false });

  if (startDate) {
    query = query.gte('started_at', startDate);
  }
  if (endDate) {
    query = query.lte('started_at', endDate);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getPomodoroStats = async (studentId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .select('*')
    .eq('student_id', studentId)
    .eq('session_type', 'focus')
    .eq('completed', true)
    .gte('started_at', today.toISOString());

  return { data, error };
};
