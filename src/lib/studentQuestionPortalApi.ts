import { supabase } from './supabase';

// Debug fonksiyonu - kullanıcı bilgilerini kontrol et
export async function debugAuth() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  console.log('=== AUTH DEBUG ===');
  console.log('Session:', session);
  console.log('Session Error:', sessionError);
  console.log('User:', user);
  console.log('User Error:', userError);
  console.log('User ID:', user?.id);
  console.log('User Email:', user?.email);
  console.log('==================');

  return { session, user, sessionError, userError };
}

// Test insert fonksiyonu - detaylı hata mesajı
export async function testInsertQuestion() {
  console.log('=== TEST INSERT ===');

  // Önce auth kontrol
  const authDebug = await debugAuth();

  if (!authDebug.user) {
    console.error('❌ Kullanıcı oturum açmamış!');
    return;
  }

  console.log('✅ Kullanıcı oturum açmış:', authDebug.user.id);

  // Test insert
  const testData = {
    student_id: authDebug.user.id,
    title: 'DEBUG TEST SORUSU',
    description: 'Bu bir debug test sorusu'
  };

  console.log('Insert data:', testData);

  const { data, error } = await supabase
    .from('student_questions')
    .insert(testData)
    .select();

  if (error) {
    console.error('❌ INSERT HATASI:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Details:', error.details);
    console.error('Error Hint:', error.hint);
    console.error('Full Error:', error);
  } else {
    console.log('✅ INSERT BAŞARILI:', data);

    // Sil
    await supabase
      .from('student_questions')
      .delete()
      .eq('id', data[0].id);
    console.log('✅ Test verisi silindi');
  }

  console.log('==================');
}

// Types
export interface StudentQuestion {
  id: string;
  student_id: string;
  title: string;
  description: string;
  subject: string | null;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  image_url: string | null;
  is_solved: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  answer_count?: number;
  like_count?: number;
  user_has_liked?: boolean;
}

export interface StudentAnswer {
  id: string;
  question_id: string;
  student_id: string;
  answer_text: string;
  image_url: string | null;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  like_count?: number;
  user_has_liked?: boolean;
}

export interface CreateQuestionData {
  title: string;
  description: string;
  subject?: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
}

export interface CreateAnswerData {
  question_id: string;
  answer_text: string;
  image_url?: string;
}

