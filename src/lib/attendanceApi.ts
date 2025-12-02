import { supabase } from './supabase';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
  id?: string;
  institution_id: string;
  class_id?: string;
  student_id: string;
  teacher_id?: string;
  attendance_date: string; // YYYY-MM-DD
  lesson_time?: string;
  subject?: string;
  status: AttendanceStatus;
  excuse_reason?: string;
  notes?: string;
  notified_parent?: boolean;
  notified_at?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Join'den gelen alanlar
  student?: {
    id: string;
    profile?: {
      full_name: string;
    };
  };
  teacher?: {
    id: string;
    full_name: string;
  };
}

export interface AttendanceStats {
  student_id: string;
  institution_id: string;
  total_present: number;
  total_absent: number;
  total_late: number;
  total_excused: number;
  total_records: number;
  attendance_percentage: number;
  last_attendance_date: string;
  absent_last_7_days: number;
  absent_last_30_days: number;
}

/**
 * Yoklama al (öğretmen veya kurum)
 */
export const recordAttendance = async (
  attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Attendance | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendanceData])
      .select()
      .single();

    if (error) throw error;

    return { data: data as Attendance, error: null };
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    return { data: null, error };
  }
};

/**
 * Toplu yoklama al (tüm sınıf için)
 */
export const recordBulkAttendance = async (
  attendanceRecords: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>[]
): Promise<{ data: Attendance[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select();

    if (error) throw error;

    return { data: data as Attendance[], error: null };
  } catch (error: any) {
    console.error('Error recording bulk attendance:', error);
    return { data: null, error };
  }
};

/**
 * Yoklamayı güncelle
 */
export const updateAttendance = async (
  attendanceId: string,
  updates: Partial<Attendance>
): Promise<{ data: Attendance | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as Attendance, error: null };
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return { data: null, error };
  }
};

/**
 * Sınıfın belirli tarih için yoklama kayıtlarını getir
 */
export const getClassAttendance = async (
  classId: string,
  date: string
): Promise<{ data: Attendance[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:students!attendance_student_id_fkey(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name
          )
        )
      `)
      .eq('class_id', classId)
      .eq('attendance_date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data as Attendance[], error: null };
  } catch (error: any) {
    console.error('Error fetching class attendance:', error);
    return { data: null, error };
  }
};

/**
 * Öğrencinin devamsızlık kayıtlarını getir
 */
export const getStudentAttendance = async (
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: Attendance[] | null; error: any }> => {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        teacher:teachers!attendance_teacher_id_fkey(
          id,
          full_name
        )
      `)
      .eq('student_id', studentId)
      .order('attendance_date', { ascending: false });

    if (startDate) {
      query = query.gte('attendance_date', startDate);
    }

    if (endDate) {
      query = query.lte('attendance_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as Attendance[], error: null };
  } catch (error: any) {
    console.error('Error fetching student attendance:', error);
    return { data: null, error };
  }
};

/**
 * Kurumun tüm devamsızlık kayıtlarını getir
 */
export const getInstitutionAttendance = async (
  institutionId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    classId?: string;
    status?: AttendanceStatus;
  }
): Promise<{ data: Attendance[] | null; error: any }> => {
  try {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students!attendance_student_id_fkey(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name
          )
        ),
        teacher:teachers!attendance_teacher_id_fkey(
          id,
          full_name
        )
      `)
      .eq('institution_id', institutionId)
      .order('attendance_date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('attendance_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('attendance_date', filters.endDate);
    }

    if (filters?.classId) {
      query = query.eq('class_id', filters.classId);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as Attendance[], error: null };
  } catch (error: any) {
    console.error('Error fetching institution attendance:', error);
    return { data: null, error };
  }
};

/**
 * Öğrenci devamsızlık istatistiklerini getir
 */
export const getStudentAttendanceStats = async (
  studentId: string
): Promise<{ data: AttendanceStats | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('student_attendance_stats')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { data: data as AttendanceStats, error: null };
  } catch (error: any) {
    console.error('Error fetching student attendance stats:', error);
    return { data: null, error };
  }
};

/**
 * Sınıf devamsızlık özeti
 */
export const getClassAttendanceSummary = async (
  classId: string,
  date?: string
): Promise<{
  data: {
    total_students: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    not_recorded: number;
  } | null;
  error: any;
}> => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Sınıftaki öğrenci sayısı
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (studentsError) throw studentsError;

    const totalStudents = classStudents?.length || 0;

    // Bugünkü yoklama kayıtları
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('status')
      .eq('class_id', classId)
      .eq('attendance_date', targetDate);

    if (attendanceError) throw attendanceError;

    const summary = {
      total_students: totalStudents,
      present: attendanceData?.filter(a => a.status === 'present').length || 0,
      absent: attendanceData?.filter(a => a.status === 'absent').length || 0,
      late: attendanceData?.filter(a => a.status === 'late').length || 0,
      excused: attendanceData?.filter(a => a.status === 'excused').length || 0,
      not_recorded: totalStudents - (attendanceData?.length || 0)
    };

    return { data: summary, error: null };
  } catch (error: any) {
    console.error('Error fetching class attendance summary:', error);
    return { data: null, error };
  }
};

/**
 * Devamsızlık yapan öğrencileri getir (bildirim için)
 */
export const getUnnotifiedAbsences = async (
  institutionId: string
): Promise<{ data: Attendance[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:students!attendance_student_id_fkey(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name
          )
        )
      `)
      .eq('institution_id', institutionId)
      .eq('status', 'absent')
      .eq('notified_parent', false)
      .order('attendance_date', { ascending: false });

    if (error) throw error;

    return { data: data as Attendance[], error: null };
  } catch (error: any) {
    console.error('Error fetching unnotified absences:', error);
    return { data: null, error };
  }
};

/**
 * Devamsızlık bildirimini işaretle
 */
export const markAttendanceNotified = async (
  attendanceIds: string[]
): Promise<{ data: boolean; error: any }> => {
  try {
    const { error } = await supabase
      .from('attendance')
      .update({
        notified_parent: true,
        notified_at: new Date().toISOString()
      })
      .in('id', attendanceIds);

    if (error) throw error;

    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error marking attendance notified:', error);
    return { data: false, error };
  }
};

/**
 * Günlük devamsızlık raporu (kurum için)
 */
export const getDailyAttendanceReport = async (
  institutionId: string,
  date?: string
): Promise<{
  data: {
    date: string;
    total_records: number;
    absent_count: number;
    late_count: number;
    critical_students: Array<{
      student_id: string;
      student_name: string;
      consecutive_absences: number;
    }>;
  } | null;
  error: any;
}> => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Günlük devamsızlık kayıtları
    const { data: dailyAttendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        student:students!attendance_student_id_fkey(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name
          )
        )
      `)
      .eq('institution_id', institutionId)
      .eq('attendance_date', targetDate);

    if (error) throw error;

    const absentCount = dailyAttendance?.filter(a => a.status === 'absent').length || 0;
    const lateCount = dailyAttendance?.filter(a => a.status === 'late').length || 0;

    // Kritik öğrenciler (son 3 gün üst üste devamsızlık)
    // Bu kısım daha karmaşık bir sorgu gerektirir, şimdilik boş bırakıyoruz
    const criticalStudents: any[] = [];

    return {
      data: {
        date: targetDate,
        total_records: dailyAttendance?.length || 0,
        absent_count: absentCount,
        late_count: lateCount,
        critical_students: criticalStudents
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error fetching daily attendance report:', error);
    return { data: null, error };
  }
};
