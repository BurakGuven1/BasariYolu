import { supabase } from './supabase';
import type { InstitutionExamResult } from './institutionStudentApi';
import type { InstitutionQuestion } from './institutionQuestionApi';

/**
 * Konu bazında performans analizi
 */
export interface TopicPerformance {
  subject: string;
  topic: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  successRate: number; // 0-100 arası
  averageTime?: number; // saniye cinsinden (gelecekte)
}

/**
 * Öğrenci kişisel performans özeti
 */
export interface StudentPerformanceCard {
  studentId: string;
  studentName: string;
  totalExams: number;
  averageScore: number;
  topicPerformances: TopicPerformance[];
  strongTopics: TopicPerformance[]; // En iyi 3 konu
  weakTopics: TopicPerformance[]; // En zayıf 3 konu
  recentTrend: 'improving' | 'stable' | 'declining';
  lastExamDate: string | null;
}

/**
 * Sınıf bazında performans
 */
export interface ClassPerformance {
  institutionId: string;
  totalStudents: number;
  averageScore: number;
  topicPerformances: TopicPerformance[];
  topStudents: Array<{ studentId: string; studentName: string; averageScore: number }>;
  strugglingStudents: Array<{ studentId: string; studentName: string; averageScore: number }>;
  commonWeakTopics: TopicPerformance[]; // Sınıf genelinde zayıf konular
}

/**
 * Bir öğrencinin sınav sonuçlarından konu bazlı performansını hesapla
 */
