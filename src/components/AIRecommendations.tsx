import { useEffect, useState } from 'react';
import { Brain, ExternalLink, Target, RefreshCw } from 'lucide-react';
import { getStudentRecommendations } from '../lib/aiTopicAnalyzer';

interface AIRecommendationsProps {
  studentId: string;
}

export default function AIRecommendations({ studentId }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const loadRecommendations = async () => {
    if (!studentId) {
      console.warn('⚠️ AIRecommendations: No studentId provided');
      setLoading(false);
      return;
    }

    console.log('🔄 AIRecommendations: Loading for student:', studentId);
    setLoading(true);
    setError(null);

    try {
      const data = await getStudentRecommendations(studentId);
      console.log('✅ AIRecommendations: Loaded', data.length, 'recommendations');
      setRecommendations(data || []);
    } catch (err: any) {
      console.error('❌ AIRecommendations: Error loading:', err);
      setError(err.message || 'Öneriler yüklenemedi');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-8 border-2 border-red-200">
        <div className="text-center">
          <h3 className="text-xl font-bold text-red-900 mb-2">Hata</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadRecommendations}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 border-2 border-purple-200">
        <div className="text-center">
          <Brain className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Henüz AI Öneriniz Yok
          </h3>
          <p className="text-gray-600 mb-4">
            Deneme sonucu girerken zayıf olduğunuz 3 konuyu seçin, size özel çalışma planı oluşturalım!
          </p>
          <button
            onClick={loadRecommendations}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (score: number) => {
    if (score > 5000) return 'bg-red-500';
    if (score > 3000) return 'bg-orange-500';
    if (score > 1000) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPriorityLabel = (score: number) => {
    if (score > 5000) return '🔥 ACIL';
    if (score > 3000) return '⚠️ Yüksek';
    if (score > 1000) return '📌 Orta';
    return '✅ Düşük';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8" />
            <h2 className="text-2xl font-bold">AI Destekli Çalışma Planı</h2>
          </div>
          <button
            onClick={loadRecommendations}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            title="Yenile"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <p className="text-purple-100">
          Zayıf konularınız × Son 8 yılın sınav verileri = Size özel öncelik sıralaması
        </p>
        <p className="text-sm text-purple-200 mt-2">
          {recommendations.length} öneri bulundu
        </p>
      </div>

      {/* Recommendations */}
      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.id}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-800 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {rec.topic}
                  </h3>
                  <p className="text-sm text-gray-600">{rec.subject}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getPriorityColor(
                  rec.priority_score
                )}`}
              >
                {getPriorityLabel(rec.priority_score)}
              </span>
            </div>

            {/* Recommendation Text */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
              <p className="text-sm text-blue-900">{rec.recommendation_text}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  %{rec.weakness_score.toFixed(0)}
                </div>
                <div className="text-xs text-red-700">Zayıflık Skoru</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  %{rec.frequency_score.toFixed(0)}
                </div>
                <div className="text-xs text-green-700">Sınav Sıklığı</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {rec.study_hours_needed}h
                </div>
                <div className="text-xs text-purple-700">Tahmini Süre(Aylık)</div>
              </div>
            </div>

            {/* Resources */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Önerilen Kaynaklar
              </h4>
              <div className="space-y-2">
                {rec.resources.map((resource: any, idx: number) => (
                  <a
                    key={idx}
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {resource.type === 'video' && '🎥'}
                        {resource.type === 'practice' && '📝'}
                        {resource.type === 'notes' && '📖'}
                      </span>
                      <span className="text-gray-700">{resource.title}</span>
                    </div>
                    {resource.url && <ExternalLink className="h-4 w-4 text-gray-400" />}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}