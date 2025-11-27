import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'basariyolu-auth-token',
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'basariyolu-web'
    }
  }
});

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const createProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData]);
  return { data, error };
};

export const createStudentRecord = async (studentData: any) => {
  const { data, error } = await supabase
    .from('students')
    .insert([studentData]);
  return { data, error };
};

export const createParentRecord = async (parentData: any) => {
  const { data, error } = await supabase
    .from('parents')
    .insert([parentData]);
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
    .select(`
      *,
      profile:profiles!profile_id(*)
    `)
    .eq('user_id', userId)
    .single();
  
  return { data, error };
};

export const getParentData = async (userId: string) => {
  const { data, error } = await supabase
    .from('parents')
    .select(`
      *,
      profiles!inner(*),
      parent_student_connections(
        *,
        students(
          *,
          profiles!inner(*)
        )
      )
    `)
    .eq('user_id', userId)
    .single();
  return { data, error };
};

export const connectParentToStudent = async (parentId: string, inviteCode: string) => {
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
    .insert([{
      parent_id: parentId,
      student_id: student.id
    }]);

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
    .select(`
      *,
      topic_scores(*)
    `)
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
  console.log('📝 addExamResult called with:', examData);
  
  const { data, error } = await supabase
    .from('exam_results')
    .insert([examData])
    .select();
    
  console.log('📡 Database response:', { data, error });
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

// Class-related functions for students
export const getClassAssignmentsForStudent = async (studentId: string) => {
  const { data, error } = await supabase.rpc('student_class_assignments', {
    p_student_id: studentId
  });

  return { data: data ?? [], error };
};

export const getClassAnnouncementsForStudent = async (studentId: string) => {
  const { data, error } = await supabase.rpc('student_class_announcements', {
    p_student_id: studentId
  });

  return { data: data ?? [], error };
};

export const getClassExamResultsForStudent = async (studentId: string) => {
  const { data, error } = await supabase.rpc('student_class_exam_results', {
    p_student_id: studentId
  });

  const normalized =
    (data ?? []).map(result => ({
      ...result,
      class_exams: {
        class_id: result.class_id,
        exam_name: result.exam_name,
        exam_date: result.exam_date
      }
    })) ?? [];

  return { data: normalized, error };
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

// Weekly question tracking
export const getWeeklyQuestionPlan = async (studentId: string, weekStartDate: string) => {
  const { data, error } = await supabase
    .from('weekly_question_plans')
    .select('*')
    .eq('student_id', studentId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();
  return { data, error };
};

export const upsertWeeklyQuestionPlan = async (planData: {
  student_id: string;
  week_start_date: string;
  week_end_date: string;
  question_target: number;
  questions_completed?: number;
}) => {
  const { data, error } = await supabase
    .from('weekly_question_plans')
    .upsert(planData, {
      onConflict: 'student_id,week_start_date',
      ignoreDuplicates: false
    })
    .select()
    .single();
  return { data, error };
};

export const updateWeeklyQuestionPlan = async (planId: string, updates: any) => {
  const { data, error } = await supabase
    .from('weekly_question_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();
  return { data, error };
};

// Get study sessions for current week
export const getWeeklyStudySessions = async (studentId: string, startDate: string, endDate: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('student_id', studentId)
    .gte('session_date', startDate)
    .lte('session_date', endDate);
  return { data, error };
};

// Pomodoro session kaydetme
export async function savePomodoroSession(sessionData: {
  student_id: string;
  session_type: 'focus' | 'shortBreak' | 'longBreak';
  duration_minutes: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
}) {
  const { data, error } = await supabase
    .from('pomodoro_sessions')
    .insert([sessionData]);

  if (error) throw error;
  return data;
}

// Bugünün pomodoro istatistiklerini getir
export async function getTodayPomodoroStats(studentId: string) {
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
    totalMinutes: data?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0,
    currentStreak: data?.length || 0
  };
}

export const getPomodoroSessions = async (studentId: string, startDate?: string, endDate?: string) => {
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

