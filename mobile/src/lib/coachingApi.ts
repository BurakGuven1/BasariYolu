/**
 * Coaching API for Mobile
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
  coach?: CoachProfile;
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
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  cancellation_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  coach?: CoachProfile;
  subscription?: StudentCoachingSubscription;
}

export interface CoachProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  is_coach: boolean;
  coach_bio: string | null;
  coach_specializations: string[] | null;
  coach_hourly_rate: number | null;
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
    .select('id, full_name, avatar_url, is_coach, coach_bio, coach_specializations, coach_hourly_rate')
    .eq('is_coach', true)
    .eq('role', 'teacher')
    .order('full_name');

  if (error) throw error;
  return data || [];
}

export async function getCoachById(coachId: string): Promise<CoachProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, is_coach, coach_bio, coach_specializations, coach_hourly_rate')
    .eq('id', coachId)
    .eq('is_coach', true)
    .single();

  if (error) throw error;
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

// =====================================================
// Appointments
// =====================================================

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
      subscription:student_coaching_subscriptions(*)
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

  if (error) throw error;
  return data || [];
}

export async function getAppointmentById(appointmentId: string): Promise<CoachingAppointment | null> {
  const { data, error } = await supabase
    .from('coaching_appointments')
    .select(`
      *,
      coach:profiles!coaching_appointments_coach_id_fkey(
        id, full_name, avatar_url
      ),
      subscription:student_coaching_subscriptions(*)
    `)
    .eq('id', appointmentId)
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
  const { data, error } = await supabase
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

// =====================================================
// Coach Availability
// =====================================================

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

// Get available time slots for a coach within a date range
export async function getAvailableTimeSlots(
  coachId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; time: string; dayOfWeek: number; available: boolean }[]> {
  // Get coach availability schedule
  const availability = await getCoachAvailability(coachId);

  // Get existing appointments in the date range
  const { data: appointments, error } = await supabase
    .from('coaching_appointments')
    .select('appointment_date, duration_minutes')
    .eq('coach_id', coachId)
    .in('status', ['pending', 'approved'])
    .gte('appointment_date', startDate.toISOString())
    .lte('appointment_date', endDate.toISOString());

  if (error) throw error;

  const slots: { date: string; time: string; dayOfWeek: number; available: boolean }[] = [];
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
      const endHour = parseInt(av.end_time.split(':')[0]);

      // Create hourly slots
      for (let hour = startHour; hour < endHour; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const slotDateTime = new Date(`${dateStr}T${timeStr}:00`);

        // Check if this slot conflicts with existing appointment
        const hasConflict = (appointments || []).some((app) => {
          const appDate = new Date(app.appointment_date);
          const appEnd = new Date(appDate.getTime() + app.duration_minutes * 60000);
          return slotDateTime >= appDate && slotDateTime < appEnd;
        });

        // Don't show past slots
        const isPast = slotDateTime < new Date();

        slots.push({
          date: dateStr,
          time: timeStr,
          dayOfWeek,
          available: !hasConflict && !isPast,
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
