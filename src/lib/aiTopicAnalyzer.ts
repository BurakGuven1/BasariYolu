import { supabase } from './supabase';
import { examData } from '../components/ExamTopicsSection';

export interface WeakTopic {
  subject: string;
  topic: string;
  wrongCount: number;
  totalCount: number;
}

interface TopicRecommendation {
  subject: string;
  topic: string;
  weaknessScore: number; // 0-100
  frequencyScore: number; // 0-100
  priorityScore: number; // 0-10000
  studyHoursNeeded: number;
  recommendation: string;
  resources: any[];
}

/**
 * Konunun son 8 yılda kaç kez çıktığını hesapla
 */
const calculateFrequencyScore = (subject: string, topic: string): number => {
  const subjectData = examData[subject];
  if (!subjectData) return 0;

  const topicData = subjectData.konular.find((k) => k.konu === topic);
  if (!topicData) return 0;

  // ✅ LGS için 2023-2025 (3 yıl), TYT/AYT için 2018-2025 (8 yıl)
  const isLGS = subject.startsWith('LGS');
  const years = isLGS 
    ? ['2023', '2024', '2025']
    : ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
  
  const totalQuestions = years.reduce((sum, year) => sum + (topicData.yillar[year] || 0), 0);
  const avgPerYear = totalQuestions / years.length;

  // Normalize et (0-100)
  const score = Math.min((avgPerYear / 5) * 100, 100);
  return parseFloat(score.toFixed(2));
};
/**
 * Öğrencinin bu konudaki zayıflığını hesapla
 */
const calculateWeaknessScore = async (
  studentId: string,
  subject: string,
  topic: string
): Promise<number> => {
  try {
    // Son 10 denemede bu konu kaç kez işaretlenmiş
    const { data: weakTopics } = await supabase
      .from('exam_weak_topics')
      .select('wrong_count, total_count')
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('topic', topic)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!weakTopics || weakTopics.length === 0) return 0;

    // Ortalama yanlış yüzdesi
    let totalWrong = 0;
    let totalQuestions = 0;

    weakTopics.forEach((wt) => {
      totalWrong += wt.wrong_count;
      totalQuestions += wt.total_count;
    });

    if (totalQuestions === 0) return 0;

    const wrongPercentage = (totalWrong / totalQuestions) * 100;
    return parseFloat(wrongPercentage.toFixed(2));
  } catch (error) {
    console.error('Error calculating weakness:', error);
    return 0;
  }
};

/**
 * Konu için öneriler oluştur
 */
export const generateTopicRecommendations = async (
  studentId: string,
  weakTopics: WeakTopic[]
): Promise<TopicRecommendation[]> => {
  const recommendations: TopicRecommendation[] = [];

  for (const wt of weakTopics) {
    const weaknessScore = (wt.wrongCount / wt.totalCount) * 100;
    const frequencyScore = calculateFrequencyScore(wt.subject, wt.topic); // ✅ ZATEN SYNC
    const priorityScore = weaknessScore * frequencyScore;

    const studyHours = calculateStudyHours(weaknessScore, frequencyScore);
    const recommendation = generateRecommendationText(
      wt.topic,
      weaknessScore,
      frequencyScore
    );

    recommendations.push({
      subject: wt.subject,
      topic: wt.topic,
      weaknessScore: parseFloat(weaknessScore.toFixed(2)),
      frequencyScore,
      priorityScore: parseFloat(priorityScore.toFixed(2)),
      studyHoursNeeded: studyHours,
      recommendation,
      resources: getTopicResources(wt.subject, wt.topic)
    });
  }

  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
};

/**
 * Çalışma saati tahmini
 */
const calculateStudyHours = (weakness: number, frequency: number): number => {
  // Zayıflık yüksek + Sıklık yüksek = Daha fazla saat
  const baseHours = weakness / 10; // %100 zayıf = 10 saat
  const frequencyMultiplier = 1 + (frequency / 100);
  const hours = baseHours * frequencyMultiplier;
  return parseFloat(Math.min(hours, 20).toFixed(1)); // Max 20 saat
};

/**
 * Öneri metni oluştur
 */
const generateRecommendationText = (
  topic: string,
  weakness: number,
  frequency: number
): string => {
  if (weakness > 70 && frequency > 70) {
    return `🔥 ACIL! "${topic}" konusu hem çok sık çıkıyor hem de sizin en zayıf olduğunuz konulardan. Bu konuya hemen odaklanın!`;
  } else if (weakness > 70) {
    return `⚠️ "${topic}" konusunda %${weakness.toFixed(0)} oranında yanlış yapıyorsunuz. Bu konuyu mutlaka çalışmalısınız.`;
  } else if (frequency > 70) {
    return `⭐ "${topic}" sınavlarda çok sık çıkıyor (ortalama ${(frequency / 12.5).toFixed(1)} soru/yıl). Bu konuyu pekiştirin.`;
  } else if (weakness > 50) {
    return `📌 "${topic}" konusunda orta seviye bir zayıflığınız var. Birkaç günlük çalışma ile geliştirebilirsiniz.`;
  } else {
    return `✅ "${topic}" konusunda iyisiniz ama tekrar yapmakta fayda var.`;
  }
};

/**
 * Konu için kaynak önerileri
 */
const getTopicResources = (subject: string, topic: string) => {
  return [
    {
      type: 'video',
      title: `${topic} - Video Anlatım`,
      description: 'Konu anlatım videosu',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subject + ' ' + topic + ' konu anlatımı')}`
    },
    {
      type: 'practice',
      title: `${topic} - Soru Bankası`,
      description: 'Pratik soru çözümü',
      platform: 'Recommended'
    },
    {
      type: 'notes',
      title: `${topic} - Konu Özeti`,
      description: 'PDF konu özeti',
    }
  ];
};

/**
 * Önerileri veritabanına kaydet
 */
export const saveTopicRecommendations = async (
  studentId: string,
  recommendations: TopicRecommendation[]
) => {
  try {
    const inserts = recommendations.map((rec) => ({
      student_id: studentId,
      subject: rec.subject,
      topic: rec.topic,
      weakness_score: rec.weaknessScore,
      frequency_score: rec.frequencyScore,
      priority_score: rec.priorityScore,
      recommendation_text: rec.recommendation,
      study_hours_needed: rec.studyHoursNeeded,
      resources: rec.resources,
      status: 'active'
    }));

    const { error } = await supabase
      .from('topic_recommendations')
      .upsert(inserts, {
        onConflict: 'student_id,subject,topic',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving recommendations:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Öğrencinin tüm önerilerini getir
 */
export const getStudentRecommendations = async (studentId: string) => {
  const { data, error } = await supabase
    .from('topic_recommendations')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }

  return data || [];
};