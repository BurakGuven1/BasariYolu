import { supabase } from './supabase';
import { examData } from '../data/examTopics';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionFormat = 'multiple_choice' | 'short_answer' | 'essay';
export type QuestionOwnerScope = 'all' | 'platform' | 'institution' | 'teacher';

export interface QuestionContentOption {
  label: string;
  value: string;
}

export interface QuestionContentMedia {
  type: 'image' | 'audio' | 'video';
  url: string;
  caption?: string;
}

export interface QuestionContent {
  stem: string;
  options?: QuestionContentOption[];
  media?: QuestionContentMedia[];
  extra?: Record<string, unknown>;
}

export interface QuestionAnswerKey {
  type: 'option' | 'text' | 'number' | 'multi';
  value: string | string[] | number;
  explanation?: string;
}

export interface QuestionRecord {
  id: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: QuestionDifficulty;
  format: QuestionFormat;
  tags: string[];
  content: QuestionContent;
  answer_key?: QuestionAnswerKey;
  solution?: Record<string, unknown>;
  owner_type: 'platform' | 'institution' | 'teacher';
  owner_id: string | null;
  visibility: 'private' | 'institution_only' | 'public';
  created_at: string;
  updated_at: string;
}

export interface QuestionRequest {
  subject?: string;
  subjects?: string[];
  topic?: string;
  topics?: string[];
  tags?: string[];
  levels?: string[];
  difficulty?: QuestionDifficulty;
  difficulties?: QuestionDifficulty[];
  ownerScope?: QuestionOwnerScope;
  ownerIds?: string[];
  count: number;
}

export interface QuestionSetSummary {
  id: string;
  institution_id: string;
  title: string;
  description: string | null;
  pdf_url: string;
  tags: string[];
  visibility: 'private' | 'institution_only' | 'public';
  created_by: string | null;
  created_at: string;
}

export interface QuestionSetFilters {
  institutionId?: string;
  includePublic?: boolean;
  visibility?: 'private' | 'institution_only' | 'public';
  limit?: number;
}

const DEFAULT_REQUEST: QuestionRequest = {
  ownerScope: 'all',
  count: 10,
};

const normalizeRequest = (request: QuestionRequest) => {
  const merged = { ...DEFAULT_REQUEST, ...request };
  const payload: Record<string, unknown> = {
    limit: merged.count,
    owner_scope: merged.ownerScope ?? 'all',
  };

  if (merged.subjects?.length) payload.subjects = merged.subjects;
  else if (merged.subject) payload.subject = merged.subject;

  if (merged.topics?.length) payload.topics = merged.topics;
  else if (merged.topic) payload.topic = merged.topic;

  if (merged.tags?.length) payload.tags = merged.tags;
  if (merged.levels?.length) {
    payload.tags = [...(payload.tags ?? []), ...merged.levels];
  }

  if (merged.difficulties?.length) payload.difficulties = merged.difficulties;
  else if (merged.difficulty) payload.difficulty = merged.difficulty;

  if (merged.ownerIds?.length) payload.owner_ids = merged.ownerIds;

  return payload;
};

export async function fetchQuestions(request: QuestionRequest) {
  const { data, error } = await supabase.rpc('build_questions', {
    filters: normalizeRequest(request),
  });

  if (error) {
    throw error;
  }

  return (data as QuestionRecord[]) ?? [];
}

export async function buildCustomTest(requests: QuestionRequest[]) {
  if (!requests.length) {
    return [];
  }

  const batches = await Promise.all(
    requests.map((req) =>
      supabase.rpc('build_questions', {
        filters: normalizeRequest(req),
      }),
    ),
  );

  const questions = batches.flatMap(({ data, error }) => {
    if (error) {
      throw error;
    }
    return (data as QuestionRecord[]) ?? [];
  });

  return questions;
}

export async function fetchQuestionSets(filters: QuestionSetFilters = {}) {
  let query = supabase
    .from('institution_question_sets')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.institutionId) {
    if (filters.includePublic === false) {
      query = query.eq('institution_id', filters.institutionId);
    } else {
      query = query.or(
        `institution_id.eq.${filters.institutionId},visibility.eq.public`,
      );
    }
  } else if (filters.visibility) {
    query = query.eq('visibility', filters.visibility);
  } else {
    query = query.eq('visibility', 'public');
  }

  if (error) {
    throw error;
  }

  return (data as QuestionSetSummary[]) ?? [];
}