export async function analyzeStudentTopicPerformance(
  studentUserId: string,
  institutionId: string,
  dateRangeStart?: string,
  dateRangeEnd?: string
): Promise<TopicPerformance[]> {
  // 1. Öğrencinin tüm sınav sonuçlarını çek
  let query = supabase
    .from('institution_exam_results')
    .select('*')
    .eq('user_id', studentUserId)
    .eq('institution_id', institutionId)
    .order('completed_at', { ascending: false });

  if (dateRangeStart) {
    query = query.gte('completed_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    query = query.lte('completed_at', dateRangeEnd);
  }

  const { data: examResults, error: examError } = await query;

  if (examError) {
    console.error('Error fetching exam results:', examError);
    throw examError;
  }

  if (!examResults || examResults.length === 0) {
    return [];
  }

  // 2. Tüm benzersiz question_ids'leri topla
  const allQuestionIds = new Set<string>();
  examResults.forEach((result: any) => {
    const questionIds = result.question_ids || [];
    questionIds.forEach((id: string) => allQuestionIds.add(id));
  });

  // 3. Soruları çek (subject ve topic bilgisiyle)
  const { data: questions, error: questionsError } = await supabase
    .from('institution_questions')
    .select('id, subject, topic')
    .in('id', Array.from(allQuestionIds));

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
    throw questionsError;
  }

  // 4. Question ID -> {subject, topic} mapping oluştur
  const questionMap = new Map<string, { subject: string; topic: string }>();
  (questions || []).forEach((q: any) => {
    questionMap.set(q.id, { subject: q.subject, topic: q.topic });
  });

  // 5. Konu bazında performansı aggregate et
  const topicStats = new Map<string, {
    subject: string;
    topic: string;
    total: number;
    correct: number;
    wrong: number;
    empty: number;
  }>();

  examResults.forEach((result: any) => {
    const answers = result.answers || {};
    const questionIds = result.question_ids || [];

    questionIds.forEach((qId: string) => {
      const questionInfo = questionMap.get(qId);
      if (!questionInfo) return;

      const key = `${questionInfo.subject}|${questionInfo.topic}`;

      if (!topicStats.has(key)) {
        topicStats.set(key, {
          subject: questionInfo.subject,
          topic: questionInfo.topic,
          total: 0,
          correct: 0,
          wrong: 0,
          empty: 0,
        });
      }

      const stats = topicStats.get(key)!;
      stats.total++;

      const answer = answers[qId];
      if (!answer) {
        stats.empty++;
      } else if (answer.isCorrect) {
        stats.correct++;
      } else {
        stats.wrong++;
      }
    });
  });

  // 6. TopicPerformance array'e dönüştür
  const topicPerformances: TopicPerformance[] = Array.from(topicStats.values()).map((stats) => ({
    subject: stats.subject,
    topic: stats.topic,
    totalQuestions: stats.total,
    correctCount: stats.correct,
    wrongCount: stats.wrong,
    emptyCount: stats.empty,
    successRate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  // Başarı oranına göre sırala
  topicPerformances.sort((a, b) => a.successRate - b.successRate);

  return topicPerformances;
}

/**
 * Öğrenci için kapsamlı performans kartı oluştur
 */
export async function generateStudentPerformanceCard(
  studentUserId: string,
  institutionId: string,
  dateRangeStart?: string,
  dateRangeEnd?: string
): Promise<StudentPerformanceCard> {
  // Öğrenci bilgilerini çek
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', studentUserId)
    .single();

  // Öğrenci ID'sini çek
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', studentUserId)
    .single();

  // Sınav sonuçlarını çek
  let query = supabase
    .from('institution_exam_results')
    .select('score, completed_at')
    .eq('user_id', studentUserId)
    .eq('institution_id', institutionId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (dateRangeStart) {
    query = query.gte('completed_at', dateRangeStart);
  }
  if (dateRangeEnd) {
    query = query.lte('completed_at', dateRangeEnd);
  }

  const { data: examResults } = await query;

  const totalExams = examResults?.length || 0;
  const averageScore = totalExams > 0
    ? examResults!.reduce((sum, r) => sum + (r.score || 0), 0) / totalExams
    : 0;

  // Konu bazlı performans analizi
  const topicPerformances = await analyzeStudentTopicPerformance(
    studentUserId,
    institutionId,
    dateRangeStart,
    dateRangeEnd
  );

  // En iyi ve en zayıf konular
  const sortedBySuccess = [...topicPerformances].sort((a, b) => b.successRate - a.successRate);
  const strongTopics = sortedBySuccess.slice(0, 3);
  const weakTopics = sortedBySuccess.slice(-3).reverse();

  // Trend analizi (son 3 sınav)
  let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (examResults && examResults.length >= 3) {
    const recent3 = examResults.slice(0, 3).map(r => r.score || 0);
    const avg1 = recent3[0]; // En son
    const avg3 = (recent3[1] + recent3[2]) / 2; // Önceki ikisinin ortalaması

    if (avg1 > avg3 * 1.05) {
      recentTrend = 'improving';
    } else if (avg1 < avg3 * 0.95) {
      recentTrend = 'declining';
    }
  }

  const lastExamDate = examResults && examResults.length > 0
    ? examResults[0].completed_at
    : null;

  return {
    studentId: student?.id || '',
    studentName: profile?.full_name || 'Bilinmeyen',
    totalExams,
    averageScore: Math.round(averageScore * 100) / 100,
    topicPerformances,
    strongTopics,
    weakTopics,
    recentTrend,
    lastExamDate,
  };
}

/**
 * Tüm sınıf için performans analizi
 */
export async function analyzeClassPerformance(
  institutionId: string,
  dateRangeStart?: string,
  dateRangeEnd?: string
): Promise<ClassPerformance> {
  // Kuruma ait tüm öğrencileri çek
  const { data: students } = await supabase
    .from('institution_student_requests')
    .select('user_id, full_name')
    .eq('institution_id', institutionId)
    .eq('status', 'approved');

  if (!students || students.length === 0) {
    return {
      institutionId,
      totalStudents: 0,
      averageScore: 0,
      topicPerformances: [],
      topStudents: [],
      strugglingStudents: [],
      commonWeakTopics: [],
    };
  }

  // Her öğrenci için performans kartı oluştur
  const performanceCards = await Promise.all(
    students.map(s =>
      generateStudentPerformanceCard(s.user_id, institutionId, dateRangeStart, dateRangeEnd)
    )
  );

  // Sınıf ortalaması
  const totalStudents = performanceCards.length;
  const averageScore = performanceCards.reduce((sum, card) => sum + card.averageScore, 0) / totalStudents;

  // Tüm konuları birleştir ve ortalamasını al
  const allTopicStats = new Map<string, {
    subject: string;
    topic: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
  }>();

  performanceCards.forEach(card => {
    card.topicPerformances.forEach(tp => {
      const key = `${tp.subject}|${tp.topic}`;
      if (!allTopicStats.has(key)) {
        allTopicStats.set(key, {
          subject: tp.subject,
          topic: tp.topic,
          totalQuestions: 0,
          correctCount: 0,
          wrongCount: 0,
          emptyCount: 0,
        });
      }

      const stats = allTopicStats.get(key)!;
      stats.totalQuestions += tp.totalQuestions;
      stats.correctCount += tp.correctCount;
      stats.wrongCount += tp.wrongCount;
      stats.emptyCount += tp.emptyCount;
    });
  });

  const topicPerformances: TopicPerformance[] = Array.from(allTopicStats.values()).map(stats => ({
    subject: stats.subject,
    topic: stats.topic,
    totalQuestions: stats.totalQuestions,
    correctCount: stats.correctCount,
    wrongCount: stats.wrongCount,
    emptyCount: stats.emptyCount,
    successRate: stats.totalQuestions > 0
      ? Math.round((stats.correctCount / stats.totalQuestions) * 100)
      : 0,
  }));

  // En iyi ve en zayıf öğrenciler
  const sortedStudents = [...performanceCards].sort((a, b) => b.averageScore - a.averageScore);
  const topStudents = sortedStudents.slice(0, 5).map(card => ({
    studentId: card.studentId,
    studentName: card.studentName,
    averageScore: card.averageScore,
  }));
  const strugglingStudents = sortedStudents.slice(-5).reverse().map(card => ({
    studentId: card.studentId,
    studentName: card.studentName,
    averageScore: card.averageScore,
  }));

  // Sınıf genelinde zayıf konular
  const sortedTopics = [...topicPerformances].sort((a, b) => a.successRate - b.successRate);
  const commonWeakTopics = sortedTopics.slice(0, 5);

  return {
    institutionId,
    totalStudents,
    averageScore: Math.round(averageScore * 100) / 100,
    topicPerformances,
    topStudents,
    strugglingStudents,
    commonWeakTopics,
  };
}
