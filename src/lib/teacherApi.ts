import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import { PACKAGE_OPTIONS } from '../types/teacher';
import * as authApi from './authApi';

const hashPassword = (password: string): Promise<string> =>
  new Promise((resolve, reject) => {
    bcrypt.hash(password, 12, (err, hash) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(hash);
    });
  });

// Teacher Authentication
export const registerTeacher = async (teacherData: {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  school_name?: string;
}) => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(teacherData.email)) {
    throw new Error('Geçersiz email formatı');
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(teacherData.password)) {
    throw new Error('Şifre en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir');
  }

  // Validate phone number (10 digits)
  const phoneRegex = /^\d{10}$/;
  const normalizedPhone = teacherData.phone.replace(/\D/g, '');
  if (!phoneRegex.test(normalizedPhone)) {
    throw new Error('Telefon numarası 10 haneli olmalıdır');
  }

  // Check if email already exists
  const { data: existingTeacher } = await supabase
    .from('teachers')
    .select('id, user_id')
    .eq('email', teacherData.email)
    .maybeSingle();

  if (existingTeacher?.user_id) {
    throw new Error('Bu email adresi zaten kullanılıyor');
  }

  // Check if phone already exists
  const { data: existingPhone } = await supabase
    .from('teachers')
    .select('id')
    .eq('phone', normalizedPhone)
    .maybeSingle();

  if (existingPhone) {
    throw new Error('Bu telefon numarası zaten kullanılıyor');
  }

  // Create Supabase auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: teacherData.email,
    password: teacherData.password,
    options: {
      data: {
        full_name: teacherData.full_name,
        user_type: 'teacher'
      }
    }
  });

  if (signUpError) {
    throw new Error(signUpError.message || 'Supabase auth hesabı oluşturulamadı');
  }

  const authUserId = signUpData.user?.id;
  if (!authUserId) {
    throw new Error('Supabase auth kullanıcısı oluşturulamadı');
  }

  const hashedPassword = await hashPassword(teacherData.password);

  let teacherRecord;

  if (existingTeacher) {
    const { data, error } = await supabase
      .from('teachers')
      .update({
        password_hash: hashedPassword,
        full_name: teacherData.full_name,
        phone: normalizedPhone,
        school_name: teacherData.school_name,
        user_id: authUserId,
        email_confirmed: !!signUpData.session
      })
      .eq('id', existingTeacher.id)
      .select()
      .single();

    if (error) throw error;
    teacherRecord = data;
  } else {
    const { data, error } = await supabase
      .from('teachers')
      .insert([{
        id: authUserId,
        user_id: authUserId,
        email: teacherData.email,
        password_hash: hashedPassword,
        full_name: teacherData.full_name,
        phone: normalizedPhone,
        school_name: teacherData.school_name,
        email_confirmed: !!signUpData.session
      }])
      .select()
      .single();

    if (error) throw error;
    teacherRecord = data;
  }

  if (!teacherRecord) {
    return { data: null, error: null };
  }

  const { password_hash: _removed, ...safeData } = teacherRecord as Record<string, unknown>;

  return {
    data: safeData,
    error: null,
    requiresEmailConfirmation: !signUpData.session
  };
};

