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
        estimatedHours: 8,
        description: `${subject} konusundaki düşüşü durdurmak için tekrar ve pekiştirme çalışması yapın.`
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
      description: 'Sınav tekniği ve zaman yönetimi çalışması yapın. Tahmin stratejileri öğrenin.'
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
  const messages = [
    'Bugün dün yapamadığın bir şeyi yapabilirsin! 💪',
    'Her çalıştığın dakika seni hedefe bir adım daha yaklaştırıyor! 🎯',
    'Başarı, küçük çabaların günlük tekrarıdır. Devam et! ⭐',
    'Sen yapabilirsin! Her zorluk, seni daha güçlü yapıyor. 🚀',
    'Bugün kendine yatırım yap, yarın kendine teşekkür et! 📚',
    'Hayallerinin peşinden koşmaya devam et! 🌟',
    'Her yeni gün, yeni bir fırsat demektir! 🌅',
    'Azim ve kararlılık her kapıyı açar! 🔑',
    'Başarı yolunda her adım değerlidir! 👣',
    'Kendine inan, çünkü sen eşsizsin! ✨'
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
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
        change = recent - older;
        
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