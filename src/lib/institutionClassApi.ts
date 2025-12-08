import { supabase } from './supabase';

export interface InstitutionClass {
  id: string;
  institution_id: string;
  class_name: string;
  class_description?: string;
  grade_level?: string;
  branch?: string;
  advisor_teacher_id?: string;
  student_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionClassStudent {
  id: string;
  institution_id: string;
  class_id: string;
  student_id: string;
  enrollment_date: string;
  exit_date?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClassStudentWithProfile {
  id: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  enrollment_date: string;
  is_active: boolean;
}

/**
 * Get all classes for an institution
 */
export const getInstitutionClasses = async (institutionId: string) => {
  try {
    const { data, error } = await supabase
      .from('institution_classes')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .order('class_name');

    if (error) throw error;
    return { data: data as InstitutionClass[], error: null };
  } catch (error: any) {
    console.error('Error fetching institution classes:', error);
    return { data: null, error };
  }
};

/**
 * Get students for a specific class
 */
export const getClassStudents = async (classId: string) => {
  try {
    // First get the enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('institution_class_students')
      .select('id, student_id, enrollment_date, is_active')
      .eq('class_id', classId)
      .eq('is_active', true);

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) {
      return { data: [], error: null };
    }

    // Then get the student profiles
    const studentIds = enrollments.map(e => e.student_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds);

    if (profileError) {
      console.warn('Could not fetch profiles:', profileError);
    }

    // Merge data
    const students: ClassStudentWithProfile[] = enrollments.map(enrollment => {
      const profile = profiles?.find(p => p.id === enrollment.student_id);
      return {
        id: enrollment.id,
        student_id: enrollment.student_id,
        student_name: profile?.full_name || 'İsimsiz Öğrenci',
        student_email: profile?.email,
        enrollment_date: enrollment.enrollment_date,
        is_active: enrollment.is_active
      };
    });

    return { data: students, error: null };
  } catch (error: any) {
    console.error('Error fetching class students:', error);
    return { data: null, error };
  }
};

/**
 * Get student's current active class in an institution
 */
export const getStudentActiveClass = async (studentId: string, institutionId: string) => {
  try {
    // Get the active enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('institution_class_students')
      .select('*, class_id')
      .eq('student_id', studentId)
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .maybeSingle();

    if (enrollError) throw enrollError;
    if (!enrollment) {
      return { data: null, error: null };
    }

    // Get the class details
    const { data: classData, error: classError } = await supabase
      .from('institution_classes')
      .select('id, class_name, class_description, grade_level, branch')
      .eq('id', enrollment.class_id)
      .single();

    if (classError) throw classError;

    return {
      data: {
        ...enrollment,
        class: classData
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching student active class:', error);
    return { data: null, error };
  }
};

/**
 * Assign student to a class
 */
export const assignStudentToClass = async (
  institutionId: string,
  classId: string,
  studentId: string,
  notes?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // First, deactivate any existing active enrollment
    await supabase
      .from('institution_class_students')
      .update({ is_active: false, exit_date: new Date().toISOString().split('T')[0] })
      .eq('institution_id', institutionId)
      .eq('student_id', studentId)
      .eq('is_active', true);

    // Then create new enrollment
    const { data, error } = await supabase
      .from('institution_class_students')
      .insert([{
        institution_id: institutionId,
        class_id: classId,
        student_id: studentId,
        notes,
        is_active: true,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data: data as InstitutionClassStudent, error: null };
  } catch (error: any) {
    console.error('Error assigning student to class:', error);
    return { data: null, error };
  }
};

/**
 * Remove student from class (deactivate)
 */
export const removeStudentFromClass = async (enrollmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('institution_class_students')
      .update({
        is_active: false,
        exit_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as InstitutionClassStudent, error: null };
  } catch (error: any) {
    console.error('Error removing student from class:', error);
    return { data: null, error };
  }
};

/**
 * Change student's class (deactivate old, activate new)
 */
export const changeStudentClass = async (
  institutionId: string,
  studentId: string,
  newClassId: string,
  notes?: string
) => {
  return assignStudentToClass(institutionId, newClassId, studentId, notes);
};

/**
 * Get all students in institution with their class info
 */
export const getInstitutionStudentsWithClass = async (institutionId: string) => {
  try {
    // Get approved students
    const { data: students, error: studentsError } = await supabase
      .from('institution_student_requests')
      .select('user_id, full_name, email')
      .eq('institution_id', institutionId)
      .eq('status', 'approved')
      .order('full_name');

    if (studentsError) throw studentsError;

    // Get their class enrollments
    const studentIds = students?.map(s => s.user_id) || [];

    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('institution_class_students')
      .select(`
        student_id,
        class:institution_classes (
          id,
          class_name
        )
      `)
      .eq('institution_id', institutionId)
      .in('student_id', studentIds)
      .eq('is_active', true);

    if (enrollmentsError) throw enrollmentsError;

    // Map enrollments to students
    const enrollmentMap = new Map(
      enrollments?.map((e: any) => [e.student_id, e.class]) || []
    );

    const studentsWithClass = (students || []).map(student => ({
      user_id: student.user_id,
      full_name: student.full_name,
      email: student.email,
      class: enrollmentMap.get(student.user_id) || null
    }));

    return { data: studentsWithClass, error: null };
  } catch (error: any) {
    console.error('Error fetching institution students with class:', error);
    return { data: null, error };
  }
};

/**
 * Bulk assign students to a class
 */
export const bulkAssignStudentsToClass = async (
  institutionId: string,
  classId: string,
  studentIds: string[]
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const studentId of studentIds) {
      const { error } = await assignStudentToClass(institutionId, classId, studentId);
      if (error) {
        results.failed++;
        results.errors.push(`${studentId}: ${error.message}`);
      } else {
        results.success++;
      }
    }

    return { data: results, error: null };
  } catch (error: any) {
    console.error('Error bulk assigning students:', error);
    return { data: null, error };
  }
};
