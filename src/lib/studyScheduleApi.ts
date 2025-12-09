import { supabase } from './supabase';

export interface StudyScheduleItem {
  id?: string;
  schedule_id?: string;
  day_of_week: number; // 0=Pazartesi, 6=Pazar
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  subject: string;
  topic?: string;
  description?: string;
  goal?: string;
  resources?: string;
  is_completed?: boolean;
  completed_at?: string;
  created_at?: string;
}

export type ScheduleGoalStatus = 'achieved' | 'partial' | 'not_met';

export interface StudyScheduleFeedback {
  id?: string;
  schedule_id: string;
  schedule_item_id: string;
  student_id: string;
  goal_status: ScheduleGoalStatus;
  time_spent_minutes?: number | null;
  difficulty_level?: number | null;
  resources_used?: string | null;
  reflection?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudySchedule {
  id?: string;
  student_id: string;
  teacher_id: string;
  class_id?: string;
  title: string;
  description?: string;
  week_start_date: string;
  week_end_date: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  items?: StudyScheduleItem[];
}

/**
 * Öğretmen için haftalık çalışma programı oluşturma
 */
export const createStudySchedule = async (scheduleData: StudySchedule): Promise<{ data: any; error: any }> => {
  try {
    console.log('🔍 Creating schedule with:', {
      student_id: scheduleData.student_id,
      teacher_id: scheduleData.teacher_id,
      class_id: scheduleData.class_id
    });

    // DOĞRUDAN INSERT - Auth kontrolü YOK
    const { data: schedule, error: scheduleError } = await supabase
      .from('study_schedules')
      .insert({
        student_id: scheduleData.student_id,
        teacher_id: scheduleData.teacher_id,
        class_id: scheduleData.class_id,
        title: scheduleData.title,
        description: scheduleData.description,
        week_start_date: scheduleData.week_start_date,
        week_end_date: scheduleData.week_end_date,
        status: 'active'
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Schedule error:', scheduleError);
      throw scheduleError;
    }

    console.log('✅ Schedule created:', schedule.id);

    // Items ekle
    if (scheduleData.items && scheduleData.items.length > 0) {
      const items = scheduleData.items.map(item => ({
        schedule_id: schedule.id,
        day_of_week: item.day_of_week,
        start_time: item.start_time,
        end_time: item.end_time,
        subject: item.subject,
        topic: item.topic || null,
        description: item.description || null,
        goal: item.goal || null,
        resources: item.resources || null
      }));

      const { error: itemsError } = await supabase
        .from('study_schedule_items')
        .insert(items);

      if (itemsError) {
        console.error('❌ Items error:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items created:', items.length);
    }

    return { data: schedule, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};

/**
 * Öğretmen için sınıftaki tüm öğrencilere toplu program atama
 */
export const createBulkStudySchedule = async (
  classId: string,
  teacherId: string,
  scheduleTemplate: Omit<StudySchedule, 'student_id' | 'teacher_id' | 'class_id'>
): Promise<{ data: any; error: any }> => {
  try {
    // Sınıftaki aktif öğrencileri al
    const { data: classStudents, error: studentsError } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (studentsError) throw studentsError;
    if (!classStudents || classStudents.length === 0) {
      return { data: null, error: { message: 'Sınıfta aktif öğrenci bulunamadı' } };
    }

    // Tek seferde schedule kayıtlarını oluştur
    const schedulesToInsert = classStudents.map(cs => ({
      title: scheduleTemplate.title,
      description: scheduleTemplate.description,
      week_start_date: scheduleTemplate.week_start_date,
      week_end_date: scheduleTemplate.week_end_date,
      status: 'active',
      student_id: cs.student_id,
      teacher_id: teacherId,
      class_id: classId
    }));

    const { data: insertedSchedules, error: bulkInsertError } = await supabase
      .from('study_schedules')
      .insert(schedulesToInsert)
      .select('id, student_id');

    if (bulkInsertError) throw bulkInsertError;

    if (scheduleTemplate.items && scheduleTemplate.items.length > 0 && insertedSchedules) {
      const itemsToInsert = insertedSchedules.flatMap(schedule =>
        scheduleTemplate.items!.map(item => ({
          schedule_id: schedule.id,
          day_of_week: item.day_of_week,
          start_time: item.start_time,
          end_time: item.end_time,
          subject: item.subject,
          topic: item.topic || null,
          description: item.description || null,
          goal: item.goal || null,
          resources: item.resources || null
        }))
      );

      const { error: itemsError } = await supabase
        .from('study_schedule_items')
        .insert(itemsToInsert);

      if (itemsError) {
        const cleanupIds = insertedSchedules.map(schedule => schedule.id);
        await supabase
          .from('study_schedules')
          .delete()
          .in('id', cleanupIds);

        throw itemsError;
      }
    }

    return {
      data: {
        success: true,
        count: classStudents.length,
        message: `${classStudents.length} Öğrenci için program oluşturuldu`
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error creating bulk study schedule:', error);
    return { data: null, error };
  }
};

/**
 * Öğrenci için çalışma programlarını getir
 */
export const getStudentStudySchedules = async (studentId: string): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('study_schedules')
      .select(`
        *,
        teacher:teachers(id, full_name, email),
        class:classes(id, class_name),
        study_schedule_items(*)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching student schedules:', error);
    return { data: null, error };
  }
};

export const getStudentPastStudySchedules = async (studentId: string, limit = 20): Promise<{ data: any; error: any }> => {
  try {
    const todayIso = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('study_schedules')
      .select(`
        *,
        teacher:teachers(id, full_name),
        class:classes(id, class_name),
        study_schedule_items(*)
      `)
      .eq('student_id', studentId)
      .lt('week_end_date', todayIso)
      .order('week_start_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching past student schedules:', error);
    return { data: null, error };
  }
};

/**
 * Öğretmen için kendi oluşturduğu programları getir
 */
export const getTeacherStudySchedules = async (teacherId: string, classId?: string): Promise<{ data: any; error: any }> => {
  try {
    let query = supabase
      .from('study_schedules')
      .select(`
        *,
        student:students(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name,
            email
          )
        ),
        class:classes(
          id,
          class_name
        ),
        study_schedule_items(*)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching teacher schedules:', error);
    return { data: null, error };
  }
};

/**
 * Öğretmen için kendi oluşturduğu programları getir
 * Alias for getTeacherStudySchedules
 */
export const getTeacherSchedules = getTeacherStudySchedules;

/**
 * Belirli bir çalışma programını getir (detaylı)
 */
export const getStudyScheduleById = async (scheduleId: string): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('study_schedules')
      .select(`
        *,
        teacher:teachers(
          id,
          full_name,
          email
        ),
        student:students!study_schedules_student_id_fkey(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name,
            email
          )
        ),
        class:classes(
          id,
          class_name
        ),
        study_schedule_items(*)
      `)
      .eq('id', scheduleId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching schedule by id:', error);
    return { data: null, error };
  }
};

/**
 * Çalışma programını güncelle
 */
export const updateStudySchedule = async (
  scheduleId: string,
  updates: Partial<StudySchedule>
): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('study_schedules')
      .update({
        title: updates.title,
        description: updates.description,
        week_start_date: updates.week_start_date,
        week_end_date: updates.week_end_date,
        status: updates.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating study schedule:', error);
    return { data: null, error };
  }
};

/**
 * Çalışma programını sil
 */
export const deleteStudySchedule = async (scheduleId: string): Promise<{ data: any; error: any }> => {
  try {
    // Önce items'ları sil
    const { error: itemsError } = await supabase
      .from('study_schedule_items')
      .delete()
      .eq('schedule_id', scheduleId);

    if (itemsError) throw itemsError;

    // Sonra schedule'ı sil
    const { error } = await supabase
      .from('study_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;

    return { data: { success: true }, error: null };
  } catch (error: any) {
    console.error('Error deleting study schedule:', error);
    return { data: null, error };
  }
};

/**
 * Schedule item'ı tamamlandı olarak işaretle
 */
export const markScheduleItemComplete = async (
  itemId: string,
  completed: boolean
): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('study_schedule_items')
      .update({
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error marking item complete:', error);
    return { data: null, error };
  }
};

/**
 * Bu haftaki aktif programı getir
 */
export const getCurrentWeekSchedule = async (studentId: string): Promise<{ data: any; error: any }> => {
  try {
    const today = new Date();
    
    // 2 hafta geriye, 4 hafta ileriye bak (daha geniş aralık)
    const startRange = new Date(today);
    startRange.setDate(today.getDate() - 14);
    
    const endRange = new Date(today);
    endRange.setDate(today.getDate() + 28);

    console.log('🔍 Fetching schedules between:', {
      start: startRange.toISOString().split('T')[0],
      end: endRange.toISOString().split('T')[0],
      studentId
    });

    const { data, error } = await supabase
      .from('study_schedules')
      .select(`
        *,
        teacher:teachers(id, full_name),
        class:classes(id, class_name),
        study_schedule_items(*)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .gte('week_end_date', startRange.toISOString().split('T')[0])
      .lte('week_start_date', endRange.toISOString().split('T')[0])
      .order('week_start_date', { ascending: false })
      .limit(1);

    console.log('📊 Query result:', { data, error });

    if (error && error.code !== 'PGRST116') throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error: any) {
    console.error('Error fetching current week schedule:', error);
    return { data: null, error };
  }
};

/**
 * Öğrenci tipi kontrolü - Sınıf öğrencisi mi, bireysel mi?
 */
export const checkStudentType = async (studentId: string): Promise<{
  isClassStudent: boolean;
  hasSubscription: boolean;
  classId?: string;
}> => {
  try {
    // Sınıf öğrencisi mi kontrol et
    const { data: classStudent } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    // Aboneliği var mı kontrol et
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    let hasSubscription = false;
    if (student) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, status')
        .eq('user_id', student.user_id)
        .eq('status', 'active')
        .maybeSingle();

      hasSubscription = !!subscription;
    }

    return {
      isClassStudent: !!classStudent,
      hasSubscription,
      classId: classStudent?.class_id
    };
  } catch (error) {
    console.error('Error checking student type:', error);
    return {
      isClassStudent: false,
      hasSubscription: false
    };
  }
};

export const getScheduleFeedbackForItems = async (
  itemIds: string[],
  studentId: string
): Promise<{ data: StudyScheduleFeedback[] | null; error: any }> => {
  if (!itemIds || itemIds.length === 0) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('study_schedule_feedback')
      .select('*')
      .in('schedule_item_id', itemIds)
      .eq('student_id', studentId);

    if (error) throw error;

    return { data: (data as StudyScheduleFeedback[]) || [], error: null };
  } catch (error: any) {
    console.error('Error fetching feedback for items:', error);
    return { data: null, error };
  }
};

export const submitScheduleItemFeedback = async (
  feedback: Omit<StudyScheduleFeedback, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: StudyScheduleFeedback | null; error: any }> => {
  try {
    const payload = {
      ...feedback,
      resources_used: feedback.resources_used || null,
      reflection: feedback.reflection || null,
      time_spent_minutes:
        typeof feedback.time_spent_minutes === 'number' ? feedback.time_spent_minutes : null,
      difficulty_level:
        typeof feedback.difficulty_level === 'number' ? feedback.difficulty_level : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('study_schedule_feedback')
      .upsert(payload, {
        onConflict: 'schedule_item_id,student_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;

    return { data: data as StudyScheduleFeedback, error: null };
  } catch (error: any) {
    console.error('Error submitting schedule item feedback:', error);
    return { data: null, error };
  }
};

export const getScheduleFeedbackForSchedule = async (
  scheduleId: string
): Promise<{ data: any[] | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('study_schedule_feedback')
      .select(`
        *,
        schedule_item:study_schedule_items(
          id,
          day_of_week,
          subject,
          goal,
          start_time,
          end_time
        ),
        student:students(
          id,
          profile:profiles!students_profile_id_fkey(
            full_name
          )
        )
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching schedule feedback:', error);
    return { data: null, error };
  }
};


