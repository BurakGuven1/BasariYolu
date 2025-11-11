// AI Analysis Service
// Bu dosya yapay zeka analizleri için gerekli fonksiyonları içerir

// Minimum deneme sayısı kontrolü
const MIN_EXAMS_FOR_ANALYSIS = 2;

interface ExamAnalysis {
  weaknesses: string[];
  strengths: string[];
  recommendations: string[];
  studyPlan: StudyPlanItem[];
  trends: TrendAnalysis[];
  emptyAnswerWarnings: string[];
  hasEnoughData: boolean;
  totalExams: number;
}

interface StudyPlanItem {
  subject: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  description: string;
}

interface TrendAnalysis {
  subject: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  message: string;
}

interface TopicPerformance {
  topic: string;
  subject: string;
  successRate: number;
  totalQuestions: number;
  correctAnswers: number;
}

// Gelişmiş AI Analysis - Son 5 denemeyi analiz eder
export const analyzeExamResults = async (examResults: any[]): Promise<ExamAnalysis> => {
  const analysis: ExamAnalysis = {
    weaknesses: [],
    strengths: [],
    recommendations: [],
    studyPlan: [],
    trends: [],
    emptyAnswerWarnings: [],
    hasEnoughData: false,
    totalExams: examResults.length
  };

  // Minimum deneme sayısı kontrolü
  if (examResults.length < MIN_EXAMS_FOR_ANALYSIS) {
    analysis.recommendations.push(
      `AI analizi için en az ${MIN_EXAMS_FOR_ANALYSIS} deneme sonucu gereklidir. Şu anda ${examResults.length} deneme var.`
    );
    return analysis;
  }

  analysis.hasEnoughData = true;

  // Son 5 denemeyi al ve tarihe göre sırala
  const recentExams = examResults
    .filter(exam => exam.total_score != null && exam.exam_date) // Geçersiz verileri filtrele
    .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())
    .slice(0, 5);

  if (recentExams.length < MIN_EXAMS_FOR_ANALYSIS) {
    analysis.hasEnoughData = false;
    analysis.recommendations.push(
      `Geçerli deneme sonucu sayısı yetersiz. En az ${MIN_EXAMS_FOR_ANALYSIS} geçerli deneme gerekli.`
    );
    return analysis;
  }

  // Trend analizi yap
  const trends = analyzeTrends(recentExams);
  analysis.trends = trends;

  // Boş bırakma analizi
  const emptyAnswerAnalysis = analyzeEmptyAnswers(recentExams);
  analysis.emptyAnswerWarnings = emptyAnswerAnalysis;

  // Genel performans analizi
  const subjectAverages = calculateDetailedSubjectAverages(recentExams);
  
  // Zayıflıkları tespit et - daha tutarlı kriterler
  Object.entries(subjectAverages).forEach(([subject, data]: [string, any]) => {
    const avgNet = data.average;
    const examType = recentExams[0]?.exam_type || 'TYT';
    
    // Sınav türüne göre zayıflık kriterleri
    let weaknessThreshold = 8; // TYT için varsayılan
    if (examType === 'LGS') {
      weaknessThreshold = 6; // LGS için daha düşük
    } else if (examType === 'AYT') {
      weaknessThreshold = 10; // AYT için daha yüksek
    }
    
    if (avgNet < weaknessThreshold) {
      analysis.weaknesses.push(`${subject}: Ortalama ${avgNet.toFixed(1)} net - Temel konularda eksiklik var`);
      analysis.studyPlan.push({
        subject,
        topic: 'Temel Konular',
        priority: 'high',
        estimatedHours: Math.max(10, Math.round((weaknessThreshold - avgNet) * 2)),
        description: `${subject} temel konularını güçlendirin. Hedef: ${weaknessThreshold}+ net`
      });
    } else if (data.trend === 'decreasing' && Math.abs(data.change) > 1.5) {
      analysis.weaknesses.push(`${subject}: Son denemelerinizde ${Math.abs(data.change).toFixed(1)} net düşüş var`);
      analysis.recommendations.push(`${subject} konusunda performans düşüşü tespit edildi. Çalışma yöntemini gözden geçirin.`);
      analysis.studyPlan.push({
        subject,
        topic: 'Performans Düzeltme',
        priority: 'medium',
        estimatedHours: 7,
        description: `${subject} dersindeki düşüşü durdurmak için tekrar ve pekiştirme çalışması yapın.`
      });
    }
  });

  // Güçlü yönleri tespit et - daha tutarlı kriterler
  Object.entries(subjectAverages).forEach(([subject, data]: [string, any]) => {
    const avgNet = data.average;
    const examType = recentExams[0]?.exam_type || 'TYT';
    
    // Sınav türüne göre güçlü performans kriterleri
    let strengthThreshold = 15; // TYT için varsayılan
    if (examType === 'LGS') {
      strengthThreshold = 12; // LGS için daha düşük
    } else if (examType === 'AYT') {
      strengthThreshold = 18; // AYT için daha yüksek
    }
    
    if (avgNet > strengthThreshold) {
      analysis.strengths.push(`${subject}: Güçlü performans (Ortalama ${avgNet.toFixed(1)} net)`);
      if (data.trend === 'increasing' && data.change > 1) {
        analysis.recommendations.push(`${subject} konusunda mükemmel bir yükseliş var (+${data.change.toFixed(1)} net)! Bu tempoyu koruyun.`);
      } else if (data.trend === 'stable') {
        analysis.recommendations.push(`${subject} konusunda istikrarlı yüksek performans gösteriyorsunuz. Bu seviyeyi koruyun.`);
      }
    }
  });

  // Genel trend analizi ve öneriler
  if (recentExams.length >= 3) {
    const overallTrend = calculateOverallTrend(recentExams);
    const avgScore = recentExams.reduce((sum, exam) => sum + (exam.total_score || 0), 0) / recentExams.length;
    
    if (overallTrend > 10) {
      analysis.recommendations.push(`Genel performansınız harika yükselişte! (+${overallTrend.toFixed(1)} puan) Bu çalışma temposunu koruyun.`);
    } else if (overallTrend < -10) {
      analysis.recommendations.push(`Son denemelerinizde genel düşüş var (${overallTrend.toFixed(1)} puan). Çalışma programınızı gözden geçirin.`);
      analysis.studyPlan.push({
        subject: 'Genel',
        topic: 'Çalışma Stratejisi',
        priority: 'high',
        estimatedHours: 15,
        description: 'Çalışma yönteminizi değiştirin. Zayıf konulara odaklanın ve düzenli tekrar yapın.'
      });
    } else {
      analysis.recommendations.push(`Performansınız stabil (Ortalama: ${avgScore.toFixed(1)} puan). Hedeflerinize göre çalışma planınızı optimize edebilirsiniz.`);
    }
  }

  // Boş bırakma uyarıları için öneriler ekle
  if (analysis.emptyAnswerWarnings.length > 0) {
    analysis.recommendations.push('Çok fazla soru boş bırakıyorsunuz. Tahmin stratejisi geliştirin ve zaman yönetimini iyileştirin.');
    analysis.studyPlan.push({
      subject: 'Genel',
      topic: 'Sınav Stratejisi',
      priority: 'medium',
      estimatedHours: 5,
      description: 'Sınav tekniği,zaman yönetimi ve en çok çıkmış konuların çalışmasını yapın.'
    });
  }

  return analysis;
};

