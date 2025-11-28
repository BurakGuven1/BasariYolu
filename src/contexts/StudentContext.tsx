import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthContext';

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  school?: string;
  grade?: string;
  target_exam?: 'TYT' | 'AYT' | 'LGS';
  target_university?: string;
  target_department?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentSubscription {
  id: string;
  user_id: string;
  plan: 'free' | 'basic' | 'premium' | 'ultimate';
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
  features: string[];
}

export interface StudentPoints {
  total_points: number;
  level: number;
  streak_days: number;
  achievements: string[];
}

interface StudentContextType {
  profile: StudentProfile | null;
  subscription: StudentSubscription | null;
  points: StudentPoints | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<StudentProfile>) => Promise<void>;
  addPoints: (points: number, reason: string) => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subscription, setSubscription] = useState<StudentSubscription | null>(null);
  const [points, setPoints] = useState<StudentPoints | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load student data
  const loadStudentData = useCallback(async () => {
    if (!user || user.userType !== 'student') {
      setProfile(null);
      setSubscription(null);
      setPoints(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load profile from profiles table (NOT student_profiles!)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile load error:', profileError);
      }

      // Map profiles table to StudentProfile format
      const mappedProfile: StudentProfile | null = profileData ? {
        id: profileData.id,
        user_id: profileData.id,
        full_name: profileData.full_name || '',
        school: profileData.school,
        grade: profileData.grade,
        target_exam: profileData.target_exam,
        target_university: profileData.target_university,
        target_department: profileData.target_department,
        phone: profileData.phone,
        avatar_url: profileData.avatar_url,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at || profileData.created_at,
      } : null;

      setProfile(mappedProfile);

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.warn('Subscription load error:', subError);
      }

      setSubscription(subData || {
        id: 'free',
        user_id: user.id,
        plan: 'free',
        status: 'active',
        start_date: new Date().toISOString(),
        features: ['basic_exams', 'limited_ai']
      });

      // Load points - use student_points table
      const { data: pointsData, error: pointsError } = await supabase
        .from('student_points')
        .select('*')
        .eq('student_id', user.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        console.warn('Points load error:', pointsError);
      }

      setPoints(pointsData || {
        total_points: 0,
        level: 1,
        streak_days: 0,
        achievements: []
      });

    } catch (err: any) {
      console.error('Error loading student data:', err);
      setError(err.message || 'Öğrenci verileri yüklenemedi');

      // Don't throw error - just set error state
      // This prevents logout on database errors
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data when user changes
  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await loadStudentData();
  }, [loadStudentData]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<StudentProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Map updated data to StudentProfile format
      const mappedProfile: StudentProfile = {
        id: data.id,
        user_id: data.id,
        full_name: data.full_name || '',
        school: data.school,
        grade: data.grade,
        target_exam: data.target_exam,
        target_university: data.target_university,
        target_department: data.target_department,
        phone: data.phone,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at || data.created_at,
      };

      setProfile(mappedProfile);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }, [user]);

  // Add points
  const addPoints = useCallback(async (pointsToAdd: number, reason: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('add_student_points', {
          p_student_id: user.id,
          p_points: pointsToAdd,
          p_reason: reason
        });

      if (error) throw error;

      // Refresh points
      await refreshProfile();
    } catch (err: any) {
      console.error('Error adding points:', err);
      throw err;
    }
  }, [user, refreshProfile]);

  const value: StudentContextType = {
    profile,
    subscription,
    points,
    loading,
    error,
    refreshProfile,
    updateProfile,
    addPoints,
  };

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within StudentProvider');
  }
  return context;
}
