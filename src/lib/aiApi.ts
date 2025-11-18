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
  conversationId?: string;
  modelUsed?: string;
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

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image_url?: string;
}

/**
 * Ask AI a question (uses Edge Function)
 */
export async function askAI(
  question: string,
  options?: {
    category?: string;
    conversationId?: string;
    messages?: Message[];
    imageUrl?: string;
    imageBase64?: string;
  }
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
          category: options?.category,
          conversationId: options?.conversationId,
          messages: options?.messages,
          imageUrl: options?.imageUrl,
          imageBase64: options?.imageBase64,
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

/**
 * Get student's conversations
 */
export async function getConversations(studentId: string, limit: number = 20) {
  try {
    const { data, error } = await supabase.rpc('get_student_conversations', {
      p_student_id: studentId,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConversations:', error);
    return [];
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase.rpc('get_conversation_messages', {
      p_conversation_id: conversationId,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    return [];
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string) {
  try {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    return false;
  }
}

/**
 * Upload image to Supabase Storage
 */
export async function uploadAIImage(file: File, studentId: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('ai-chat-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ai-chat-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadAIImage:', error);
    return null;
  }
}
