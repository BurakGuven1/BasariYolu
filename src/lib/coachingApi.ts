/**
 * Coaching API
 * Handles all coaching-related operations including packages, subscriptions, and appointments
 */

import { supabase } from './supabase';

// =====================================================
// Types
// =====================================================

export interface CoachingPackage {
  id: string;
  name: string;
  description: string | null;
  session_count: number;
  duration_days: number;
  price: number;
  is_active: boolean;
  is_popular?: boolean;
  features?: string[];
  created_at: string;
  updated_at: string;
}

export interface StudentCoachingSubscription {
  id: string;
  student_id: string;
  coach_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  remaining_sessions: number;
  total_sessions: number;
  status: 'active' | 'expired' | 'cancelled' | 'completed';
  purchase_price: number;
  created_at: string;
  updated_at: string;
  // Joined data
  package?: CoachingPackage;
  coach?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    coach_bio: string | null;
    coach_specializations: string[] | null;
  };
  student?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CoachingAppointment {
  id: string;
  subscription_id: string;
  coach_id: string;
  student_id: string;
  appointment_date: string;
  duration_minutes: number;
  google_meet_link: string | null;
  title: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  cancellation_reason: string | null;
  coach_notes: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  coach?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  subscription?: StudentCoachingSubscription;
}

export interface CoachAvailability {
  id: string;
  coach_id: string;
  day_of_week: number; // 0-6, 0=Sunday
  start_time: string; // HH:MM format
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_coach: boolean;
  coach_bio: string | null;
  coach_specializations: string[] | null;
  coach_hourly_rate: number | null;
  coach_availability_timezone: string | null;
}

export interface CoachStats {
  coach_id: string;
  coach_name: string;
  avatar_url: string | null;
  coach_bio: string | null;
  coach_specializations: string[] | null;
  coach_hourly_rate: number | null;
  total_students: number;
  completed_sessions: number;
  upcoming_sessions: number;
  avg_rating: number | null;
}

// =====================================================
// Coaching Packages
// =====================================================

export async function getActivePackages(): Promise<CoachingPackage[]> {
  const { data, error } = await supabase
    .from('coaching_packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPackageById(packageId: string): Promise<CoachingPackage | null> {
  const { data, error } = await supabase
    .from('coaching_packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// Coach Management
// =====================================================

export async function getAllCoaches(): Promise<CoachProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_coach, coach_bio, coach_specializations, coach_hourly_rate, coach_availability_timezone')
    .eq('is_coach', true)
    .eq('role', 'teacher')
    .order('full_name');

  if (error) throw error;
  return data || [];
}

export async function getCoachById(coachId: string): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_coach, coach_bio, coach_specializations, coach_hourly_rate, coach_availability_timezone')
    .eq('id', coachId)
    .eq('is_coach', true)
    .single();

  if (error) throw error;
  return data;
}

export async function updateCoachProfile(
  coachId: string,
  updates: {
    coach_bio?: string;
    coach_specializations?: string[];
    coach_hourly_rate?: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', coachId);

  if (error) throw error;
}

export async function enableCoaching(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_coach: true })
    .eq('id', userId);

  if (error) throw error;
}

export async function getCoachStats(coachId: string): Promise<CoachStats | null> {
  const { data, error } = await supabase
    .from('coach_stats')
    .select('*')
    .eq('coach_id', coachId)
    .single();

  if (error) {
    console.error('Error fetching coach stats:', error);
    return null;
  }
  return data;
}

// =====================================================
// Subscriptions
// =====================================================

