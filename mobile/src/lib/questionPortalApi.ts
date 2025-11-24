import { supabase } from './supabase';

// ==================== QUESTIONS ====================

export interface StudentQuestion {
  id: string;
  student_id: string;
  title: string;
  description: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  image_url?: string;
  is_solved: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  like_count?: number;
  answer_count?: number;
  user_has_liked?: boolean;
  student?: {
    user_id: string;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

export interface StudentAnswer {
  id: string;
  question_id: string;
  student_id: string;
  answer_text: string;
  image_url?: string;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  like_count?: number;
  user_has_liked?: boolean;
  student?: {
    user_id: string;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

export const getAllQuestions = async (currentUserId?: string) => {
  const { data, error } = await supabase
    .from('student_questions')
    .select(`
      *,
      student:students!student_id(
        user_id,
        profiles:profiles!students_profile_id_fkey(full_name, avatar_url)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const questions = data ?? [];

  // Get like counts and user likes
  if (questions.length > 0) {
    const questionIds = questions.map(q => q.id);
    const { data: likes } = await supabase
      .from('question_likes')
      .select('question_id, student_id');

    const { data: answers } = await supabase
      .from('student_answers')
      .select('question_id');

    const likeMap = new Map<string, { count: number; userLiked: boolean }>();
    const answerMap = new Map<string, number>();

    likes?.forEach(like => {
      const current = likeMap.get(like.question_id) ?? { count: 0, userLiked: false };
      current.count++;
      if (currentUserId && like.student_id === currentUserId) {
        current.userLiked = true;
      }
      likeMap.set(like.question_id, current);
    });

    answers?.forEach(answer => {
      answerMap.set(answer.question_id, (answerMap.get(answer.question_id) ?? 0) + 1);
    });

    return questions.map(q => ({
      ...q,
      like_count: likeMap.get(q.id)?.count ?? 0,
      user_has_liked: likeMap.get(q.id)?.userLiked ?? false,
      answer_count: answerMap.get(q.id) ?? 0,
    }));
  }

  return questions;
};

export const getQuestionById = async (questionId: string, currentUserId?: string) => {
  const { data, error } = await supabase
    .from('student_questions')
    .select(`
      *,
      student:students!student_id(
        user_id,
        profiles:profiles!students_profile_id_fkey(full_name, avatar_url)
      )
    `)
    .eq('id', questionId)
    .single();

  if (error) throw error;

  // Increment view count
  await supabase.rpc('increment_question_views', { question_id: questionId });

  // Get like info
  const { data: likes } = await supabase
    .from('question_likes')
    .select('student_id')
    .eq('question_id', questionId);

  const likeCount = likes?.length ?? 0;
  const userHasLiked = currentUserId ? likes?.some(l => l.student_id === currentUserId) ?? false : false;

  return {
    ...data,
    like_count: likeCount,
    user_has_liked: userHasLiked,
  };
};

export const createQuestion = async (data: {
  student_id: string;
  title: string;
  description: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  image_url?: string;
}) => {
  const { data: result, error } = await supabase
    .from('student_questions')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const updateQuestion = async (questionId: string, updates: {
  title?: string;
  description?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  image_url?: string;
}) => {
  const { error } = await supabase
    .from('student_questions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', questionId);

  if (error) throw error;
};

export const deleteQuestion = async (questionId: string) => {
  const { error } = await supabase
    .from('student_questions')
    .delete()
    .eq('id', questionId);

  if (error) throw error;
};

export const markQuestionAsSolved = async (questionId: string, solved: boolean) => {
  const { error } = await supabase
    .from('student_questions')
    .update({ is_solved: solved, updated_at: new Date().toISOString() })
    .eq('id', questionId);

  if (error) throw error;
};

// ==================== ANSWERS ====================

export const getAnswersForQuestion = async (questionId: string, currentUserId?: string) => {
  const { data, error } = await supabase
    .from('student_answers')
    .select(`
      *,
      student:students!student_id(
        user_id,
        profiles:profiles!students_profile_id_fkey(full_name, avatar_url)
      )
    `)
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const answers = data ?? [];

  // Get like counts
  if (answers.length > 0) {
    const answerIds = answers.map(a => a.id);
    const { data: likes } = await supabase
      .from('answer_likes')
      .select('answer_id, student_id');

    const likeMap = new Map<string, { count: number; userLiked: boolean }>();

    likes?.forEach(like => {
      const current = likeMap.get(like.answer_id) ?? { count: 0, userLiked: false };
      current.count++;
      if (currentUserId && like.student_id === currentUserId) {
        current.userLiked = true;
      }
      likeMap.set(like.answer_id, current);
    });

    return answers.map(a => ({
      ...a,
      like_count: likeMap.get(a.id)?.count ?? 0,
      user_has_liked: likeMap.get(a.id)?.userLiked ?? false,
    }));
  }

  return answers;
};

export const createAnswer = async (data: {
  question_id: string;
  student_id: string;
  answer_text: string;
  image_url?: string;
}) => {
  const { data: result, error } = await supabase
    .from('student_answers')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const updateAnswer = async (answerId: string, answerText: string, imageUrl?: string) => {
  const { error } = await supabase
    .from('student_answers')
    .update({
      answer_text: answerText,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', answerId);

  if (error) throw error;
};

export const deleteAnswer = async (answerId: string) => {
  const { error } = await supabase
    .from('student_answers')
    .delete()
    .eq('id', answerId);

  if (error) throw error;
};

export const acceptAnswer = async (answerId: string) => {
  const { error } = await supabase
    .from('student_answers')
    .update({ is_accepted: true })
    .eq('id', answerId);

  if (error) throw error;
};

// ==================== LIKES ====================

export const toggleQuestionLike = async (questionId: string, studentId: string) => {
  // Check if already liked
  const { data: existing } = await supabase
    .from('question_likes')
    .select('id')
    .eq('question_id', questionId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('question_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false; // unliked
  } else {
    // Like
    const { error } = await supabase
      .from('question_likes')
      .insert([{ question_id: questionId, student_id: studentId }]);
    if (error) throw error;
    return true; // liked
  }
};

export const toggleAnswerLike = async (answerId: string, studentId: string) => {
  // Check if already liked
  const { data: existing } = await supabase
    .from('answer_likes')
    .select('id')
    .eq('answer_id', answerId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('answer_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false; // unliked
  } else {
    // Like
    const { error } = await supabase
      .from('answer_likes')
      .insert([{ answer_id: answerId, student_id: studentId }]);
    if (error) throw error;
    return true; // liked
  }
};