// Trend analizi - daha tutarlı hesaplama
const analyzeTrends = (exams: any[]): TrendAnalysis[] => {
  if (exams.length < MIN_EXAMS_FOR_ANALYSIS) return [];

  const trends: TrendAnalysis[] = [];
  
  // Sınav türüne göre konuları belirle
  const examType = exams[0]?.exam_type || 'TYT';
  let subjects: string[] = [];
  
  if (examType === 'LGS') {
    subjects = ['Türkçe', 'Matematik', 'Fen', 'İnkılap', 'İngilizce', 'Din'];
  } else {
    subjects = ['Türkçe', 'Matematik', 'Fen', 'Sosyal'];
  }

  subjects.forEach(subject => {
    const nets = exams.map(exam => getSubjectNet(exam, subject)).filter(net => net !== null);
    
    if (nets.length >= MIN_EXAMS_FOR_ANALYSIS) {
      const halfPoint = Math.floor(nets.length / 2);
      const recent = nets.slice(0, halfPoint); // Son yarısı
      const older = nets.slice(halfPoint); // İlk yarısı
      
      const recentAvg = recent.reduce((sum, net) => sum + net, 0) / recent.length;
      const olderAvg = older.reduce((sum, net) => sum + net, 0) / older.length;
      
      const change = recentAvg - olderAvg;
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      let message = '';
      
      // Daha hassas trend belirleme
      if (change > 1.5) {
        trend = 'increasing';
        message = `${subject} konusunda son denemelerinizde ${change.toFixed(1)} net artış var! 📈`;
      } else if (change < -1.5) {
        trend = 'decreasing';
        message = `${subject} konusunda son denemelerinizde ${Math.abs(change).toFixed(1)} net düşüş var ⚠️`;
      } else {
        message = `${subject} konusunda performansınız stabil (${recentAvg.toFixed(1)} net ortalama)`;
      }
      
      trends.push({
        subject,
        trend,
        change,
        message
      });
    }
  });

  return trends;
};