const SUBJECT_PREFIXES = ['TYT ', 'AYT ', 'LGS '];
const SUBJECT_ALIAS: Record<string, string> = {
  'Fen Bilimleri': 'Fen',
  'Fen Bilimleri (Fen)': 'Fen',
  'T.C. İnkılap Tarihi ve Atatürkçülük': 'Tarih',
  'T.C. Inkilap Tarihi ve Ataturkculuk': 'Tarih',
  'Din Kültürü ve Ahlak Bilgisi': 'Din',
  'Din Kultur ve Ahlak Bilgisi': 'Din',
  'Edebiyat': 'Edebiyat',
  'Türkçe': 'Turkce',
  'Ingilizce': 'Ingilizce',
  'İngilizce': 'Ingilizce',
  'Sosyal Bilgiler': 'Sosyal',
  'Sosyal Bilimler': 'Sosyal',
};

const canonicalSubject = (subject: string) => {
  let result = subject.trim();
  SUBJECT_PREFIXES.forEach((prefix) => {
    if (result.toUpperCase().startsWith(prefix.trim().toUpperCase())) {
      result = result.slice(prefix.length).trim();
    }
  });
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I');
  return SUBJECT_ALIAS[result] ?? result;
};

const subjectTopicWeights: Record<string, Record<string, number>> = {};

Object.entries(examData).forEach(([subjectKey, subjectData]) => {
  const canonical = canonicalSubject(subjectKey);
  const current = subjectTopicWeights[canonical] ?? {};
  subjectData.konular.forEach((topic) => {
    const weight = Object.values(topic.yillar).reduce((sum, value) => sum + value, 0);
    if (weight > 0) {
      current[topic.konu] = (current[topic.konu] ?? 0) + weight;
    }
  });
  if (Object.keys(current).length) {
    subjectTopicWeights[canonical] = current;
  }
});

const adjustAllocation = (entries: { topic: string; count: number }[], desiredTotal: number) => {
  let currentTotal = entries.reduce((sum, item) => sum + item.count, 0);

  while (currentTotal > desiredTotal) {
    const candidate = entries
      .filter((item) => item.count > 1)
      .sort((a, b) => a.count - b.count)[0];
    if (!candidate) break;
    candidate.count -= 1;
    currentTotal -= 1;
  }

  while (currentTotal < desiredTotal) {
    const candidate = entries.sort((a, b) => b.count - a.count)[0];
    if (!candidate) break;
    candidate.count += 1;
    currentTotal += 1;
  }
};

export function buildWeightedRequestsForSubject(
  subject: string,
  count: number,
  base: Partial<QuestionRequest> = {},
) {
  const canonical = canonicalSubject(subject);
  const weights = subjectTopicWeights[canonical];

  if (!weights || !Object.keys(weights).length) {
    return [{ ...base, subject, count }];
  }

  const entries = Object.entries(weights).sort((a, b) => b[1] - a[1]);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let allocations = entries.map(([topic, weight]) => ({
    topic,
    count: Math.max(1, Math.round((weight / totalWeight) * count)),
  }));

  adjustAllocation(allocations, count);

  return allocations
    .filter((item) => item.count > 0)
    .map((item) => ({
      ...base,
      subject,
      topic: item.topic,
      count: item.count,
    }));
}

export async function fetchTopicsBySubject(subject: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('topic')
    .eq('subject', subject);

  if (error) {
    throw error;
  }

  const unique = Array.from(
    new Set((data ?? []).map((row: { topic: string | null }) => row.topic).filter(Boolean)),
  ) as string[];

  return unique.sort((a, b) => a.localeCompare(b, 'tr-TR'));
}

export async function fetchWeightedSubjectQuestions(
  subject: string,
  count: number,
  base: Partial<QuestionRequest> = {},
) {
  const requests = buildWeightedRequestsForSubject(subject, count, base);
  const collected: QuestionRecord[] = [];
  const seen = new Set<string>();

  for (const request of requests) {
    if (collected.length >= count) break;
    const data = await fetchQuestions(request);
    let added = 0;
    for (const question of data) {
      if (added >= request.count || collected.length >= count) break;
      if (!seen.has(question.id)) {
        collected.push(question);
        seen.add(question.id);
        added += 1;
      }
    }
  }

  if (collected.length < count) {
    const fallback = await fetchQuestions({
      ...base,
      subject,
      count: count - collected.length,
    });
    for (const question of fallback) {
      if (collected.length >= count) break;
      if (!seen.has(question.id)) {
        collected.push(question);
        seen.add(question.id);
      }
    }
  }

  return collected.slice(0, count);
}
