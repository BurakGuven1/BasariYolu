import { supabase } from './supabase';

/**
 * Harici Sınav API - Yayınevi denemeleri ve fiziksel sınav sonuçları
 */

export interface ExternalExamQuestionMapping {
  questionNumber: number;
  subject: string;
  topic: string;
  correctAnswer?: string; // Opsiyonel - cevap anahtarı
}

export interface ExternalExamTemplate {
  id: string;
  name: string;
  publisher: string | null;
  exam_type: 'TYT' | 'AYT' | 'LGS';
  exam_number: number | null;
  total_questions: number;
  question_mapping: ExternalExamQuestionMapping[];
  is_public: boolean;
  created_by: string | null;
  institution_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalExamAnswer {
  answer: 'D' | 'Y' | 'B'; // Doğru, Yanlış, Boş
  isCorrect?: boolean;
}

export interface ExternalExamResult {
  id: string;
  institution_id: string;
  template_id: string | null;
  student_id: string;
  user_id: string;
  exam_date: string;
  answers: Record<number, ExternalExamAnswer>; // {1: {answer: "D", isCorrect: true}, ...}
  correct_count: number;
  wrong_count: number;
  empty_count: number;
  net_score: number;
  score: number | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template?: ExternalExamTemplate; // Join ile geliyor
  student_name?: string; // Join ile geliyor
}

export interface CreateExternalExamTemplatePayload {
  name: string;
  publisher?: string;
  examType: 'TYT' | 'AYT' | 'LGS';
  examNumber?: number;
  totalQuestions: number;
  questionMapping: ExternalExamQuestionMapping[];
  isPublic?: boolean;
  institutionId?: string;
}

export interface BulkExamResultEntry {
  studentUserId: string;
  studentName: string;
  answers: Record<number, 'D' | 'Y' | 'B'>; // {1: "D", 2: "Y", 3: "B", ...}
}

export interface CreateBulkExternalExamResultsPayload {
  institutionId: string;
  templateId: string;
  examDate: string;
  results: BulkExamResultEntry[];
  createdBy: string;
}

/**
 * Yeni harici sınav template'i oluştur
 */
export async function createExternalExamTemplate(
  payload: CreateExternalExamTemplatePayload
): Promise<ExternalExamTemplate> {
  const { data, error } = await supabase
    .from('institution_external_exam_templates')
    .insert({
      name: payload.name,
      publisher: payload.publisher || null,
      exam_type: payload.examType,
      exam_number: payload.examNumber || null,
      total_questions: payload.totalQuestions,
      question_mapping: payload.questionMapping,
      is_public: payload.isPublic || false,
      institution_id: payload.institutionId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating external exam template:', error);
    throw error;
  }

  return data;
}

/**
 * Template listesini getir (public + kurum)
 */
export async function fetchExternalExamTemplates(
  institutionId?: string,
  examType?: 'TYT' | 'AYT' | 'LGS'
): Promise<ExternalExamTemplate[]> {
  let query = supabase
    .from('institution_external_exam_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (examType) {
    query = query.eq('exam_type', examType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching external exam templates:', error);
    throw error;
  }

  return data || [];
}

/**
 * Toplu sonuç girişi
 */
export async function createBulkExternalExamResults(
  payload: CreateBulkExternalExamResultsPayload
): Promise<{ success: number; failed: number; errors: string[] }> {
  // Template'i çek (cevap anahtarı için)
  const { data: template, error: templateError } = await supabase
    .from('institution_external_exam_templates')
    .select('*')
    .eq('id', payload.templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template bulunamadı');
  }

  const questionMapping = template.question_mapping as ExternalExamQuestionMapping[];

  // Her öğrenci için sonuç hesapla
  const resultsToInsert = [];
  const errors: string[] = [];

  for (const entry of payload.results) {
    try {
      // Student ID'yi çek
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', entry.studentUserId)
        .single();

      if (!student) {
        errors.push(`${entry.studentName}: Öğrenci kaydı bulunamadı`);
        continue;
      }

      let correctCount = 0;
      let wrongCount = 0;
      let emptyCount = 0;

      const processedAnswers: Record<number, ExternalExamAnswer> = {};

      // Her cevabı değerlendir
      Object.entries(entry.answers).forEach(([questionNumStr, answer]) => {
        const questionNum = parseInt(questionNumStr);
        const questionInfo = questionMapping.find(q => q.questionNumber === questionNum);

        if (answer === 'B') {
          emptyCount++;
          processedAnswers[questionNum] = { answer: 'B' };
        } else if (answer === 'D') {
          correctCount++;
          processedAnswers[questionNum] = { answer: 'D', isCorrect: true };
        } else if (answer === 'Y') {
          wrongCount++;
          processedAnswers[questionNum] = { answer: 'Y', isCorrect: false };
        }
      });

      // Net hesapla (Doğru - Yanlış/4)
      const netScore = correctCount - (wrongCount / 4);

      resultsToInsert.push({
        institution_id: payload.institutionId,
        template_id: payload.templateId,
        student_id: student.id,
        user_id: entry.studentUserId,
        exam_date: payload.examDate,
        answers: processedAnswers,
        correct_count: correctCount,
        wrong_count: wrongCount,
        empty_count: emptyCount,
        net_score: netScore,
        score: null, // Puan hesaplama kuralına göre doldurulabilir
        metadata: {},
        created_by: payload.createdBy,
      });
    } catch (err: any) {
      errors.push(`${entry.studentName}: ${err.message}`);
    }
  }

  // Toplu insert
  const { data, error } = await supabase
    .from('institution_external_exam_results')
    .insert(resultsToInsert)
    .select();

  if (error) {
    console.error('Error inserting bulk exam results:', error);
    throw error;
  }

  return {
    success: data?.length || 0,
    failed: errors.length,
    errors,
  };
}

/**
 * Harici sınav sonuçlarını getir (performans analizi için)
 */
export async function fetchExternalExamResults(
  institutionId: string,
  studentUserId?: string,
  dateRangeStart?: string,
  dateRangeEnd?: string
): Promise<ExternalExamResult[]> {
  let query = supabase
    .from('institution_external_exam_results')
    .select(`
      *,
      template:institution_external_exam_templates(*)
    `)
    .eq('institution_id', institutionId)
    .order('exam_date', { ascending: false });

  if (studentUserId) {
    query = query.eq('user_id', studentUserId);
  }

  if (dateRangeStart) {
    query = query.gte('exam_date', dateRangeStart);
  }

  if (dateRangeEnd) {
    query = query.lte('exam_date', dateRangeEnd);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching external exam results:', error);
    throw error;
  }

  return data || [];
}

/**
 * Harici sınav sonuçlarını silme
 */
export async function deleteExternalExamResult(resultId: string): Promise<void> {
  const { error } = await supabase
    .from('institution_external_exam_results')
    .delete()
    .eq('id', resultId);

  if (error) {
    console.error('Error deleting external exam result:', error);
    throw error;
  }
}

/**
 * POPÜLER YAYINEVI TEMPLATE'LERİ (Seed Data)
 */
export const POPULAR_EXAM_TEMPLATES: Omit<CreateExternalExamTemplatePayload, 'institutionId'>[] = [
  // TYT Örnekleri
  {
    name: 'TYT Matematik - 40 Soru',
    publisher: 'Genel',
    examType: 'TYT',
    totalQuestions: 40,
    questionMapping: [
      // Temel Matematik (20 soru)
      ...Array.from({ length: 20 }, (_, i) => ({
        questionNumber: i + 1,
        subject: 'Matematik',
        topic: i < 5 ? 'Sayılar' : i < 10 ? 'Cebirsel İfadeler' : i < 15 ? 'Denklemler' : 'Fonksiyonlar',
      })),
      // Geometri (20 soru)
      ...Array.from({ length: 20 }, (_, i) => ({
        questionNumber: i + 21,
        subject: 'Geometri',
        topic: i < 10 ? 'Üçgenler' : 'Çemberler',
      })),
    ],
    isPublic: true,
  },
  {
    name: 'TYT Türkçe - 40 Soru',
    publisher: 'Genel',
    examType: 'TYT',
    totalQuestions: 40,
    questionMapping: [
      ...Array.from({ length: 40 }, (_, i) => ({
        questionNumber: i + 1,
        subject: 'Türkçe',
        topic: i < 20 ? 'Sözcükte Anlam' : 'Cümlede Anlam',
      })),
    ],
    isPublic: true,
  },
  // AYT Örnekleri
  {
    name: 'AYT Matematik - 40 Soru',
    publisher: 'Genel',
    examType: 'AYT',
    totalQuestions: 40,
    questionMapping: [
      ...Array.from({ length: 40 }, (_, i) => ({
        questionNumber: i + 1,
        subject: 'Matematik',
        topic: i < 10 ? 'Limit' : i < 20 ? 'Türev' : i < 30 ? 'İntegral' : 'Olasılık',
      })),
    ],
    isPublic: true,
  },
  // LGS Örneği
  {
    name: 'LGS Matematik - 20 Soru',
    publisher: 'Genel',
    examType: 'LGS',
    totalQuestions: 20,
    questionMapping: [
      ...Array.from({ length: 20 }, (_, i) => ({
        questionNumber: i + 1,
        subject: 'Matematik',
        topic: i < 5 ? 'Sayılar' : i < 10 ? 'Cebirsel İfadeler' : i < 15 ? 'Geometri' : 'Veri Analizi',
      })),
    ],
    isPublic: true,
  },
];