// Questions API
export async function getAllQuestions(currentUserId?: string): Promise<StudentQuestion[]> {
  const { data, error } = await supabase
    .from('student_questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Enrich with answer count, like count, and user's like status
  const enrichedQuestions = await Promise.all(
    (data || []).map(async (q) => {
      const [answerCount, likeCount, userLike] = await Promise.all([
        getAnswerCount(q.id),
        getQuestionLikeCount(q.id),
        currentUserId ? hasUserLikedQuestion(q.id, currentUserId) : false
      ]);

      return {
        ...q,
        answer_count: answerCount,
        like_count: likeCount,
        user_has_liked: userLike
      };
    })
  );

  return enrichedQuestions;
}

export async function getQuestionById(questionId: string, currentUserId?: string): Promise<StudentQuestion | null> {
  const { data, error } = await supabase
    .from('student_questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Increment view count
  await incrementViewCount(questionId);

  const [answerCount, likeCount, userLike] = await Promise.all([
    getAnswerCount(questionId),
    getQuestionLikeCount(questionId),
    currentUserId ? hasUserLikedQuestion(questionId, currentUserId) : false
  ]);

  return {
    ...data,
    answer_count: answerCount,
    like_count: likeCount,
    user_has_liked: userLike
  };
}

export async function createQuestion(data: CreateQuestionData): Promise<StudentQuestion> {
  console.log('=== createQuestion called ===');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  console.log('User ID:', user.id);
  console.log('Question data:', data);

  const insertData = {
    student_id: user.id,
    title: data.title,
    description: data.description,
    subject: data.subject || null,
    topic: data.topic || null,
    difficulty: data.difficulty || null,
    image_url: data.image_url || null
  };

  console.log('Insert data:', insertData);

  const { data: question, error } = await supabase
    .from('student_questions')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ CREATE QUESTION ERROR:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    throw error;
  }

  console.log('✅ Question created:', question);
  return question;
}

export async function updateQuestion(questionId: string, data: Partial<CreateQuestionData>): Promise<StudentQuestion> {
  const { data: question, error } = await supabase
    .from('student_questions')
    .update(data)
    .eq('id', questionId)
    .select()
    .single();

  if (error) throw error;
  return question;
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await supabase
    .from('student_questions')
    .delete()
    .eq('id', questionId);

  if (error) throw error;
}

export async function markQuestionAsSolved(questionId: string, solved: boolean): Promise<void> {
  const { error } = await supabase
    .from('student_questions')
    .update({ is_solved: solved })
    .eq('id', questionId);

  if (error) throw error;
}

// Answers API
export async function getAnswersForQuestion(questionId: string, currentUserId?: string): Promise<StudentAnswer[]> {
  const { data, error } = await supabase
    .from('student_answers')
    .select('*')
    .eq('question_id', questionId)
    .order('is_accepted', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Enrich with like count and user's like status
  const enrichedAnswers = await Promise.all(
    (data || []).map(async (a) => {
      const [likeCount, userLike] = await Promise.all([
        getAnswerLikeCount(a.id),
        currentUserId ? hasUserLikedAnswer(a.id, currentUserId) : false
      ]);

      return {
        ...a,
        like_count: likeCount,
        user_has_liked: userLike
      };
    })
  );

  return enrichedAnswers;
}

export async function createAnswer(data: CreateAnswerData): Promise<StudentAnswer> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const { data: answer, error } = await supabase
    .from('student_answers')
    .insert({
      question_id: data.question_id,
      student_id: user.id,
      answer_text: data.answer_text,
      image_url: data.image_url || null
    })
    .select()
    .single();

  if (error) throw error;
  return answer;
}

export async function updateAnswer(answerId: string, answerText: string, imageUrl?: string): Promise<StudentAnswer> {
  const { data: answer, error } = await supabase
    .from('student_answers')
    .update({
      answer_text: answerText,
      image_url: imageUrl || null
    })
    .eq('id', answerId)
    .select()
    .single();

  if (error) throw error;
  return answer;
}

export async function deleteAnswer(answerId: string): Promise<void> {
  const { error } = await supabase
    .from('student_answers')
    .delete()
    .eq('id', answerId);

  if (error) throw error;
}

export async function acceptAnswer(answerId: string): Promise<void> {
  const { error } = await supabase
    .from('student_answers')
    .update({ is_accepted: true })
    .eq('id', answerId);

  if (error) throw error;
}

// Likes API
export async function toggleQuestionLike(questionId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const hasLiked = await hasUserLikedQuestion(questionId, user.id);

  if (hasLiked) {
    // Remove like
    const { error } = await supabase
      .from('question_likes')
      .delete()
      .eq('question_id', questionId)
      .eq('student_id', user.id);

    if (error) throw error;
    return false;
  } else {
    // Add like
    const { error } = await supabase
      .from('question_likes')
      .insert({
        question_id: questionId,
        student_id: user.id
      });

    if (error) throw error;
    return true;
  }
}

export async function toggleAnswerLike(answerId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const hasLiked = await hasUserLikedAnswer(answerId, user.id);

  if (hasLiked) {
    // Remove like
    const { error } = await supabase
      .from('answer_likes')
      .delete()
      .eq('answer_id', answerId)
      .eq('student_id', user.id);

    if (error) throw error;
    return false;
  } else {
    // Add like
    const { error } = await supabase
      .from('answer_likes')
      .insert({
        answer_id: answerId,
        student_id: user.id
      });

    if (error) throw error;
    return true;
  }
}

// Helper functions
async function getAnswerCount(questionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('student_answers')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', questionId);

  if (error) throw error;
  return count || 0;
}

async function getQuestionLikeCount(questionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('question_likes')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', questionId);

  if (error) throw error;
  return count || 0;
}

async function getAnswerLikeCount(answerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('answer_likes')
    .select('*', { count: 'exact', head: true })
    .eq('answer_id', answerId);

  if (error) throw error;
  return count || 0;
}

async function hasUserLikedQuestion(questionId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('question_likes')
    .select('id')
    .eq('question_id', questionId)
    .eq('student_id', userId)
    .single();

  return !!data && !error;
}

async function hasUserLikedAnswer(answerId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('answer_likes')
    .select('id')
    .eq('answer_id', answerId)
    .eq('student_id', userId)
    .single();

  return !!data && !error;
}

async function incrementViewCount(questionId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_question_view_count', {
    question_uuid: questionId
  });

  if (error) console.error('Error incrementing view count:', error);
}

// Image upload helper
export async function uploadQuestionImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('student-exam-artifacts')
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('student-exam-artifacts')
    .getPublicUrl(fileName);

  return publicUrl;
}
