// AI Analysis Service for Mobile
// Simplified version with core functionality

export interface PerformanceInsight {
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: string;
  title: string;
  message: string;
  action: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string | null;
}

const calculatePerformanceLevel = (examResults: any[]): 'excellent' | 'good' | 'needsWork' | 'struggling' | 'newStart' => {
  if (!examResults || examResults.length === 0) {
    return 'newStart';
  }

  const recentExams = examResults.slice(-5);
  const avgScore = recentExams.reduce((sum, exam) => sum + (exam.total_score || 0), 0) / recentExams.length;

  if (avgScore >= 400) return 'excellent';
  if (avgScore >= 300) return 'good';
  if (avgScore >= 200) return 'needsWork';
  return 'struggling';
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

export const generatePerformanceInsights = (studentData: any): PerformanceInsight[] => {
  const insights: PerformanceInsight[] = [];

  // Trend analysis
  if (studentData.examResults && studentData.examResults.length >= 3) {
    const recent = studentData.examResults.slice(-3);
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
  const studySessions = studentData.studySessions || [];
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
      title: 'Çalışma Eksikliği',
      message: 'Bu hafta çalışma seansı kaydı yok. Hemen başla!',
      action: 'Çalışmaya başla'
    });
  }

  // Subject balance
  const subjectHours: Record<string, number> = {};
  studySessions.forEach((s: any) => {
    subjectHours[s.subject] = (subjectHours[s.subject] || 0) + s.duration_minutes / 60;
  });

  const subjects = Object.keys(subjectHours);
  if (subjects.length > 1) {
    const maxSubject = subjects.reduce((a, b) => subjectHours[a] > subjectHours[b] ? a : b);
    const minSubject = subjects.reduce((a, b) => subjectHours[a] < subjectHours[b] ? a : b);

    if (subjectHours[maxSubject] / subjectHours[minSubject] > 3) {
      insights.push({
        type: 'info',
        icon: '⚖️',
        title: 'Denge Kur',
        message: `${maxSubject} dersine çok, ${minSubject} dersine az zaman ayırıyorsun.`,
        action: 'Çalışma saatlerini dengele'
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

export const generateDailyChallenge = (studentData: any): DailyChallenge => {
  const hour = new Date().getHours();
  const performanceLevel = calculatePerformanceLevel(studentData.examResults || []);

  const challenges: DailyChallenge[] = [
    {
      id: 'morning_study',
      title: 'Sabah Kahramanı',
      description: 'Saat 09:00\'dan önce 30 dakika çalış',
      points: 60,
      difficulty: 'medium',
      subject: null,
    },
    {
      id: 'math_sprint',
      title: '20 Dakika Matematik Sprintı',
      description: '20 dakika boyunca sadece matematik çöz',
      points: 50,
      difficulty: 'easy',
      subject: 'Matematik',
    },
    {
      id: 'weak_topic_focus',
      title: 'Zayıf Konuya Odaklan',
      description: 'En zayıf olduğun konudan 10 soru çöz',
      points: 75,
      difficulty: 'medium',
      subject: null,
    },
    {
      id: 'full_exam',
      title: 'Tam Deneme Sınavı',
      description: 'Zaman tutarak tam bir deneme çöz',
      points: 150,
      difficulty: 'hard',
      subject: 'Tüm Dersler',
    },
    {
      id: 'no_mistake',
      title: 'Mükemmel Performans',
      description: '10 soru çöz, hiç yanlış yapma',
      points: 100,
      difficulty: 'hard',
      subject: null,
    },
    {
      id: 'evening_study',
      title: 'Gece Kahramanı',
      description: 'Saat 20:00-23:00 arası 1 saat çalış',
      points: 70,
      difficulty: 'medium',
      subject: null,
    }
  ];

  // Filter based on performance
  let filteredChallenges = challenges;
  if (performanceLevel === 'struggling' || performanceLevel === 'needsWork') {
    filteredChallenges = challenges.filter(c => c.difficulty !== 'hard');
  } else if (performanceLevel === 'excellent') {
    filteredChallenges = challenges.filter(c => c.difficulty !== 'easy');
  }

  if (filteredChallenges.length === 0) {
    filteredChallenges = challenges;
  }

  // Select today's challenge (same each day)
  const dayIndex = new Date().getDay();
  return filteredChallenges[dayIndex % filteredChallenges.length];
};

export const generateMotivationalMessage = (examResults: any[]): string => {
  const performanceLevel = calculatePerformanceLevel(examResults);

  const messagesByLevel = {
    excellent: [
      'Harika gidiyorsun! Bu performansı sürdür! 🏆',
      'Muhteşem bir başarı gösteriyorsun! Devam et! ⭐',
      'Sen bir yıldızsın! Potansiyelin sınırsız! 🌟',
    ],
    good: [
      'Çok iyi ilerliyorsun! Hedefine yaklaşıyorsun! 🎯',
      'Güzel bir grafik çiziyorsun! Böyle devam! 📈',
      'Emeklerin karşılığını alıyorsun! Bravo! 👏',
    ],
    needsWork: [
      'Bugün dün yapamadığın bir şeyi yapabilirsin! 💪',
      'Her çalıştığın dakika seni hedefe bir adım daha yaklaştırıyor! 🎯',
      'Başarı, küçük çabaların günlük tekrarıdır. Devam et! ⭐',
    ],
    struggling: [
      'Zor zamanlar geçici, başarı kalıcıdır! 🌈',
      'Her usta bir zamanlar acemiydi. Sen de öğreniyorsun! 📚',
      'Bugün zorlanıyorsan, yarın daha güçlü olacaksın! 💪',
    ],
    newStart: [
      'Yeni bir başlangıç, yeni bir umut! Haydi! 🎉',
      'Bugün, geleceğini şekillendirme günü! 🚀',
      'Her büyük yolculuk ilk adımla başlar! 👣',
    ]
  };

  const messages = messagesByLevel[performanceLevel] || messagesByLevel.newStart;
  return messages[Math.floor(Math.random() * messages.length)];
};
