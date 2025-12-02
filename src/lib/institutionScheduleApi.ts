import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface ScheduleEntry {
  id?: string;
  institution_id: string;
  class_name: string;
  subject: string;
  teacher_id?: string | null;
  classroom?: string | null;
  day_of_week: number; // 1=Pazartesi, 7=Pazar
  start_time: string; // HH:MM format
  end_time: string;
  notes?: string | null;
  color?: string;
  is_active?: boolean;
  recurrence_type?: 'weekly' | 'biweekly' | 'custom';
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

export interface TeacherPersonalSchedule {
  id?: string;
  teacher_id: string;
  institution_id: string;
  title: string;
  description?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string | null;
  category?: 'personal' | 'meeting' | 'preparation' | 'tutoring' | 'other';
  color?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InstitutionClass {
  id?: string;
  institution_id: string;
  class_name: string;
  class_description?: string | null;
  grade_level?: string | null;
  branch?: string | null;
  advisor_teacher_id?: string | null;
  student_count?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FullScheduleEntry {
  id: string;
  type: 'class_schedule' | 'teacher_personal';
  title: string;
  class_name?: string | null;
  subject: string;
  teacher_name?: string | null;
  teacher_id?: string | null;
  classroom?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
  notes?: string | null;
}

// ============================================
// SCHEDULE ENTRIES (Kurum Genel Ders Programı)
// ============================================

export const getInstitutionScheduleEntries = async (institutionId: string): Promise<ScheduleEntry[]> => {
  const { data, error } = await supabase
    .from('institution_schedule_entries')
    .select(`
      *,
      teacher:profiles!institution_schedule_entries_teacher_id_fkey(id, full_name)
    `)
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching schedule entries:', error);
    throw error;
  }

  return data || [];
};

export const createScheduleEntry = async (entry: Omit<ScheduleEntry, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduleEntry> => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('institution_schedule_entries')
    .insert({
      ...entry,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule entry:', error);
    throw error;
  }

  return data;
};

export const updateScheduleEntry = async (id: string, updates: Partial<ScheduleEntry>): Promise<ScheduleEntry> => {
  const { data, error } = await supabase
    .from('institution_schedule_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating schedule entry:', error);
    throw error;
  }

  return data;
};

export const deleteScheduleEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('institution_schedule_entries')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting schedule entry:', error);
    throw error;
  }
};

export const hardDeleteScheduleEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('institution_schedule_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting schedule entry:', error);
    throw error;
  }
};

// ============================================
// TEACHER PERSONAL SCHEDULES
// ============================================

export const getTeacherPersonalSchedules = async (teacherId: string, institutionId: string): Promise<TeacherPersonalSchedule[]> => {
  const { data, error } = await supabase
    .from('teacher_personal_schedules')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching teacher schedules:', error);
    throw error;
  }

  return data || [];
};

export const createTeacherPersonalSchedule = async (schedule: Omit<TeacherPersonalSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<TeacherPersonalSchedule> => {
  const { data, error } = await supabase
    .from('teacher_personal_schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) {
    console.error('Error creating teacher schedule:', error);
    throw error;
  }

  return data;
};

export const updateTeacherPersonalSchedule = async (id: string, updates: Partial<TeacherPersonalSchedule>): Promise<TeacherPersonalSchedule> => {
  const { data, error } = await supabase
    .from('teacher_personal_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating teacher schedule:', error);
    throw error;
  }

  return data;
};

export const deleteTeacherPersonalSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('teacher_personal_schedules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting teacher schedule:', error);
    throw error;
  }
};

// ============================================
// INSTITUTION CLASSES
// ============================================

export const getInstitutionClasses = async (institutionId: string): Promise<InstitutionClass[]> => {
  const { data, error } = await supabase
    .from('institution_classes')
    .select(`
      *,
      advisor:profiles!institution_classes_advisor_teacher_id_fkey(id, full_name)
    `)
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('class_name', { ascending: true });

  if (error) {
    console.error('Error fetching institution classes:', error);
    throw error;
  }

  return data || [];
};

