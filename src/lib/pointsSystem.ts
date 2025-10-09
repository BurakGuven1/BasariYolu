import { supabase } from './supabase';

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
export const getStudentPoints = async (studentId: string): Promise<StudentPoints | null> => {
  const { data, error } = await supabase
    .from('student_points')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching points:', error);
    return null;
  }

  // Eğer kayıt yoksa varsayılan değerler döndür
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
 * Puan ekle
 */
export const addPoints = async (
  studentId: string,
  points: number,
  reason: string,
  challengeId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('points_transactions')
      .insert({
        student_id: studentId,
        points,
        reason,
        challenge_id: challengeId
      });

    if (error) {
      console.error('Error adding points:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
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