// AI API Helper Functions
// Handles all AI-related API calls with error handling

import { supabase } from './supabase';

export interface AICredits {
  weekly_credits: number;
  used_credits: number;
  remaining_credits: number;
  week_start_date: string;
  week_end_date: string;
}

export interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  tokens_used: number;
  model_used: string;
  category: string | null;
  asked_at: string;
}

export interface AskAIResponse {
  success: boolean;
  answer: string;
  tokensUsed: number;
  remainingCredits: number;
  weekEndDate: string;
}

export interface AskAIError {
  error: string;
  code?: 'PLAN_RESTRICTION' | 'NO_CREDITS' | 'UNKNOWN';
  weekStartDate?: string;
  weekEndDate?: string;
}

/**
 * Get student's current AI credits
 */
export async function getAICredits(studentId: string): Promise<AICredits | null> {
  try {
    const { data, error } = await supabase.rpc('get_student_ai_credits', {
      p_student_id: studentId,
    });

    if (error) {
      console.error('Error fetching AI credits:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getAICredits:', error);
    return null;
  }
}

/**
 * Ask AI a question (uses Edge Function)
 */
export async function askAI(
  question: string,
  category?: string
): Promise<AskAIResponse> {
  try {
    // Get session token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    // Call Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-ai`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question,
          category,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  } catch (error: any) {
    console.error('Error asking AI:', error);
    throw error;
  }
}

/**
 * Get student's AI question history
 */
export async function getAIHistory(
  studentId: string,
  limit: number = 50
): Promise<AIQuestion[]> {
  try {
    const { data, error } = await supabase
      .from('ai_questions')
      .select('*')
      .eq('student_id', studentId)
      .order('asked_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching AI history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAIHistory:', error);
    return [];
  }
}

/**
 * Get AI usage statistics for student
 */
export async function getAIUsageStats(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('student_ai_usage')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching AI usage stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getAIUsageStats:', error);
    return null;
  }
}

/**
 * Format date for display
 */
export function formatAIDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