// Boş bırakma analizi
const analyzeEmptyAnswers = (exams: any[]): string[] => {
  const warnings: string[] = [];
  const emptyStats: Record<string, { total: number, empty: number }> = {};
  
  exams.forEach(exam => {
    if (exam.exam_details) {
      const details = JSON.parse(exam.exam_details);
      
      // Sınav türüne göre konuları belirle
      const examType = exam.exam_type || 'TYT';
      let subjects: string[] = [];
      
      if (examType === 'LGS') {
        subjects = ['Türkçe', 'Matematik', 'Fen', 'İnkılap', 'İngilizce', 'Din'];
      } else {
        subjects = ['Türkçe', 'Matematik', 'Fen', 'Sosyal'];
      }
      
      subjects.forEach(subject => {
        const { correct, wrong, total } = getSubjectStats(details, subject, examType);
        const empty = total - correct - wrong;
        
        // İstatistik topla
        if (!emptyStats[subject]) {
          emptyStats[subject] = { total: 0, empty: 0 };
        }
        emptyStats[subject].total += total;
        emptyStats[subject].empty += empty;
      });
    }
  });

  // Genel boş bırakma analizi
  Object.entries(emptyStats).forEach(([subject, stats]) => {
    const emptyPercentage = (stats.empty / stats.total) * 100;
    
    if (emptyPercentage > 25) { // %25'ten fazla boş
      warnings.push(`${subject}: Ortalama %${emptyPercentage.toFixed(0)} soru boş bırakıyorsunuz. Bu konularda eksikleriniz var.`);
    } else if (emptyPercentage > 15) { // %15-25 arası
      warnings.push(`${subject}: %${emptyPercentage.toFixed(0)} soru boş bırakıyorsunuz. Zaman yönetimini iyileştirin.`);
    }
  });

  return warnings;
};

