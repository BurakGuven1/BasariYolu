import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

export interface StudentPoints {
  id: string;
  student_id: string;
  total_points: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  student_id: string;
  points: number;
  reason: string;
  challenge_id?: string;
  created_at: string;
}

/**
 * Öğrencinin toplam puanını getir
 */
const fetchStudentPointsFallback = async (studentId: string) => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/student_points?select=*&student_id=eq.${studentId}`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Fallback points request failed:', await response.text());
      return null;
    }

    const json = await response.json();
    if (Array.isArray(json)) {
      return json[0] || null;
    }

    return json || null;
  } catch (error) {
    console.error('Fallback points request error:', error);
    return null;
  }
};

export const getStudentPoints = async (studentId: string): Promise<StudentPoints | null> => {
  const { data, error } = await supabase
    .from('student_points')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    if (error.message?.includes('No API key found')) {
      const fallbackData = await fetchStudentPointsFallback(studentId);
      if (fallbackData) {
        return fallbackData as StudentPoints;
      }
    } else if (error.code !== 'PGRST116') {
      console.error('Error fetching points:', error);
      return null;
    }
  }

  if (!data) {
    return {
      id: '',
      student_id: studentId,
      total_points: 0,
      level: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  return data;
};

/**
 * Puan ekle - AUTH USER'IN STUDENT ID'SINI OTOMATIK BULUR
 */
export const addPoints = async (
  studentId: string,
  points: number,
  reason: string,
  challengeId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Auth user bilgisi
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user');
      return { success: false, error: 'Not authenticated' };
    }

    console.log('🔍 addPoints called:', {
      inputStudentId: studentId,
      authUid: user.id,
      match: studentId === user.id
    });

    // Eğer studentId = auth.uid() ise direkt kullan
    // Değilse, auth user'ın student kaydını bul
    let actualStudentId = studentId;

    if (studentId !== user.id) {
      console.log('⚠️ studentId ≠ auth.uid(), finding correct student_id...');
      
      // Auth user'ın student kaydını bul
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (studentError) {
        return { success: false, error: 'Student not found' };
      }

      if (!studentData) {
        console.error('❌ No student record for auth user');
        return { success: false, error: 'Student record not found' };
      }

      actualStudentId = studentData.id;
      console.log('✅ Found correct student_id:', actualStudentId);
    }

    // Puan ekle
    const { error } = await supabase
      .from('points_transactions')
      .insert({
        student_id: actualStudentId,
        points,
        reason,
        challenge_id: challengeId
      });

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('✅ Points added successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('💥 Exception in addPoints:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Çalışma seansı için puan ver (1 saat = 10 puan)
 */
export const addStudySessionPoints = async (
  studentId: string,
  durationMinutes: number
): Promise<{ success: boolean; pointsEarned: number }> => {
  const hours = durationMinutes / 60;
  const points = Math.floor(hours * 10); // 1 saat = 10 puan

  if (points === 0) {
    return { success: true, pointsEarned: 0 };
  }

  const result = await addPoints(
    studentId,
    points,
    `${hours.toFixed(1)} saat çalışma`,
    'study_session'
  );

  return {
    success: result.success,
    pointsEarned: points
  };
};

/**
 * Challenge tamamlandı mı kontrol et (bugün)
 */
export const isChallengeCompletedToday = async (
  studentId: string,
  challengeId: string
): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('completed_challenges')
    .select('id')
    .eq('student_id', studentId)
    .eq('challenge_id', challengeId)
    .eq('completed_date', today)
    .maybeSingle();

  if (error) {
    console.error('Error checking challenge:', error);
    return false;
  }

  return !!data;
};

/**
 * Challenge'ı tamamla ve puan kazan
 */
export const completeChallenge = async (
  studentId: string,
  challengeId: string,
  points: number,
  reason: string
): Promise<{ success: boolean; error?: string; alreadyCompleted?: boolean }> => {
  try {
    // Bugün tamamlandı mı kontrol et
    const alreadyCompleted = await isChallengeCompletedToday(studentId, challengeId);
    
    if (alreadyCompleted) {
      return { 
        success: false, 
        error: 'Bu görevi bugün zaten tamamladınız!',
        alreadyCompleted: true 
      };
    }

    const today = new Date().toISOString().split('T')[0];

    // Completed challenge kaydet
    const { error: challengeError } = await supabase
      .from('completed_challenges')
      .insert({
        student_id: studentId,
        challenge_id: challengeId,
        completed_date: today,
        points_earned: points
      });

    if (challengeError) {
      console.error('Error completing challenge:', challengeError);
      return { success: false, error: challengeError.message };
    }

    // Puan ekle
    const pointsResult = await addPoints(studentId, points, reason, challengeId);
    
    if (!pointsResult.success) {
      return { success: false, error: pointsResult.error };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Haftalık çalışma hedefi geri bildirimi için puan ver
 */
export const rewardScheduleGoal = async (
  studentId: string,
  status: 'achieved' | 'partial' | 'not_met'
): Promise<{ success: boolean; pointsEarned: number; error?: string }> => {
  let pointsToAward = 0;
  let reason = '';

  if (status === 'achieved') {
    pointsToAward = 15;
    reason = 'Haftalık hedef tamamlandı';
  } else if (status === 'partial') {
    pointsToAward = 5;
    reason = 'Haftalık hedef kısmen tamamlandı';
  }

  if (pointsToAward === 0) {
    return { success: true, pointsEarned: 0 };
  }

  const result = await addPoints(studentId, pointsToAward, reason, 'schedule_feedback');

  if (!result.success) {
    return { success: false, pointsEarned: 0, error: result.error };
  }

  return { success: true, pointsEarned: pointsToAward };
};

/**
 * Puan geçmişini getir
 */
export const getPointsHistory = async (studentId: string, limit = 10) => {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
};

/**
 * Level'e göre gereken puan (level 1 = 0, level 2 = 100, level 3 = 400, ...)
 */
export const getPointsForLevel = (level: number): number => {
  return Math.pow(level - 1, 2) * 100;
};

/**
 * Bir sonraki level'e kaç puan kaldı
 */
export const getPointsToNextLevel = (currentPoints: number, currentLevel: number): number => {
  const nextLevelPoints = getPointsForLevel(currentLevel + 1);
  return Math.max(0, nextLevelPoints - currentPoints);
};