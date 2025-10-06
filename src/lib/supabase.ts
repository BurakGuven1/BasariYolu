import { createClient }  from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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

// Database helpers
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
      profiles!inner(*)
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
  // First, find the student by invite code
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('invite_code', inviteCode)
    .single();

  if (studentError || !student) {
    return { data: null, error: { message: 'Geçersiz davet kodu' } };
  }

  // Create connection
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
  console.log('addExamResult called with:', examData);
  
  const { data, error } = await supabase
    .from('exam_results')
    .insert([examData]);
    
  console.log('Database response:', { data, error });
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
  // Get classes that student is member of
  const { data: studentClasses } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (!studentClasses || studentClasses.length === 0) {
    return { data: [], error: null };
  }

  const classIds = studentClasses.map(sc => sc.class_id);

  const { data, error } = await supabase
    .from('class_assignments')
    .select('*')
    .in('class_id', classIds)
    .order('due_date', { ascending: true });

  return { data, error };
};

export const getClassAnnouncementsForStudent = async (studentId: string) => {
  // Get classes that student is member of
  const { data: studentClasses } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (!studentClasses || studentClasses.length === 0) {
    return { data: [], error: null };
  }

  const classIds = studentClasses.map(sc => sc.class_id);

  const { data, error } = await supabase
    .from('class_announcements')
    .select('*')
    .in('class_id', classIds)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getClassExamResultsForStudent = async (studentId: string) => {
  // Get classes that student is member of
  const { data: studentClasses } = await supabase
    .from('class_students')
    .select('class_id')
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (!studentClasses || studentClasses.length === 0) {
    return { data: [], error: null };
  }

  const classIds = studentClasses.map(sc => sc.class_id);

  const { data, error } = await supabase
    .from('class_exam_results')
    .select(`
      *,
      class_exams!inner(
        *,
        classes!inner(class_name)
      )
    `)
    .eq('student_id', studentId)
    .in('class_exams.class_id', classIds)
    .order('created_at', { ascending: false });

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