// Detaylı konu analizi - LGS desteği eklendi
const getSubjectStats = (details: any, subject: string, examType: string) => {
  let correct = 0, wrong = 0, total = 0;
  
  if (examType === 'TYT' || examType === 'AYT') {
    switch (subject) {
      case 'Türkçe':
        correct = parseInt(details.tyt_turkce_dogru || 0);
        wrong = parseInt(details.tyt_turkce_yanlis || 0);
        total = 40;
        break;
      case 'Matematik':
        if (examType === 'AYT' && details.ayt_matematik_dogru) {
          correct = parseInt(details.ayt_matematik_dogru || 0);
          wrong = parseInt(details.ayt_matematik_yanlis || 0);
          total = 40;
        } else {
          correct = parseInt(details.tyt_matematik_dogru || 0);
          wrong = parseInt(details.tyt_matematik_yanlis || 0);
          total = 40;
        }
        break;
      case 'Fen':
        if (examType === 'AYT') {
          const fizik_d = parseInt(details.ayt_fizik_dogru || 0);
          const fizik_y = parseInt(details.ayt_fizik_yanlis || 0);
          const kimya_d = parseInt(details.ayt_kimya_dogru || 0);
          const kimya_y = parseInt(details.ayt_kimya_yanlis || 0);
          const biyoloji_d = parseInt(details.ayt_biyoloji_dogru || 0);
          const biyoloji_y = parseInt(details.ayt_biyoloji_yanlis || 0);
          correct = fizik_d + kimya_d + biyoloji_d;
          wrong = fizik_y + kimya_y + biyoloji_y;
          total = 40;
        } else {
          correct = parseInt(details.tyt_fen_dogru || 0);
          wrong = parseInt(details.tyt_fen_yanlis || 0);
          total = 20;
        }
        break;
      case 'Sosyal':
        correct = parseInt(details.tyt_sosyal_dogru || 0);
        wrong = parseInt(details.tyt_sosyal_yanlis || 0);
        total = 20;
        break;
    }
  } else if (examType === 'LGS') {
    switch (subject) {
      case 'Türkçe':
        correct = parseInt(details.lgs_turkce_dogru || 0);
        wrong = parseInt(details.lgs_turkce_yanlis || 0);
        total = 20;
        break;
      case 'Matematik':
        correct = parseInt(details.lgs_matematik_dogru || 0);
        wrong = parseInt(details.lgs_matematik_yanlis || 0);
        total = 20;
        break;
      case 'Fen':
        correct = parseInt(details.lgs_fen_dogru || 0);
        wrong = parseInt(details.lgs_fen_yanlis || 0);
        total = 20;
        break;
      case 'İnkılap':
        correct = parseInt(details.lgs_inkılap_dogru || 0);
        wrong = parseInt(details.lgs_inkılap_yanlis || 0);
        total = 10;
        break;
      case 'İngilizce':
        correct = parseInt(details.lgs_ingilizce_dogru || 0);
        wrong = parseInt(details.lgs_ingilizce_yanlis || 0);
        total = 10;
        break;
      case 'Din':
        correct = parseInt(details.lgs_din_dogru || 0);
        wrong = parseInt(details.lgs_din_yanlis || 0);
        total = 10;
        break;
    }
  }
  
  return { correct, wrong, total };
};

// Konu bazında net hesaplama
const getSubjectNet = (exam: any, subject: string): number | null => {
  if (!exam.exam_details) return null;
  
  const details = JSON.parse(exam.exam_details);
  const { correct, wrong } = getSubjectStats(details, subject, exam.exam_type);
  
  return Math.max(0, correct - (wrong / 4));
};

export const generateMotivationalMessage = (studentData: any): string => {
  // Contextual messages based on student performance
  const performanceLevel = calculatePerformanceLevel(studentData);
  
  const messagesByLevel = {
    excellent: [
      'Harika gidiyorsun! Bu performansı sürdür! 🏆',
      'Muhteşem bir başarı gösteriyorsun! Devam et! ⭐',
      'Sen bir yıldızsın! Potansiyelin sınırsız! 🌟',
      'Bu başarı senin emeğinin ödülü! Gurur duyuyoruz! 💫',
      'Lider gibi ilerliyorsun! İlham veriyorsun! 👑'
    ],
    good: [
      'Çok iyi ilerliyorsun! Hedefine yaklaşıyorsun! 🎯',
      'Güzel bir grafik çiziyorsun! Böyle devam! 📈',
      'Emeklerin karşılığını alıyorsun! Bravo! 👏',
      'Bu tempo ile başarı kaçınılmaz! 🚀',
      'Her gün biraz daha iyisin! Fark edilir mi? ✨'
    ],
    needsWork: [
      'Bugün dün yapamadığın bir şeyi yapabilirsin! 💪',
      'Her çalıştığın dakika seni hedefe bir adım daha yaklaştırıyor! 🎯',
      'Başarı, küçük çabaların günlük tekrarıdır. Devam et! ⭐',
      'Her zorluk, seni daha güçlü yapıyor. Sen yapabilirsin! 🔥',
      'Düşmek yok, kalkmak var! Hadi yeniden başla! 💫'
    ],
    struggling: [
      'Zor zamanlar geçici, başarı kalıcıdır! 🌈',
      'Her usta bir zamanlar acemiydi. Sen de öğreniyorsun! 📚',
      'Bugün zorlanıyorsan, yarın daha güçlü olacaksın! 💪',
      'Başarısızlık değil, öğrenme fırsatı! Pes etme! 🎓',
      'En karanlık gece bile sabaha çıkar. Devam et! 🌅'
    ],
    newStart: [
      'Yeni bir başlangıç, yeni bir umut! Haydi! 🎉',
      'Bugün, geleceğini şekillendirme günü! 🚀',
      'Her büyük yolculuk ilk adımla başlar! 👣',
      'Hazırsın! Şimdi zamanı! 💫',
      'Senin dönemin başlıyor! Hazır mısın? ⚡'
    ]
  };

  // Time-based messages
  const hour = new Date().getHours();
  const timeMessages = {
    morning: [
      'Günaydın! Bugün harika bir gün olacak! ☀️',
      'Sabah erken kalkan yol alır! Hadi başlayalım! 🌅',
      'Yeni bir gün, yeni fırsatlar! 🌞'
    ],
    afternoon: [
      'Öğlen enerjini topla! İkinci yarı senin! ⚡',
      'Günün yarısı geçti, momentum kaybetme! 🔥',
      'Ara ver ama pes etme! Devam! 💪'
    ],
    evening: [
      'Akşam çalışmaları en verimli! Fırsatı kaçırma! 🌙',
      'Gece sessizliği, konsantrasyonun dostu! 📚',
      'Son bir gayret daha! Yarın kendine teşekkür edeceksin! ⭐'
    ],
    night: [
      'Gece geç oldu, dinlenmeyi unutma! 😴',
      'Yarın için enerji topla! İyi geceler! 🌜',
      'Başarı için istirahat de önemli! 💤'
    ]
  };

  // Combine contextual and time-based
  let selectedMessages = messagesByLevel[performanceLevel] || messagesByLevel.newStart;
  
  // Add time-specific message if it's extreme hours
  if (hour >= 6 && hour < 12) {
    selectedMessages = [...selectedMessages, ...timeMessages.morning];
  } else if (hour >= 22 || hour < 6) {
    selectedMessages = [...selectedMessages, ...timeMessages.night];
  }

  return selectedMessages[Math.floor(Math.random() * selectedMessages.length)];
};