export const createInstitutionClass = async (classData: Omit<InstitutionClass, 'id' | 'created_at' | 'updated_at'>): Promise<InstitutionClass> => {
  const { data, error } = await supabase
    .from('institution_classes')
    .insert(classData)
    .select()
    .single();

  if (error) {
    console.error('Error creating institution class:', error);
    throw error;
  }

  return data;
};

export const updateInstitutionClass = async (id: string, updates: Partial<InstitutionClass>): Promise<InstitutionClass> => {
  const { data, error } = await supabase
    .from('institution_classes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating institution class:', error);
    throw error;
  }

  return data;
};

export const deleteInstitutionClass = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('institution_classes')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting institution class:', error);
    throw error;
  }
};

// ============================================
// FULL SCHEDULE (Combines everything)
// ============================================

export const getInstitutionFullSchedule = async (institutionId: string): Promise<FullScheduleEntry[]> => {
  const { data, error } = await supabase
    .rpc('get_institution_full_schedule', { institution_uuid: institutionId });

  if (error) {
    console.error('Error fetching full schedule:', error);
    throw error;
  }

  return data || [];
};

export const getTeacherWeeklySchedule = async (teacherId: string, institutionId: string): Promise<FullScheduleEntry[]> => {
  const { data, error } = await supabase
    .rpc('get_teacher_weekly_schedule', {
      teacher_uuid: teacherId,
      institution_uuid: institutionId
    });

  if (error) {
    console.error('Error fetching teacher schedule:', error);
    throw error;
  }

  return data || [];
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getDayName = (dayOfWeek: number): string => {
  const days = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  return days[dayOfWeek] || '';
};

export const formatTime = (time: string): string => {
  // HH:MM formatını HH:MM'e dönüştür
  return time.substring(0, 5);
};

export const getScheduleByDay = (entries: FullScheduleEntry[]): Record<number, FullScheduleEntry[]> => {
  const byDay: Record<number, FullScheduleEntry[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
  };

  entries.forEach(entry => {
    byDay[entry.day_of_week].push(entry);
  });

  return byDay;
};

export const checkScheduleConflict = (
  entries: Array<ScheduleEntry | TeacherPersonalSchedule | FullScheduleEntry>,
  newEntry: { day_of_week: number; start_time: string; end_time: string; teacher_id?: string | null },
  excludeId?: string
): boolean => {
  return entries.some(entry => {
    if (excludeId && entry.id === excludeId) return false;
    if (entry.day_of_week !== newEntry.day_of_week) return false;

    // Farklı öğretmenler aynı saatte farklı sınıflara ders verebilir
    // Sadece aynı öğretmenin aynı saatte çakışması engellenmelidir
    const entryTeacherId = 'teacher_id' in entry ? entry.teacher_id : undefined;
    const newTeacherId = newEntry.teacher_id;

    // Eğer öğretmenler farklıysa çakışma yok
    if (entryTeacherId && newTeacherId && entryTeacherId !== newTeacherId) {
      return false;
    }

    const existingStart = entry.start_time;
    const existingEnd = entry.end_time;
    const newStart = newEntry.start_time;
    const newEnd = newEntry.end_time;

    // Zaman çakışması kontrolü (sadece aynı öğretmen için)
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
};

export const getTimeSlots = (): string[] => {
  const slots = [];
  for (let hour = 7; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

export const getSubjectColors = (): Record<string, string> => {
  return {
    'Matematik': '#3B82F6',
    'Fizik': '#8B5CF6',
    'Kimya': '#10B981',
    'Biyoloji': '#059669',
    'Türkçe': '#EF4444',
    'Edebiyat': '#DC2626',
    'Tarih': '#F59E0B',
    'Coğrafya': '#F97316',
    'Felsefe': '#6366F1',
    'İngilizce': '#06B6D4',
    'Geometri': '#8B5CF6',
    'Default': '#6B7280'
  };
};
