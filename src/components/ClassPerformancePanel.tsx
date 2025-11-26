import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
  Filter,
  BarChart3,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  analyzeClassPerformance,
  type ClassPerformance,
  type TopicPerformance,
} from '../lib/institutionPerformanceApi';

interface ClassPerformancePanelProps {
  institutionId: string;
  onExportPDF?: () => void;
}

export default function ClassPerformancePanel({
  institutionId,
  onExportPDF,
}: ClassPerformancePanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClassPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadClassPerformance();
  }, [institutionId, dateRange]);

  const loadClassPerformance = async () => {
    try {
      setLoading(true);
      setError(null);

      let dateRangeStart: string | undefined;
      const now = new Date();

      switch (dateRange) {
        case '7d':
          dateRangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          dateRangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '90d':
          dateRangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
          break;
      }

      const performanceData = await analyzeClassPerformance(
        institutionId,
        dateRangeStart
      );
      setData(performanceData);
    } catch (err: any) {
      console.error('Error loading class performance:', err);
      setError(err.message || 'Sınıf performansı yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Sınıf analizi yapılıyor...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Veri bulunamadı'}</p>
        </div>
      </div>
    );
  }

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Header ve Filtreler */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Sınıf Performans Analizi</h2>
          </div>

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Download className="h-5 w-5" />
              PDF İndir
            </button>
          )}
        </div>

        {/* Tarih Filtresi */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex gap-2">
            {[
              { value: '7d', label: 'Son 7 Gün' },
              { value: '30d', label: 'Son 30 Gün' },
              { value: '90d', label: 'Son 90 Gün' },
              { value: 'all', label: 'Tümü' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6" />
            <h3 className="font-semibold">Toplam Öğrenci</h3>
          </div>
          <div className="text-4xl font-bold">{data.totalStudents}</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6" />
            <h3 className="font-semibold">Sınıf Ortalaması</h3>
          </div>
          <div className="text-4xl font-bold">{data.averageScore.toFixed(1)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6" />
            <h3 className="font-semibold">Analiz Edilen Konu</h3>
          </div>
          <div className="text-4xl font-bold">{data.topicPerformances.length}</div>
        </div>
      </div>

      {/* En İyi ve En Zayıf Öğrenciler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* En İyi Öğrenciler */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-6 w-6 text-yellow-500" />
            <h3 className="text-lg font-bold text-gray-900">En Başarılı Öğrenciler</h3>
          </div>
          <div className="space-y-3">
            {data.topStudents.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz veri yok</p>
            ) : (
              data.topStudents.map((student, idx) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <span className="font-medium text-gray-900">{student.studentName}</span>
                  </div>
                  <div className="text-yellow-600 font-bold text-lg">
                    {student.averageScore.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Destek Gereken Öğrenciler */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-bold text-gray-900">Destek Gereken Öğrenciler</h3>
          </div>
          <div className="space-y-3">
            {data.strugglingStudents.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz veri yok</p>
            ) : (
              data.strugglingStudents.map((student, idx) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                      !
                    </div>
                    <span className="font-medium text-gray-900">{student.studentName}</span>
                  </div>
                  <div className="text-red-600 font-bold text-lg">
                    {student.averageScore.toFixed(1)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sınıf Genelinde Zayıf Konular */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6 text-orange-500" />
          <h3 className="text-lg font-bold text-gray-900">Öncelikli Çalışma Gereken Konular (Sınıf Geneli)</h3>
        </div>

        {data.commonWeakTopics.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Henüz yeterli veri yok</p>
        ) : (
          <div className="space-y-4">
            {data.commonWeakTopics.map((topic, idx) => (
              <div
                key={idx}
                className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900">{topic.topic}</h4>
                    <p className="text-sm text-gray-600">{topic.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">
                      %{topic.successRate}
                    </div>
                    <div className="text-xs text-gray-500">Başarı Oranı</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-600">Toplam: </span>
                    <span className="font-semibold">{topic.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Doğru: </span>
                    <span className="font-semibold text-green-600">{topic.correctCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Yanlış: </span>
                    <span className="font-semibold text-red-600">{topic.wrongCount}</span>
                  </div>
                </div>

                <div className="mt-3 bg-white border border-orange-200 rounded p-2 text-sm">
                  <span className="font-medium text-orange-700">💡 Öneri:</span>
                  <span className="text-gray-700 ml-2">
                    Bu konuya sınıf genelinde ek ders veya çalışma materyali sağlanmalı
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tüm Konular - Başarı Grafiği */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Sınıf Geneli Konu Başarı Oranları</h3>

        {data.topicPerformances.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz sınav verisi bulunmuyor</p>
        ) : (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={data.topicPerformances.slice(0, 15)} // İlk 15 konu
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis
                dataKey="topic"
                type="category"
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TopicPerformance;
                    return (
                      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <p className="font-bold text-gray-900">{data.topic}</p>
                        <p className="text-sm text-gray-600">{data.subject}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>Toplam Soru: {data.totalQuestions}</p>
                          <p className="text-green-600">✓ Doğru: {data.correctCount}</p>
                          <p className="text-red-600">✗ Yanlış: {data.wrongCount}</p>
                          <p className="text-gray-500">○ Boş: {data.emptyCount}</p>
                          <p className="font-bold mt-2">Başarı: %{data.successRate}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="successRate" name="Başarı Oranı" radius={[0, 8, 8, 0]}>
                {data.topicPerformances.slice(0, 15).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSuccessColor(entry.successRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detaylı Tablo */}
      <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detaylı Konu Analizi Tablosu</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Ders</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Konu</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Toplam Soru</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Doğru</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Yanlış</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Boş</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Başarı</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Durum</th>
            </tr>
          </thead>
          <tbody>
            {data.topicPerformances.map((topic, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">{topic.subject}</td>
                <td className="py-3 px-4 font-medium">{topic.topic}</td>
                <td className="text-center py-3 px-4">{topic.totalQuestions}</td>
                <td className="text-center py-3 px-4 text-green-600 font-semibold">
                  {topic.correctCount}
                </td>
                <td className="text-center py-3 px-4 text-red-600 font-semibold">
                  {topic.wrongCount}
                </td>
                <td className="text-center py-3 px-4 text-gray-500">
                  {topic.emptyCount}
                </td>
                <td className="text-center py-3 px-4">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: getSuccessColor(topic.successRate) }}
                  >
                    %{topic.successRate}
                  </span>
                </td>
                <td className="text-center py-3 px-4">
                  {topic.successRate >= 80 ? (
                    <span className="text-green-600">✓ İyi</span>
                  ) : topic.successRate >= 60 ? (
                    <span className="text-yellow-600">⚠ Orta</span>
                  ) : (
                    <span className="text-red-600">✗ Zayıf</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