// Helper function to determine performance level
const calculatePerformanceLevel = (studentData: any): 'excellent' | 'good' | 'needsWork' | 'struggling' | 'newStart' => {
  if (!studentData?.exam_results || studentData.exam_results.length === 0) {
    return 'newStart';
  }

  const recentExams = studentData.exam_results.slice(-5);
  const avgScore = recentExams.reduce((sum: number, exam: any) => sum + (exam.total_score || 0), 0) / recentExams.length;

  if (avgScore >= 400) return 'excellent';
  if (avgScore >= 300) return 'good';
  if (avgScore >= 200) return 'needsWork';
  return 'struggling';
};

// Helper functions
const calculateDetailedSubjectAverages = (examResults: any[]): Record<string, any> => {
  // Sınav türüne göre konuları belirle
  let subjects: string[] = [];
  
  if (examResults.length > 0) {
    const firstExamType = examResults[0].exam_type;
    if (firstExamType === 'LGS') {
      subjects = ['Türkçe', 'Matematik', 'Fen', 'İnkılap', 'İngilizce', 'Din'];
    } else {
      subjects = ['Türkçe', 'Matematik', 'Fen', 'Sosyal'];
    }
  }
  
  const averages: Record<string, any> = {};
  
  subjects.forEach(subject => {
    const nets = examResults.map(exam => getSubjectNet(exam, subject)).filter(net => net !== null);
    
    if (nets.length > 0) {
      const average = nets.reduce((sum, net) => sum + net, 0) / nets.length;
      
      // Daha tutarlı trend hesaplama
      let trend = 'stable';
      let change = 0;
      
      if (nets.length >= MIN_EXAMS_FOR_ANALYSIS) {
        const halfPoint = Math.floor(nets.length / 2);
        const recent = nets.slice(0, halfPoint);
        const older = nets.slice(halfPoint);
        
        const recentAvg = recent.reduce((sum, net) => sum + net, 0) / recent.length;
        const olderAvg = older.reduce((sum, net) => sum + net, 0) / older.length;

        change = recentAvg - olderAvg;
        
        if (change > 1) trend = 'increasing';
        else if (change < -1) trend = 'decreasing';
      }
      
      averages[subject] = { average, trend, change };
    }
  });
  
  return averages;
};