export const loginTeacher = async (email: string, password: string) => {
  // Use secure Worker API with HTTP-only cookies
  console.log('🔐 Teacher login with authApi (HTTP-only cookies)');
  const { user: authUser } = await authApi.login(email, password);

  if (!authUser) {
    throw new Error('Email veya şifre hatalı');
  }

  console.log('✅ Auth successful, fetching teacher record');

  let { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (teacherError) {
    throw teacherError;
  }

  if (!teacher && authUser.email) {
    const { data: fallbackTeacher, error: fallbackError } = await supabase
      .from('teachers')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();

    if (fallbackError) {
      throw fallbackError;
    }

    if (fallbackTeacher) {
      const { data: updatedTeacher, error: updateError } = await supabase
        .from('teachers')
        .update({ user_id: authUser.id })
        .eq('id', fallbackTeacher.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      teacher = updatedTeacher;
    }
  }

  if (!teacher) {
    throw new Error('Öğretmen kaydı bulunamadı');
  }

  const { password_hash: _removed, ...safeData } = teacher as Record<string, unknown>;

  return { data: safeData, error: null };
};


// Class Management
export const createClass = async (classData: {
  teacher_id: string;
  class_name: string;
  description?: string;
  student_capacity: number;
  package_type: 'monthly' | '6_months' | '9_months';
}) => {
  // Validate class name
  if (classData.class_name.length < 3 || classData.class_name.length > 50) {
    throw new Error('Sınıf adı 3-50 karakter arasında olmalıdır');
  }

  // Validate capacity
  if (classData.student_capacity < 5 || classData.student_capacity > 40) {
    throw new Error('Sınıf kapasitesi 5-40 öğrenci arasında olmalıdır');
  }

  // Check if class name is unique for this teacher
  const { data: existingClass } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', classData.teacher_id)
    .eq('class_name', classData.class_name)
    .maybeSingle();

  if (existingClass) {
    throw new Error('Bu sınıf adını zaten kullanıyorsunuz');
  }

  // Calculate pricing
  const packageOption = PACKAGE_OPTIONS.find(p => p.type === classData.package_type);
  if (!packageOption) {
    throw new Error('Geçersiz paket tipi');
  }

  const pricePerStudent = packageOption.price_per_student;
  const totalPrice = pricePerStudent * classData.student_capacity * packageOption.duration_months;

  // Create class
  const { data, error } = await supabase
    .from('classes')
    .insert([{
      ...classData,
      price_per_student: pricePerStudent,
      total_price: totalPrice,
      status: 'active' // Simplified - no payment verification needed for now
    }])
    .select()
    .single();

  if (error) throw error;

  return { data, error: null };
};

export const getTeacherClasses = async (teacherId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      class_students (
        id,
        student_id,
        joined_at,
        status
      )
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  return { data, error };
};


export const joinClassWithCode = async (studentId: string, inviteCode: string) => {
  // Find class by invite code
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (classError || !classData) {
    throw new Error('Geçersiz davet kodu');
  }

  // Check if class is active
  if (classData.status !== 'active') {
    throw new Error('Sınıf aktif değil. Ödeme tamamlanmamış olabilir.');
  }

  // Check capacity
  if (classData.current_students >= classData.student_capacity) {
    throw new Error('Sınıf kapasitesi dolu');
  }

  // Check if student already in this class
  const { data: existingMembership } = await supabase
    .from('class_students')
    .select('id')
    .eq('class_id', classData.id)
    .eq('student_id', studentId)
    .single();

  if (existingMembership) {
    throw new Error('Bu sınıfa zaten katıldınız');
  }

  // Check student's class count (max 3)
  const { data: studentClasses } = await supabase
    .from('class_students')
    .select('id')
    .eq('student_id', studentId)
    .eq('status', 'active');

  if (studentClasses && studentClasses.length >= 3) {
    throw new Error('Maksimum 3 sınıfa katılabilirsiniz');
  }

  // Join class
  const { data, error } = await supabase
    .from('class_students')
    .insert([{
      class_id: classData.id,
      student_id: studentId,
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;

  return { data: { ...data, class: classData }, error: null };
};

export const getStudentClasses = async (studentId: string) => {
  const { data, error } = await supabase
    .from('class_students')
    .select(`
      *,
      classes (
        *,
        teachers (
          full_name,
          school_name
        )
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'active');

  return { data, error };
};

export const leaveClass = async (studentId: string, classId: string) => {
  // Check if student joined less than 24 hours ago
  const { data: membership } = await supabase
    .from('class_students')
    .select('joined_at')
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .single();

  if (membership) {
    const joinedAt = new Date(membership.joined_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      throw new Error('Sınıfa katıldıktan sonra 24 saat içinde ayrılamazsınız');
    }
  }

  const { data, error } = await supabase
    .from('class_students')
    .update({ status: 'left' })
    .eq('student_id', studentId)
    .eq('class_id', classId)
    .select()
    .single();

  return { data, error };
};

// Class Management Functions
export const getClassData = async (classId: string) => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teachers(*),
      class_students(
        *,
        students(
          *,
          profiles(*)
        )
      )
    `)
    .eq('id', classId)
    .single();

  return { data, error };
};

export const getClassAssignments = async (classId: string) => {
  const { data, error } = await supabase
    .from('class_assignments')
    .select('*')
    .eq('class_id', classId)
    .order('due_date', { ascending: true });

  return { data, error };
};

export const getClassAnnouncements = async (classId: string) => {
  const { data, error } = await supabase
    .from('class_announcements')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const getClassExams = async (classId: string) => {
  const { data, error } = await supabase
    .from('class_exams')
    .select(`
      *,
      class_exam_results (
        id,
        class_exam_id,
        student_name,
        score,
        correct_answers,
        wrong_answers,
        empty_answers,
        student_note,
        ranking,
        uploaded_at
      )
    `)
    .eq('class_id', classId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return { data, error };
};

// Teacher Class Management
export const addClassAssignment = async (assignmentData: {
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  subject: string;
  due_date: string;
}) => {
  const { data, error } = await supabase
    .from('class_assignments')
    .insert([assignmentData])
    .select()
    .single();

  return { data, error };
};

export const addClassAnnouncement = async (announcementData: {
  class_id: string;
  teacher_id: string;
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}) => {
  const { data, error } = await supabase
    .from('class_announcements')
    .insert([announcementData])
    .select()
    .single();

  return { data, error };
};

export const addClassExam = async (examData: {
  class_id: string;
  teacher_id: string;
  exam_name: string;
  exam_type: string;
  exam_date: string;
  total_questions?: number;
}) => {
  const { data, error } = await supabase
    .from('class_exams')
    .insert([examData])
    .select()
    .single();

  return { data, error };
};

export const addClassExamResult = async (resultData: {
  class_exam_id: string;
  student_id: string;
  score: number;
  correct_answers?: number;
  wrong_answers?: number;
  empty_answers?: number;
}) => {
  const { data, error } = await supabase
    .from('class_exam_results')
    .insert([resultData])
    .select()
    .single();

  return { data, error };
};

// Update functions
export const updateClassAssignment = async (assignmentId: string, updates: any) => {
  const { data, error } = await supabase
    .from('class_assignments')
    .update(updates)
    .eq('id', assignmentId)
    .select()
    .single();

  return { data, error };
};

export const updateClassAnnouncement = async (announcementId: string, updates: any) => {
  const { data, error } = await supabase
    .from('class_announcements')
    .update(updates)
    .eq('id', announcementId)
    .select()
    .single();

  return { data, error };
};

export const updateClassExam = async (examId: string, updates: any) => {
  const { data, error } = await supabase
    .from('class_exams')
    .update(updates)
    .eq('id', examId)
    .select()
    .single();

  return { data, error };
};

// Delete functions
export const deleteClassAssignment = async (assignmentId: string) => {
  const { data, error } = await supabase
    .from('class_assignments')
    .delete()
    .eq('id', assignmentId);

  return { data, error };
};

export const deleteClassAnnouncement = async (announcementId: string) => {
  const { data, error } = await supabase
    .from('class_announcements')
    .delete()
    .eq('id', announcementId);

  return { data, error };
};

export const deleteClassExam = async (examId: string) => {
  const { data, error } = await supabase
    .from('class_exams')
    .delete()
    .eq('id', examId);

  return { data, error };
};

// File upload function (placeholder - implement with actual file storage)
export const uploadExamResultFile = async () => {
  // This would integrate with Supabase Storage or another file service
  // For now, return a success response
  return { data: { url: 'placeholder-url' }, error: null };
};

