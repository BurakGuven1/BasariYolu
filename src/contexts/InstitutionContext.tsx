import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import { supabase } from '../lib/supabase';

export interface InstitutionData {
  id: string;
  name: string;
  type: 'school' | 'course' | 'university';
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  settings?: any;
  created_at: string;
}

export interface InstitutionStudent {
  user_id: string;
  full_name: string;
  email: string;
  grade?: string;
  status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  profile?: any;
}

export interface InstitutionTeacher {
  id: string;
  full_name: string;
  email: string;
  subject?: string;
  status: 'active' | 'inactive';
  classes: string[];
}

interface InstitutionContextType {
  institution: InstitutionData | null;
  students: InstitutionStudent[];
  teachers: InstitutionTeacher[];
  loading: boolean;
  error: string | null;
  refreshInstitution: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  refreshTeachers: () => Promise<void>;
  approveStudent: (userId: string) => Promise<void>;
  rejectStudent: (userId: string) => Promise<void>;
  addTeacher: (teacherData: Partial<InstitutionTeacher>) => Promise<void>;
  removeTeacher: (teacherId: string) => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [students, setStudents] = useState<InstitutionStudent[]>([]);
  const [teachers, setTeachers] = useState<InstitutionTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const institutionId = user?.userType === 'institution' ? user.institutionSession?.institution?.id : null;

  // Load institution data
  const loadInstitution = useCallback(async () => {
    if (!institutionId) {
      setInstitution(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', institutionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setInstitution(data || null);
    } catch (err: any) {
      console.error('Error loading institution:', err);
      setError(err.message);
      // Don't throw - just log and set error state
    }
  }, [institutionId]);

  // Load students
  const loadStudents = useCallback(async () => {
    if (!institutionId) {
      setStudents([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('institution_student_requests')
        .select(`
          user_id,
          full_name,
          status,
          created_at,
          profiles:user_id (
            email,
            user_metadata
          )
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.warn('Students load error:', error);
      }

      const formattedStudents: InstitutionStudent[] = (data || []).map((s: any) => ({
        user_id: s.user_id,
        full_name: s.full_name,
        email: s.profiles?.email || '',
        status: s.status,
        joined_at: s.created_at,
        profile: s.profiles?.user_metadata,
      }));

      setStudents(formattedStudents);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err.message);
      // Don't throw - just log and set error state
    }
  }, [institutionId]);

  // Load teachers
  const loadTeachers = useCallback(async () => {
    if (!institutionId) {
      setTeachers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('institution_teachers')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.warn('Teachers load error:', error);
      }

      setTeachers(data || []);
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      setError(err.message);
      // Don't throw - just log and set error state
    }
  }, [institutionId]);

  // Load all data when institutionId changes
  useEffect(() => {
    if (institutionId) {
      setLoading(true);
      Promise.all([
        loadInstitution(),
        loadStudents(),
        loadTeachers(),
      ]).finally(() => setLoading(false));
    } else {
      setInstitution(null);
      setStudents([]);
      setTeachers([]);
    }
  }, [institutionId, loadInstitution, loadStudents, loadTeachers]);

  // Refresh functions
  const refreshInstitution = useCallback(async () => {
    await loadInstitution();
  }, [loadInstitution]);

  const refreshStudents = useCallback(async () => {
    await loadStudents();
  }, [loadStudents]);

  const refreshTeachers = useCallback(async () => {
    await loadTeachers();
  }, [loadTeachers]);

  // Approve student
  const approveStudent = useCallback(async (userId: string) => {
    if (!institutionId) return;

    try {
      const { error } = await supabase
        .from('institution_student_requests')
        .update({ status: 'approved' })
        .eq('institution_id', institutionId)
        .eq('user_id', userId);

      if (error) throw error;

      await refreshStudents();
    } catch (err: any) {
      console.error('Error approving student:', err);
      throw err;
    }
  }, [institutionId, refreshStudents]);

  // Reject student
  const rejectStudent = useCallback(async (userId: string) => {
    if (!institutionId) return;

    try {
      const { error } = await supabase
        .from('institution_student_requests')
        .update({ status: 'rejected' })
        .eq('institution_id', institutionId)
        .eq('user_id', userId);

      if (error) throw error;

      await refreshStudents();
    } catch (err: any) {
      console.error('Error rejecting student:', err);
      throw err;
    }
  }, [institutionId, refreshStudents]);

  // Add teacher
  const addTeacher = useCallback(async (teacherData: Partial<InstitutionTeacher>) => {
    if (!institutionId) return;

    try {
      const { error } = await supabase
        .from('institution_teachers')
        .insert([{
          institution_id: institutionId,
          ...teacherData,
        }]);

      if (error) throw error;

      await refreshTeachers();
    } catch (err: any) {
      console.error('Error adding teacher:', err);
      throw err;
    }
  }, [institutionId, refreshTeachers]);

  // Remove teacher
  const removeTeacher = useCallback(async (teacherId: string) => {
    try {
      const { error } = await supabase
        .from('institution_teachers')
        .delete()
        .eq('id', teacherId);

      if (error) throw error;

      await refreshTeachers();
    } catch (err: any) {
      console.error('Error removing teacher:', err);
      throw err;
    }
  }, [refreshTeachers]);

  const value: InstitutionContextType = {
    institution,
    students,
    teachers,
    loading,
    error,
    refreshInstitution,
    refreshStudents,
    refreshTeachers,
    approveStudent,
    rejectStudent,
    addTeacher,
    removeTeacher,
  };

  return <InstitutionContext.Provider value={value}>{children}</InstitutionContext.Provider>;
}

export function useInstitution() {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useInstitution must be used within InstitutionProvider');
  }
  return context;
}