const calculateOverallTrend = (examResults: any[]): number => {
  if (examResults.length < MIN_EXAMS_FOR_ANALYSIS) return 0;
  
  const scores = examResults.map(exam => exam.total_score || 0);
  
  const halfPoint = Math.floor(scores.length / 2);
  const recent = scores.slice(0, halfPoint);
  const older = scores.slice(halfPoint);
  
  const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
  const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
  
  return recentAvg - olderAvg;
};

export const detectTopicWeaknesses = (topicScores: TopicPerformance[]): string[] => {
  const weaknesses: string[] = [];
  
  topicScores.forEach(topic => {
    if (topic.successRate < 50) {
      weaknesses.push(`${topic.subject} - ${topic.topic}: %${topic.successRate.toFixed(0)} başarı`);
    }
  });
  
  return weaknesses;
};



export const generateStudyRecommendations = (weaknesses: string[]): string[] => {
  const recommendations: string[] = [];
  
  weaknesses.forEach(weakness => {
    if (weakness.includes('Matematik')) {
      recommendations.push('Matematik için günlük 1 saat problem çözümü yapın');
    } else if (weakness.includes('Fen')) {
      recommendations.push('Fen konularında kavramsal öğrenmeye odaklanın');
    } else if (weakness.includes('Türkçe')) {
      recommendations.push('Türkçe için günlük okuma alışkanlığı edinin');
    }
  });
  
  return recommendations;
};

// ============================================
// SMART STUDY RECOMMENDATIONS
// ============================================

export const generateSmartStudyPlan = (studentData: any) => {
  const weakTopics = analyzeWeakTopics(studentData.exam_results || []);
  const studyHours = calculateStudyHours(studentData);
  
  return {
    priority: 'high',
    focusAreas: weakTopics.slice(0, 3),
    dailyGoal: `${Math.ceil(studyHours)} saat odaklanmış çalışma`,
    weeklyTarget: generateWeeklyTargets(weakTopics, studyHours),
    tips: generateStudyTips(weakTopics),
    motivation: generateMotivationalMessage(studentData)
  };
};

const analyzeWeakTopics = (examResults: any[]) => {
  // Group by subject and find lowest performers
  const subjectScores: Record<string, number[]> = {};
  
  examResults.forEach(exam => {
    if (exam.subject_scores) {
      Object.entries(exam.subject_scores).forEach(([subject, score]) => {
        if (!subjectScores[subject]) subjectScores[subject] = [];
        subjectScores[subject].push(score as number);
      });
    }
  });

  const weakTopics = Object.entries(subjectScores)
    .map(([subject, scores]) => ({
      subject,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      trend: calculateTrend(scores)
    }))
    .sort((a, b) => a.avgScore - b.avgScore);

  return weakTopics;
};

const calculateStudyHours = (studentData: any) => {
  const currentScore = studentData.latest_exam_score || 0;
  const targetScore = studentData.target_score || 500;
  const daysUntilExam = calculateDaysUntilExam(studentData.target_exam_date);
  
  const scoreGap = targetScore - currentScore;
  
  let hoursNeeded = 3;
  
  if (scoreGap > 200) {
    hoursNeeded = 5;
  } else if (scoreGap > 100) {
    hoursNeeded = 4;
  } else if (scoreGap > 50) {
    hoursNeeded = 3.5;
  }
  
  if (daysUntilExam < 30 && daysUntilExam > 0) {
    hoursNeeded = Math.min(hoursNeeded + 1, 6);
  }
  
  return Math.min(hoursNeeded, 6);
};

const calculateTrend = (scores: number[]) => {
  if (scores.length < 2) return 'stable';
  const recent = scores.slice(-3);
  const older = scores.slice(0, -3);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / (older.length || 1);
  
  if (recentAvg > olderAvg + 5) return 'improving';
  if (recentAvg < olderAvg - 5) return 'declining';
  return 'stable';
};