export async function createSubscription(
  studentId: string,
  coachId: string,
  packageId: string
): Promise<StudentCoachingSubscription> {
  // First get the package details
  const pkg = await getPackageById(packageId);
  if (!pkg) throw new Error('Package not found');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + pkg.duration_days);

  const { data, error } = await supabase
    .from('student_coaching_subscriptions')
    .insert({
      student_id: studentId,
      coach_id: coachId,
      package_id: packageId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      remaining_sessions: pkg.session_count,
      total_sessions: pkg.session_count,
      purchase_price: pkg.price,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStudentSubscriptions(studentId: string): Promise<StudentCoachingSubscription[]> {
  const { data, error } = await supabase
    .from('student_coaching_subscriptions')
    .select(`
      *,
      package:coaching_packages(*),
      coach:profiles!student_coaching_subscriptions_coach_id_fkey(
        id, full_name, avatar_url, coach_bio, coach_specializations
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCoachSubscriptions(coachId: string): Promise<StudentCoachingSubscription[]> {
  const { data, error } = await supabase
    .from('student_coaching_subscriptions')
    .select(`
      *,
      package:coaching_packages(*),
      student:profiles!student_coaching_subscriptions_student_id_fkey(
        id, full_name, avatar_url
      )
    `)
    .eq('coach_id', coachId)
    .in('status', ['active', 'expired'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getActiveSubscription(
  studentId: string,
  coachId: string
): Promise<StudentCoachingSubscription | null> {
  const { data, error } = await supabase
    .from('student_coaching_subscriptions')
    .select('*')
    .eq('student_id', studentId)
    .eq('coach_id', coachId)
    .eq('status', 'active')
    .gt('remaining_sessions', 0)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return data;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from('student_coaching_subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId);

  if (error) throw error;
}

// =====================================================
// Appointments
// =====================================================

// Coach creates appointment directly (scheduled status)
export async function createAppointment(
  subscriptionId: string,
  coachId: string,
  studentId: string,
  appointmentData: {
    appointment_date: string;
    duration_minutes?: number;
    google_meet_link?: string;
    title?: string;
    description?: string;
  }
): Promise<CoachingAppointment> {
  const { data, error } = await supabase
    .from('coaching_appointments')
    .insert({
      subscription_id: subscriptionId,
      coach_id: coachId,
      student_id: studentId,
      appointment_date: appointmentData.appointment_date,
      duration_minutes: appointmentData.duration_minutes || 60,
      google_meet_link: appointmentData.google_meet_link,
      title: appointmentData.title,
      description: appointmentData.description,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Student requests appointment (pending status)
export async function requestAppointment(
  subscriptionId: string,
  coachId: string,
  studentId: string,
  appointmentData: {
    appointment_date: string;
    duration_minutes?: number;
    title?: string;
    description?: string;
  }
): Promise<CoachingAppointment> {
  const { data, error} = await supabase
    .from('coaching_appointments')
    .insert({
      subscription_id: subscriptionId,
      coach_id: coachId,
      student_id: studentId,
      appointment_date: appointmentData.appointment_date,
      duration_minutes: appointmentData.duration_minutes || 60,
      title: appointmentData.title,
      description: appointmentData.description,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Coach approves appointment
export async function approveAppointment(
  appointmentId: string,
  google_meet_link?: string,
  coach_notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('coaching_appointments')
    .update({
      status: 'approved',
      google_meet_link: google_meet_link,
      coach_notes: coach_notes,
      approved_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('status', 'pending');

  if (error) throw error;
}

// Coach rejects appointment
export async function rejectAppointment(
  appointmentId: string,
  coach_notes?: string
): Promise<void> {
  const { error } = await supabase
    .from('coaching_appointments')
    .update({
      status: 'rejected',
      coach_notes: coach_notes,
      rejected_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('status', 'pending');

  if (error) throw error;
}

export async function getCoachAppointments(
  coachId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    status?: string[];
  }
): Promise<CoachingAppointment[]> {
  let query = supabase
    .from('coaching_appointments')
    .select(`
      *,
      student:profiles!coaching_appointments_student_id_fkey(
        id, full_name, avatar_url
      ),
      subscription:student_coaching_subscriptions!coaching_appointments_subscription_id_fkey(
        id,
        remaining_sessions,
        package:coaching_packages(name)
      )
    `)
    .eq('coach_id', coachId);

  if (options?.startDate) {
    query = query.gte('appointment_date', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('appointment_date', options.endDate);
  }
  if (options?.status) {
    query = query.in('status', options.status);
  }

  query = query.order('appointment_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching coach appointments:', error);
    throw error;
  }
  return data || [];
}

export async function getStudentAppointments(
  studentId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    status?: string[];
  }
): Promise<CoachingAppointment[]> {
  let query = supabase
    .from('coaching_appointments')
    .select(`
      *,
      coach:profiles!coaching_appointments_coach_id_fkey(
        id, full_name, avatar_url
      ),
      subscription:student_coaching_subscriptions!coaching_appointments_subscription_id_fkey(
        id,
        remaining_sessions,
        package:coaching_packages(name)
      )
    `)
    .eq('student_id', studentId);

  if (options?.startDate) {
    query = query.gte('appointment_date', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('appointment_date', options.endDate);
  }
  if (options?.status) {
    query = query.in('status', options.status);
  }

  query = query.order('appointment_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching student appointments:', error);
    throw error;
  }
  return data || [];
}

export async function updateAppointment(
  appointmentId: string,
  updates: {
    appointment_date?: string;
    duration_minutes?: number;
    google_meet_link?: string;
    title?: string;
    description?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'no_show';
    cancellation_reason?: string;
  }
): Promise<void> {
  const updateData: any = { ...updates };

  // Set completed_at when status changes to completed
  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('coaching_appointments')
    .update(updateData)
    .eq('id', appointmentId);

  if (error) throw error;
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const { error } = await supabase
    .from('coaching_appointments')
    .delete()
    .eq('id', appointmentId);

  if (error) throw error;
}

// =====================================================
// Coach Availability
// =====================================================

export async function getCoachAvailability(coachId: string): Promise<CoachAvailability[]> {
  const { data, error } = await supabase
    .from('coach_availability')
    .select('*')
    .eq('coach_id', coachId)
    .order('day_of_week')
    .order('start_time');

  if (error) throw error;
  return data || [];
}

export async function setCoachAvailability(
  coachId: string,
  availability: Omit<CoachAvailability, 'id' | 'coach_id' | 'created_at' | 'updated_at'>[]
): Promise<void> {
  // Delete existing availability
  await supabase
    .from('coach_availability')
    .delete()
    .eq('coach_id', coachId);

  // Insert new availability
  const { error } = await supabase
    .from('coach_availability')
    .insert(
      availability.map((slot) => ({
        coach_id: coachId,
        ...slot,
      }))
    );

  if (error) throw error;
}

export async function addAvailabilitySlot(
  coachId: string,
  slot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from('coach_availability')
    .insert({
      coach_id: coachId,
      ...slot,
    });

  if (error) throw error;
}

export async function removeAvailabilitySlot(slotId: string): Promise<void> {
  const { error } = await supabase
    .from('coach_availability')
    .delete()
    .eq('id', slotId);

  if (error) throw error;
}

// Alias functions for better naming
export async function saveCoachAvailability(
  coachId: string,
  slot: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }
): Promise<void> {
  return addAvailabilitySlot(coachId, slot);
}

export async function deleteCoachAvailability(slotId: string): Promise<void> {
  return removeAvailabilitySlot(slotId);
}

// Get available time slots for a coach within a date range
export async function getAvailableTimeSlots(
  coachId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; time: string; available: boolean }[]> {
  // Get coach availability schedule
  const availability = await getCoachAvailability(coachId);

  // Get existing appointments in the date range
  const appointments = await getCoachAppointments(coachId, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: ['pending', 'approved'],
  });

  const slots: { date: string; time: string; available: boolean }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];

    // Find availability for this day of week
    const dayAvailability = availability.filter(
      (av) => av.day_of_week === dayOfWeek && av.is_available
    );

    dayAvailability.forEach((av) => {
      const startHour = parseInt(av.start_time.split(':')[0]);
      const startMinute = parseInt(av.start_time.split(':')[1]);
      const endHour = parseInt(av.end_time.split(':')[0]);
      const endMinute = parseInt(av.end_time.split(':')[1]);

      // Create hourly slots
      for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const slotDateTime = new Date(`${dateStr}T${timeStr}:00`);

        // Check if this slot conflicts with existing appointment
        const hasConflict = appointments.some((app) => {
          const appDate = new Date(app.appointment_date);
          const appEnd = new Date(appDate.getTime() + app.duration_minutes * 60000);
          return slotDateTime >= appDate && slotDateTime < appEnd;
        });

        slots.push({
          date: dateStr,
          time: timeStr,
          available: !hasConflict,
        });
      }
    });

    current.setDate(current.getDate() + 1);
  }

  return slots;
}

// =====================================================
// Helper Functions
// =====================================================

export const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function getDayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] || '';
}

export function formatTime(time: string): string {
  return time.substring(0, 5); // HH:MM from HH:MM:SS
}

export function formatAppointmentDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isSubscriptionActive(subscription: StudentCoachingSubscription): boolean {
  return (
    subscription.status === 'active' &&
    subscription.remaining_sessions > 0 &&
    new Date(subscription.end_date) > new Date()
  );
}

export function getSubscriptionProgress(subscription: StudentCoachingSubscription): number {
  return Math.round(
    ((subscription.total_sessions - subscription.remaining_sessions) / subscription.total_sessions) * 100
  );
}
