import { supabase } from './supabase';
import type { InstitutionQuestionType } from './institutionApi';

export type InstitutionQuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface InstitutionQuestionChoice {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface InstitutionQuestion {
  id: string;
  institution_id: string;
  created_by: string;
  question_type: InstitutionQuestionType;
  subject: string;
  topic: string;
  difficulty: InstitutionQuestionDifficulty;
  passage_text: string | null;
  question_prompt: string | null;
  question_text: string;
  question_number?: number;
  choices: InstitutionQuestionChoice[];
  answer_key: string | null;
  explanation: string | null;
  tags: string[];
  is_published: boolean;
  metadata: Record<string, any>;
  page_number?: number | null;
  page_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionQuestionSummary {
  totalQuestions: number;
  publishedQuestions: number;
  draftQuestions: number;
  subjects: Array<{
    subject: string;
    total: number;
    published: number;
    topicCount: number;
    topics: string[];
  }>;
}

export interface InstitutionExamBlueprint {
  id: string;
  institution_id: string;
  created_by: string;
  name: string;
  exam_type: string;
  description: string | null;
  duration_minutes: number | null;
  question_count: number;
  question_ids: string[];
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ListQuestionsParams {
  institutionId: string;
  subject?: string;
  topic?: string;
  search?: string;
  isPublished?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UpsertQuestionPayload {
  institutionId: string;
  createdBy: string;
  questionType: InstitutionQuestionType;
  subject: string;
  topic: string;
  difficulty: InstitutionQuestionDifficulty;
  passageText?: string | null;
  questionPrompt?: string | null;
  questionText: string;
  choices: InstitutionQuestionChoice[];
  answerKey?: string | null;
  explanation?: string | null;
  tags?: string[];
  isPublished?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateQuestionPayload extends Partial<UpsertQuestionPayload> {
  questionId: string;
}

export interface UpsertBlueprintPayload {
  institutionId: string;
  createdBy: string;
  name: string;
  examType?: string;
  description?: string;
  durationMinutes?: number | null;
  questionIds: string[];
  settings?: Record<string, any>;
}

export interface UpdateBlueprintPayload extends Partial<UpsertBlueprintPayload> {
  blueprintId: string;
}

const DEFAULT_PAGE_SIZE = 25;

export async function fetchInstitutionQuestionSummary(
  institutionId: string,
): Promise<InstitutionQuestionSummary> {
  const { data, error } = await supabase.rpc('institution_question_dashboard', {
    p_institution_id: institutionId,
  });

  if (error) {
    console.error('[InstitutionQuestionApi] summary error:', error);
    throw error;
  }

  const payload = Array.isArray(data) ? data[0] : data;

  if (!payload) {
    return {
      totalQuestions: 0,
      publishedQuestions: 0,
      draftQuestions: 0,
      subjects: [],
    };
  }

  return {
    totalQuestions: payload.total_questions ?? 0,
    publishedQuestions: payload.published_questions ?? 0,
    draftQuestions: payload.draft_questions ?? 0,
    subjects: (payload.subjects ?? []).map((entry: any) => ({
      subject: entry.subject,
      total: entry.total,
      published: entry.published,
      topicCount: entry.topicCount,
      topics: Array.isArray(entry.topics)
        ? entry.topics.map((topic: any) => (typeof topic === 'string' ? topic : topic?.name ?? topic))
        : [],
    })),
  };
}

export async function listInstitutionQuestions({
  institutionId,
  subject,
  topic,
  search,
  isPublished,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: ListQuestionsParams): Promise<{ data: InstitutionQuestion[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('owner_type', 'institution')
    .eq('owner_id', institutionId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (subject && subject !== 'all') {
    query = query.eq('subject', subject);
  }

  if (topic && topic !== 'all') {
    query = query.eq('topic', topic);
  }

  if (typeof isPublished === 'boolean') {
    query = query.eq('visibility', isPublished ? 'institution_only' : 'private');
  }

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    // Search in content->stem and other fields
    query = query.or(
      `topic.ilike.${searchTerm},subject.ilike.${searchTerm},tags.cs.{${search.trim()}}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[InstitutionQuestionApi] list error:', error);
    throw error;
  }

  // Map questions table format to InstitutionQuestion format
  const mappedData: InstitutionQuestion[] = (data ?? []).map((q: any) => ({
    id: q.id,
    institution_id: q.owner_id,
    created_by: q.created_by || '',
    question_type: q.format === 'multiple_choice' ? 'multiple_choice' : 'written',
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    passage_text: q.content?.passage || null,
    question_prompt: q.content?.stem || '',
    question_text: q.content?.stem || '',
    question_number: q.question_number,
    choices: q.content?.options?.map((opt: any) => ({
      id: opt.label,
      label: opt.label,
      text: opt.value,
      isCorrect: opt.label === q.answer_key?.value,
    })) || [],
    answer_key: q.answer_key?.value || null,
    explanation: q.answer_key?.explanation || null,
    tags: q.tags || [],
    is_published: q.visibility !== 'private',
    metadata: q.metadata || {},
    page_number: q.page_number || null,
    page_image_url: q.page_image_url || null,
    created_at: q.created_at,
    updated_at: q.updated_at,
  }));

  return {
    data: mappedData,
    count: count ?? 0,
  };
}

export async function createInstitutionQuestion({
  institutionId,
  createdBy,
  questionType,
  subject,
  topic,
  difficulty,
  passageText = null,
  questionPrompt = null,
  questionText,
  choices,
  answerKey = null,
  explanation = null,
  tags = [],
  isPublished = false,
  metadata = {},
}: UpsertQuestionPayload): Promise<InstitutionQuestion> {
  const payload = {
    institution_id: institutionId,
    created_by: createdBy,
    question_type: questionType,
    subject,
    topic,
    difficulty,
    passage_text: passageText,
    question_prompt: questionPrompt,
    question_text: questionText,
    choices,
    answer_key: answerKey,
    explanation,
    tags,
    is_published: isPublished,
    metadata,
  };

  const { data, error } = await supabase
    .from('institution_questions')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('[InstitutionQuestionApi] create error:', error);
    throw error;
  }

  return data as InstitutionQuestion;
}

export async function updateInstitutionQuestion({
  questionId,
  institutionId,
  createdBy,
  questionType,
  subject,
  topic,
  difficulty,
  passageText,
  questionPrompt,
  questionText,
  choices,
  answerKey,
  explanation,
  tags,
  isPublished,
  metadata,
}: UpdateQuestionPayload): Promise<InstitutionQuestion> {
  const updates: Record<string, unknown> = {};

  if (institutionId) updates.institution_id = institutionId;
  if (createdBy) updates.created_by = createdBy;
  if (questionType) updates.question_type = questionType;
  if (subject) updates.subject = subject;
  if (topic) updates.topic = topic;
  if (difficulty) updates.difficulty = difficulty;
  if (typeof passageText !== 'undefined') updates.passage_text = passageText;
  if (typeof questionPrompt !== 'undefined') updates.question_prompt = questionPrompt;
  if (questionText) updates.question_text = questionText;
  if (choices) updates.choices = choices;
  if (typeof answerKey !== 'undefined') updates.answer_key = answerKey;
  if (typeof explanation !== 'undefined') updates.explanation = explanation;
  if (tags) updates.tags = tags;
  if (typeof isPublished === 'boolean') updates.is_published = isPublished;
  if (metadata) updates.metadata = metadata;

  const { data, error } = await supabase
    .from('institution_questions')
    .update(updates)
    .eq('id', questionId)
    .select('*')
    .single();

  if (error) {
    console.error('[InstitutionQuestionApi] update error:', error);
    throw error;
  }

  return data as InstitutionQuestion;
}

export async function deleteInstitutionQuestion(questionId: string): Promise<void> {
  const { error } = await supabase.from('institution_questions').delete().eq('id', questionId);

  if (error) {
    console.error('[InstitutionQuestionApi] delete error:', error);
    throw error;
  }
}

export async function toggleInstitutionQuestionPublish(
  questionId: string,
  isPublished: boolean,
): Promise<InstitutionQuestion> {
  const { data, error } = await supabase
    .from('institution_questions')
    .update({ is_published: isPublished })
    .eq('id', questionId)
    .select('*')
    .single();

  if (error) {
    console.error('[InstitutionQuestionApi] toggle publish error:', error);
    throw error;
  }

  return data as InstitutionQuestion;
}

export async function getInstitutionQuestionsByIds(
  institutionId: string,
  questionIds: string[],
): Promise<InstitutionQuestion[]> {
  if (!questionIds.length) return [];

  const { data, error } = await supabase
    .from('institution_questions')
    .select('*')
    .eq('institution_id', institutionId)
    .in('id', questionIds);

  if (error) {
    console.error('[InstitutionQuestionApi] get by ids error:', error);
    throw error;
  }

  return (data as InstitutionQuestion[]) ?? [];
}

export async function listInstitutionExamBlueprints(
  institutionId: string,
): Promise<InstitutionExamBlueprint[]> {
  const { data, error } = await supabase
    .from('institution_exam_blueprints')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[InstitutionQuestionApi] blueprint list error:', error);
    throw error;
  }

  return (data as InstitutionExamBlueprint[]) ?? [];
}

export async function createInstitutionExamBlueprint({
  institutionId,
  createdBy,
  name,
  examType = 'custom',
  description,
  durationMinutes = null,
  questionIds,
  settings = {},
}: UpsertBlueprintPayload): Promise<InstitutionExamBlueprint> {
  const payload = {
    institution_id: institutionId,
    created_by: createdBy,
    name,
    exam_type: examType,
    description: description ?? null,
    duration_minutes: durationMinutes,
    question_count: questionIds.length,
    question_ids: questionIds,
    settings,
  };

  const { data, error } = await supabase
    .from('institution_exam_blueprints')
    .insert([payload])
    .select('*')
    .single();

  if (error) {
    console.error('[InstitutionQuestionApi] blueprint create error:', error);
    throw error;
  }

  return data as InstitutionExamBlueprint;
}

export async function updateInstitutionExamBlueprint({
  blueprintId,
  institutionId,
  createdBy,
  name,
  examType,
  description,
  durationMinutes,
  questionIds,
  settings,
}: UpdateBlueprintPayload): Promise<InstitutionExamBlueprint> {
  const updates: Record<string, unknown> = {};

  if (institutionId) updates.institution_id = institutionId;
  if (createdBy) updates.created_by = createdBy;
  if (name) updates.name = name;
  if (examType) updates.exam_type = examType;
  if (typeof description !== 'undefined') updates.description = description ?? null;
  if (typeof durationMinutes !== 'undefined') updates.duration_minutes = durationMinutes;
  if (questionIds) {
    updates.question_ids = questionIds;
    updates.question_count = questionIds.length;
  }
  if (settings) updates.settings = settings;

  const { data, error } = await supabase
    .from('institution_exam_blueprints')
    .update(updates)
    .eq('id', blueprintId)
    .select('*')
    .single();

  if (error) {
    console.error('[InstitutionQuestionApi] blueprint update error:', error);
    throw error;
  }

  return data as InstitutionExamBlueprint;
}

export async function deleteInstitutionExamBlueprint(blueprintId: string): Promise<void> {
  const { error } = await supabase.from('institution_exam_blueprints').delete().eq('id', blueprintId);

  if (error) {
    console.error('[InstitutionQuestionApi] blueprint delete error:', error);
    throw error;
  }
}