const calculateDaysUntilExam = (examDate: string | null) => {
  if (!examDate) return 365;
  const today = new Date();
  const target = new Date(examDate);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const generateWeeklyTargets = (weakTopics: any[], studyHours: number) => {
  return weakTopics.slice(0, 3).map(topic => ({
    subject: topic.subject,
    hoursPerWeek: Math.ceil(studyHours * 0.4), // 40% of daily time
    specificGoals: [
      `${topic.subject} konusunda 10 soru çöz`,
      `Zayıf konuları tekrar et`,
      `Deneme sınavında +5 net hedefle`
    ]
  }));
};

const generateStudyTips = (weakTopics: any[]) => {
  const tipsBySubject: Record<string, string[]> = {
    'Matematik': [
      '📐 Formülleri ezberle değil, mantığını anla',
      '🧮 Her gün en az 20 soru çöz',
      '📝 Yanlış sorularını not defterine yaz,Öğretmenine sormaktan çekinme',
      '🎯 Önce kolay sorularla başla, sonra zorlaş'
    ],
    'Türkçe': [
      '📚 Her gün 1 paragraf oku ve analiz et. (40 sorunun 26 sorusu paragraftan gelecek⚠️)',
      '✍️ Sözcük dağarcığını genişlet',
      '🎭 Anlatım türlerini iyi öğren',
      '📖 Noktalama kurallarını pekiştir'
    ],
    'Fizik': [
      '🔬 Deneyleri görselleştir',
      '📊 Grafik sorularına odaklan',
      '⚡ Formül türetmeyi öğren',
      '🎯 Birim çevirmeleri dikkatli yap'
    ],
    'Kimya': [
      '⚗️ Periyodik tabloyu ezberle',
      '🧪 Tepkime denklemlerini denkleştir',
      '📈 Mol kavramını iyice öğren',
      '🎨 Renk değişimlerini not al'
    ],
    'Biyoloji': [
      '🧬 DNA-RNA farkını iyi öğren',
      '🔬 Hücre organellerini görselleştir',
      '🌱 Fotosentez-solunum karşılaştır',
      '📊 Tablo ve şema çalış'
    ]
  };

  const tips: string[] = [];
  weakTopics.forEach(topic => {
    const subjectTips = tipsBySubject[topic.subject] || [
      '📚 Düzenli çalış',
      '🎯 Hedef belirle',
      '💪 Pes etme'
    ];
    tips.push(...subjectTips.slice(0, 2));
  });

  return tips.slice(0, 5);
};

// ============================================
// PERFORMANCE INSIGHTS
// ============================================

export const generatePerformanceInsights = (studentData: any) => {
  const insights = [];

  // Trend analysis
  if (studentData.exam_results && studentData.exam_results.length >= 3) {
    const recent = studentData.exam_results.slice(-3);
    const scores = recent.map((e: any) => e.total_score);
    const trend = calculateTrend(scores);

    if (trend === 'improving') {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Harika İlerleme!',
        message: 'Son 3 denemedeki performansın sürekli yükseliyor! Bu temponu koru.',
        action: 'Mevcut çalışma planını sürdür'
      });
    } else if (trend === 'declining') {
      insights.push({
        type: 'warning',
        icon: '📉',
        title: 'Dikkat: Düşüş Var',
        message: 'Son performansında düşüş gözlemleniyor. Çalışma stratejini gözden geçir.',
        action: 'Öğretmeninle görüş'
      });
    }
  }

  // Study consistency
  const studySessions = studentData.study_sessions || [];
  const recentSessions = studySessions.filter((s: any) => {
    const date = new Date(s.session_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });

  if (recentSessions.length >= 5) {
    insights.push({
      type: 'success',
      icon: '🔥',
      title: 'Süper Disiplin!',
      message: `Bu hafta ${recentSessions.length} gün çalıştın! Tutarlılık anahtardır.`,
      action: 'Streaki kırma!'
    });
  } else if (recentSessions.length === 0) {
    insights.push({
      type: 'danger',
      icon: '⚠️',
      title: 'Hey ',
      message: 'Bu hafta çıkmış sorulardan soru çözmediğini biliyorum.',
      action: 'Hemen son yıllarda çıkmış konulardan soru çözmeye başlamak'
    });
  }

  // Subject balance
  const subjectHours: Record<string, number> = {};
  studySessions.forEach((s: any) => {
    subjectHours[s.subject] = (subjectHours[s.subject] || 0) + s.duration_minutes / 60;
  });

  const subjects = Object.keys(subjectHours);
  if (subjects.length > 0) {
    const maxSubject = subjects.reduce((a, b) => subjectHours[a] > subjectHours[b] ? a : b);
    const minSubject = subjects.reduce((a, b) => subjectHours[a] < subjectHours[b] ? a : b);

    if (subjects.length > 1 && subjectHours[maxSubject] / subjectHours[minSubject] > 3) {
      insights.push({
        type: 'info',
        icon: '⚖️',
        title: 'Denge Kur',
        message: `${maxSubject} dersine çok, ${minSubject} dersine az zaman ayırıyorsun.`,
        action: 'Çalışma saatlerini dengele'
      });
    }
  }

  // Exam readiness
  if (studentData.target_exam_date) {
    const daysLeft = calculateDaysUntilExam(studentData.target_exam_date);
    if (daysLeft <= 30 && daysLeft > 0) {
      insights.push({
        type: 'warning',
        icon: '⏰',
        title: 'Sınav Yaklaşıyor!',
        message: `Sınavına ${daysLeft} gün kaldı. Son sprint zamanı!`,
        action: 'Deneme sayısını artır'
      });
    }
  }

  return insights.length > 0 ? insights : [{
    type: 'info',
    icon: '🎯',
    title: 'Yeni Başlangıç',
    message: 'Daha fazla veri toplandıkça kişiselleştirilmiş öneriler göreceksin!',
    action: 'İlk denemeni ekle'
  }];
};

