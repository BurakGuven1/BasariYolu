import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, AlertCircle, CheckCircle, Clock, BookOpen, ChevronRight, BarChart3, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EnhancedAIAnalysisProps {
  studentId: string;
  examResults: any[];
}

interface WeakTopicWithPriority {
  id: string;
  subject: string;
  topic: string;
  wrong_count: number;
  total_count: number;
  percentage_wrong: number;
  frequency_score: number;
  priority_score: number;
  recommendation_text: string;
  study_hours_needed: number;
  recent_exams: string[];
}

interface QuickStats {
  totalExams: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  bestSubject: { key: string; label: string; avg: number };
  worstSubject: { key: string; label: string; avg: number };
}

export default function EnhancedAIAnalysis({ studentId, examResults }: EnhancedAIAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [priorityTopics, setPriorityTopics] = useState<WeakTopicWithPriority[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    if (studentId && examResults.length > 0) {
      loadAnalysisData();
    } else {
      setLoading(false);
    }
  }, [studentId, examResults]);

  const loadAnalysisData = async () => {
    setLoading(true);
    try {
      // 1. Quick Stats hesapla
      const stats = calculateQuickStats(examResults);
      setQuickStats(stats);

      // 2. Zayıf konuları ve önerileri al
      const topics = await loadPriorityTopics();
      setPriorityTopics(topics);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateQuickStats = (exams: any[]): QuickStats => {
    const recentExams = exams
      .filter(e => e.total_score != null)
      .sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())
      .slice(0, 5);

    const avgScore = recentExams.reduce((sum, e) => sum + e.total_score, 0) / recentExams.length;

    // Trend hesapla
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendValue = 0;
    if (recentExams.length >= 3) {
      const recent = recentExams.slice(0, 2).reduce((sum, e) => sum + e.total_score, 0) / 2;
      const older = recentExams.slice(2, 4).reduce((sum, e) => sum + e.total_score, 0) / 2;
      trendValue = recent - older;
      if (trendValue > 5) trend = 'up';
      else if (trendValue < -5) trend = 'down';
    }

    // En iyi/k?t? ders (rate = net/soru say?s?)
    const examType = recentExams[0]?.exam_type || 'TYT';
    const subjects = getSubjectConfigs(examType);

    const subjectAvgs: { key: string; label: string; avgNet: number; avgRate: number }[] = [];
    subjects.forEach(({ key, label, prefix, totalQuestions }) => {
      const metrics = recentExams
        .map(exam => getSubjectMetrics(exam, prefix, totalQuestions))
        .filter(Boolean) as { net: number; rate: number }[];

      if (metrics.length > 0) {
        const avgNet = metrics.reduce((sum, m) => sum + m.net, 0) / metrics.length;
        const avgRate = metrics.reduce((sum, m) => sum + m.rate, 0) / metrics.length;
        subjectAvgs.push({ key, label, avgNet, avgRate });
      }
    });

    if (subjectAvgs.length === 0) {
      return {
        totalExams: exams.length,
        avgScore: parseFloat(avgScore.toFixed(1)),
        trend,
        trendValue: parseFloat(trendValue.toFixed(1)),
        bestSubject: { key: '-', label: '-', avg: 0 },
        worstSubject: { key: '-', label: '-', avg: 0 }
      };
    }

    const bestSubject = subjectAvgs.reduce((a, b) => (a.avgRate > b.avgRate ? a : b));
    const worstSubject = subjectAvgs.reduce((a, b) => (a.avgRate < b.avgRate ? a : b));
    return {
      totalExams: exams.length,
      avgScore: parseFloat(avgScore.toFixed(1)),
      trend,
      trendValue: parseFloat(trendValue.toFixed(1)),
      bestSubject: { key: bestSubject.key, label: bestSubject.label, avg: parseFloat(bestSubject.avgNet.toFixed(1)) },
      worstSubject: { key: worstSubject.key, label: worstSubject.label, avg: parseFloat(worstSubject.avgNet.toFixed(1)) }
    };
  };


  const getSubjectMetrics = (
    exam: any,
    prefix: string,
    totalQuestions: number
  ): { net: number; rate: number } | null => {
    if (!exam.exam_details) return null;
    const details = typeof exam.exam_details === 'string' ? JSON.parse(exam.exam_details) : exam.exam_details;

    const correct = parseInt(details[prefix + '_dogru'] || 0);
    const wrong = parseInt(details[prefix + '_yanlis'] || 0);
    const net = Math.max(0, correct - wrong / 4);
    const rate = totalQuestions > 0 ? net / totalQuestions : 0;

    return { net, rate };
  };

  const getSubjectConfigs = (examType: string) => {
    if (examType === 'LGS') {
      return [
        { key: 'turkce', label: 'Türkçe', prefix: 'lgs_turkce', totalQuestions: 20 },
        { key: 'matematik', label: 'Matematik', prefix: 'lgs_matematik', totalQuestions: 20 },
        { key: 'fen', label: 'Fen', prefix: 'lgs_fen', totalQuestions: 20 },
        { key: 'inkilap', label: 'İnkılap', prefix: 'lgs_inkilap', totalQuestions: 10 },
        { key: 'ingilizce', label: 'İngilizce', prefix: 'lgs_ingilizce', totalQuestions: 10 },
        { key: 'din', label: 'Din', prefix: 'lgs_din', totalQuestions: 10 },
      ];
    }

    // Default TYT
    return [
      { key: 'turkce', label: 'Türkçe', prefix: 'tyt_turkce', totalQuestions: 40 },
      { key: 'matematik', label: 'Matematik', prefix: 'tyt_matematik', totalQuestions: 40 },
      { key: 'fen', label: 'Fen', prefix: 'tyt_fen', totalQuestions: 20 },
      { key: 'sosyal', label: 'Sosyal', prefix: 'tyt_sosyal', totalQuestions: 20 },
    ];
  };

const loadPriorityTopics = async (): Promise<WeakTopicWithPriority[]> => {
    // exam_weak_topics ve topic_recommendations'ı birleştir
    const { data: weakTopicsData, error: weakError } = await supabase
      .from('exam_weak_topics')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (weakError) {
      console.error('Error loading weak topics:', weakError);
      return [];
    }

    const { data: recommendationsData, error: recError } = await supabase
      .from('topic_recommendations')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('priority_score', { ascending: false });

    if (recError) {
      console.error('Error loading recommendations:', recError);
    }

    // Konuları birleştir
    const topicMap = new Map<string, WeakTopicWithPriority>();

    // Önce weak topics'ten al
    weakTopicsData?.forEach((wt: any) => {
      const key = `${wt.subject}-${wt.topic}`;
      if (!topicMap.has(key)) {
        // Recommendation varsa al
        const rec = recommendationsData?.find(r => r.subject === wt.subject && r.topic === wt.topic);

        topicMap.set(key, {
          id: wt.id,
          subject: wt.subject,
          topic: wt.topic,
          wrong_count: wt.wrong_count,
          total_count: wt.total_count,
          percentage_wrong: wt.percentage_wrong,
          frequency_score: rec?.frequency_score || 0,
          priority_score: rec?.priority_score || (wt.percentage_wrong * 10),
          recommendation_text: rec?.recommendation_text || generateDefaultRecommendation(wt.topic, wt.percentage_wrong),
          study_hours_needed: rec?.study_hours_needed || calculateDefaultStudyHours(wt.percentage_wrong),
          recent_exams: [wt.exam_result_id]
        });
      } else {
        // Aynı konu birden fazla denemede yanlış yapılmış, birleştir
        const existing = topicMap.get(key)!;
        existing.wrong_count += wt.wrong_count;
        existing.total_count += wt.total_count;
        existing.percentage_wrong = (existing.wrong_count / existing.total_count) * 100;
        existing.recent_exams.push(wt.exam_result_id);
      }
    });

    return Array.from(topicMap.values())
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 20); // En önemli 20 konu
  };

  const generateDefaultRecommendation = (topic: string, percentage: number): string => {
    if (percentage > 70) {
      return `"${topic}" konusunda ciddi eksikleriniz var. Bu konuya acil odaklanmanız gerekiyor.`;
    } else if (percentage > 50) {
      return `"${topic}" konusunda orta seviye zayıflık var. Birkaç günlük çalışma ile düzelebilir.`;
    } else {
      return `"${topic}" konusunda hafif eksikler var. Tekrar yapmakta fayda var.`;
    }
  };

  const calculateDefaultStudyHours = (percentage: number): number => {
    return parseFloat(Math.min(percentage / 10, 15).toFixed(1));
  };

  const getPriorityLabel = (score: number) => {
    if (score > 5000) return { label: 'KRİTİK', color: 'bg-red-500', icon: '🔥' };
    if (score > 3000) return { label: 'YÜKSEK', color: 'bg-orange-500', icon: '⚠️' };
    if (score > 1000) return { label: 'ORTA', color: 'bg-yellow-500', icon: '📌' };
    return { label: 'DÜŞÜK', color: 'bg-green-500', icon: '✅' };
  };

  const filteredTopics = priorityTopics.filter(topic => {
    if (selectedPriority === 'all') return true;
    if (selectedPriority === 'critical') return topic.priority_score > 5000;
    if (selectedPriority === 'high') return topic.priority_score > 3000 && topic.priority_score <= 5000;
    if (selectedPriority === 'medium') return topic.priority_score > 1000 && topic.priority_score <= 3000;
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">AI analizi hazırlanıyor...</span>
      </div>
    );
  }

  if (!quickStats || examResults.length < 2) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 text-center">
        <Brain className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analizi İçin Daha Fazla Veri Gerekli</h3>
        <p className="text-gray-600 mb-4">
          Kapsamlı AI analizi için en az 2 deneme sonucu gereklidir.
        </p>
        <div className="bg-white p-4 rounded-lg inline-block">
          <p className="text-gray-800">Şu anda <span className="font-bold text-blue-600">{examResults.length}</span> deneme sonucunuz var.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8" />
          <h2 className="text-2xl font-bold">AI Destekli Analiz ve Akıllı Plan</h2>
        </div>
        <p className="text-blue-100">
          Deneme sonuçlarınız ve yanlış yaptığınız konular üzerinden kişiselleştirilmiş analiz
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Toplam Deneme</span>
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{quickStats.totalExams}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Ortalama Puan</span>
            <Target className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{quickStats.avgScore}</p>
          <div className="flex items-center gap-1 mt-1">
            {quickStats.trend === 'up' && (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600">+{quickStats.trendValue}</span>
              </>
            )}
            {quickStats.trend === 'down' && (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-600">{quickStats.trendValue}</span>
              </>
            )}
            {quickStats.trend === 'stable' && (
              <span className="text-xs text-gray-500">Stabil</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">En İyi Ders</span>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{quickStats.bestSubject.label}</p>
          <p className="text-sm text-green-600">{quickStats.bestSubject.avg} net ortalama</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Geliştirilecek</span>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-lg font-bold text-gray-900">{quickStats.worstSubject.label}</p>
          <p className="text-sm text-orange-600">{quickStats.worstSubject.avg} net ortalama</p>
        </div>
      </div>

      {/* Priority Filter */}
      {priorityTopics.length > 0 && (
        <>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Öncelikli Konular</h3>
                <span className="text-sm text-gray-500">({filteredTopics.length} konu)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPriority('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriority === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setSelectedPriority('critical')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriority === 'critical'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔥 Kritik
                </button>
                <button
                  onClick={() => setSelectedPriority('high')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriority === 'high'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚠️ Yüksek
                </button>
                <button
                  onClick={() => setSelectedPriority('medium')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedPriority === 'medium'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📌 Orta
                </button>
              </div>
            </div>
          </div>

          {/* Priority Topics List */}
          <div className="space-y-4">
            {filteredTopics.map((topic, index) => {
              const priority = getPriorityLabel(topic.priority_score);
              return (
                <div
                  key={topic.id}
                  className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-purple-100 text-purple-800 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{topic.topic}</h3>
                        <p className="text-sm text-gray-600">{topic.subject}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">
                            Son {topic.recent_exams.length} denemede görüldü
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${priority.color} shrink-0`}>
                      {priority.icon} {priority.label}
                    </span>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <p className="text-sm text-blue-900">{topic.recommendation_text}</p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xl font-bold text-red-600">
                        {topic.wrong_count}/{topic.total_count}
                      </div>
                      <div className="text-xs text-red-700">Yanlış/Toplam</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">
                        %{topic.percentage_wrong.toFixed(0)}
                      </div>
                      <div className="text-xs text-orange-700">Hata Oranı</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        %{topic.frequency_score.toFixed(0)}
                      </div>
                      <div className="text-xs text-green-700">Sınav Sıklığı</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600 flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        {topic.study_hours_needed}h
                      </div>
                      <div className="text-xs text-purple-700">Tahmini Süre(Aylık)</div>
                    </div>
                  </div>

                  {/* Action Plan */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Önerilen Aksiyonlar:</span>
                      </div>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.subject + ' ' + topic.topic + ' konu anlatımı')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Video Kaynaklara Git
                        <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Bu hafta {Math.ceil(topic.study_hours_needed / 4)} saat ayırın
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Önce konu anlatımı izleyin, sonra soru çözün
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Yanlış sorularınızı not defterine yazın
                      </li>
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {priorityTopics.length === 0 && (
        <div className="bg-green-50 rounded-xl p-8 text-center border-2 border-green-200">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Harika Gidiyorsun!</h3>
          <p className="text-gray-600">
            Deneme sonuçlarınızda belirgin zayıf konu tespit edilmedi. Mevcut çalışma temponuzu koruyun!
          </p>
        </div>
      )}

      {/* Study Tips */}
      {filteredTopics.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-6 w-6 text-yellow-600 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">💡 Bu Hafta İçin Öneriler</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">1.</span>
                  <span>
                    <strong>{filteredTopics[0]?.topic}</strong> konusuna öncelik verin - bu hafta {filteredTopics[0]?.study_hours_needed}h ayırın
                  </span>
                </li>
                {filteredTopics[1] && (
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">2.</span>
                    <span>
                      <strong>{filteredTopics[1]?.topic}</strong> için günde 30 dakika tekrar yapın
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">3.</span>
                  <span>Her gün en az 1 deneme sorusu çözün ve yanlışlarınızı analiz edin</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">4.</span>
                  <span>Zayıf konularınızı not defterine yazın ve haftada 2 kez tekrar edin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