// ============================================
// DAILY CHALLENGE SYSTEM
// ============================================

export const generateDailyChallenge = (studentData: any) => {
  const hour = new Date().getHours();
  const performanceLevel = calculatePerformanceLevel(studentData);

  const challenges = [
    {
      id: 'morning_study',
      title: 'Sabah Kahramanı',
      description: 'Saat 09:00\'dan önce 30 dakika çalış',
      points: 60,
      difficulty: 'medium',
      subject: null,
      timeRestriction: { before: 9 }, // Saat 9'dan önce
      available: hour < 9 // Sadece sabah 9'dan önce göster
    },
    {
      id: 'math_sprint',
      title: '20 Dakika Matematik Sprintı',
      description: '20 dakika boyunca sadece matematik çöz',
      points: 50,
      difficulty: 'easy',
      subject: 'Matematik',
      available: true
    },
    {
      id: 'weak_topic_focus',
      title: 'Zayıf Konuya Odaklan',
      description: 'En zayıf olduğun konudan 10 soru çöz',
      points: 75,
      difficulty: 'medium',
      subject: null,
      available: true
    },
    {
      id: 'full_exam',
      title: 'Tam Deneme Sınavı',
      description: 'Zaman tutarak tam bir deneme çöz',
      points: 150,
      difficulty: 'hard',
      subject: 'Tüm Dersler',
      available: true
    },
    {
      id: 'no_mistake',
      title: 'Mükemmel Performans',
      description: '10 soru çöz, hiç yanlış yapma',
      points: 100,
      difficulty: 'hard',
      subject: null,
      available: true
    },
    {
      id: 'evening_study',
      title: 'Gece Kahramanı',
      description: 'Saat 20:00-23:00 arası 1 saat çalış',
      points: 70,
      difficulty: 'medium',
      subject: null,
      timeRestriction: { between: [20, 23] },
      available: hour >= 20 && hour < 23
    }
  ];

  // Mevcut saate göre uygun challenge'ları filtrele
  const availableChallenges = challenges.filter(c => c.available);

  if (availableChallenges.length === 0) {
    return challenges[1]; // Varsayılan: matematik sprint
  }

  // Performansa göre zorluk filtrele
  let filteredChallenges = availableChallenges;
  if (performanceLevel === 'struggling' || performanceLevel === 'needsWork') {
    filteredChallenges = availableChallenges.filter(c => c.difficulty !== 'hard');
  } else if (performanceLevel === 'excellent') {
    filteredChallenges = availableChallenges.filter(c => c.difficulty !== 'easy');
  }

  if (filteredChallenges.length === 0) {
    filteredChallenges = availableChallenges;
  }

  // Günün challenge'ını seç (her gün aynı olsun)
  const dayIndex = new Date().getDay();
  return filteredChallenges[dayIndex % filteredChallenges.length];
};