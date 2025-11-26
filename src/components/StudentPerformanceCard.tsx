import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  AlertCircle,
  Calendar,
  Download,
  BarChart3,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  generateStudentPerformanceCard,
  type StudentPerformanceCard as PerformanceCardData,
  type TopicPerformance,
} from '../lib/institutionPerformanceApi';
import { exportPerformanceCardToPDF } from '../lib/pdfExport';

interface StudentPerformanceCardProps {
  studentUserId: string;
  institutionId: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  onExportPDF?: () => void;
}

export default function StudentPerformanceCard({
  studentUserId,
  institutionId,
  dateRangeStart,
  dateRangeEnd,
  onExportPDF,
}: StudentPerformanceCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PerformanceCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [studentUserId, institutionId, dateRangeStart, dateRangeEnd]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const performanceData = await generateStudentPerformanceCard(
        studentUserId,
        institutionId,
        dateRangeStart,
        dateRangeEnd
      );
      setData(performanceData);
    } catch (err: any) {
      console.error('Error loading performance data:', err);
      setError(err.message || 'Performans verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;

    try {
      setExporting(true);
      if (onExportPDF) {
        onExportPDF();
      } else {
        await exportPerformanceCardToPDF(data.studentName, data.lastExamDate);
      }
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Performans analizi yapılıyor...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Veri bulunamadı'}</p>
        </div>
      </div>
    );
  }

  // Trend ikonu
  const TrendIcon =
    data.recentTrend === 'improving'
      ? TrendingUp
      : data.recentTrend === 'declining'
      ? TrendingDown
      : Minus;

  const trendColor =
    data.recentTrend === 'improving'
      ? 'text-green-600'
      : data.recentTrend === 'declining'
      ? 'text-red-600'
      : 'text-gray-600';

  const trendText =
    data.recentTrend === 'improving'
      ? 'Gelişiyor'
      : data.recentTrend === 'declining'
      ? 'Gerileme'
      : 'Stabil';

  // Başarı oranına göre renk
  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return '#10b981'; // Yeşil
    if (rate >= 60) return '#f59e0b'; // Turuncu
    return '#ef4444'; // Kırmızı
  };

  // Radar chart için veri hazırlama
  const radarData = data.topicPerformances.slice(0, 8).map(tp => ({
    topic: tp.topic.length > 15 ? tp.topic.substring(0, 12) + '...' : tp.topic,
    başarı: tp.successRate,
  }));

  // Ders bazlı özet hesapla
  const subjectSummary = data.topicPerformances.reduce((acc, topic) => {
    if (!acc[topic.subject]) {
      acc[topic.subject] = {
        subject: topic.subject,
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        emptyCount: 0,
        successRate: 0,
      };
    }
    acc[topic.subject].totalQuestions += topic.totalQuestions;
    acc[topic.subject].correctCount += topic.correctCount;
    acc[topic.subject].wrongCount += topic.wrongCount;
    acc[topic.subject].emptyCount += topic.emptyCount;
    return acc;
  }, {} as Record<string, any>);

  // Başarı oranını hesapla
  Object.values(subjectSummary).forEach((summary: any) => {
    summary.successRate = summary.totalQuestions > 0
      ? Math.round((summary.correctCount / summary.totalQuestions) * 100)
      : 0;
  });

  const subjectSummaryArray = Object.values(subjectSummary).sort((a: any, b: any) =>
    b.successRate - a.successRate
  );

  // Ders ikonları
  const getSubjectIcon = (subject: string) => {
    const icons: Record<string, string> = {
      'Matematik': '📐',
      'Geometri': '📏',
      'Türkçe': '📚',
      'Fen': '🔬',
      'Fizik': '⚛️',
      'Kimya': '🧪',
      'Biyoloji': '🧬',
      'Tarih': '📜',
      'Coğrafya': '🌍',
      'Felsefe': '🤔',
      'Din Kültürü': '☪️',
      'İngilizce': '🇬🇧',
    };
    return icons[subject] || '📖';
  };

  return (
    <div id="performance-card-export" className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{data.studentName}</h2>
            <div className="flex items-center gap-4 text-indigo-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span>{data.totalExams} Sınav</span>
              </div>
              {data.lastExamDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    Son: {new Date(data.lastExamDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold">
              {data.averageScore.toFixed(1)}
            </div>
            <div className="text-indigo-100">Ortalama Puan</div>
            <div className={`flex items-center gap-1 mt-2 justify-end ${trendColor}`}>
              <TrendIcon className="h-5 w-5" />
              <span className="font-medium">{trendText}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              PDF Oluşturuluyor...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              📄 PDF İndir
            </>
          )}
        </button>
      </div>

      {/* Ders Bazlı Özet Kartlar */}
      {subjectSummaryArray.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Ders Bazlı Başarı Özeti
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subjectSummaryArray.map((subject: any, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border-t-4"
                style={{ borderTopColor: getSuccessColor(subject.successRate) }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-4xl">{getSubjectIcon(subject.subject)}</div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-bold"
                      style={{ color: getSuccessColor(subject.successRate) }}
                    >
                      %{subject.successRate}
                    </div>
                  </div>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">{subject.subject}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Toplam Soru:</span>
                    <span className="font-semibold text-gray-900">{subject.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Doğru:</span>
                    <span className="font-semibold text-green-600">{subject.correctCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Yanlış:</span>
                    <span className="font-semibold text-red-600">{subject.wrongCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Boş:</span>
                    <span className="font-semibold text-gray-500">{subject.emptyCount}</span>
                  </div>
                </div>
                {/* İlerleme çubuğu */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${subject.successRate}%`,
                      backgroundColor: getSuccessColor(subject.successRate),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Güçlü ve Zayıf Konular */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Güçlü Konular */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-900">Güçlü Konular</h3>
          </div>
          <div className="space-y-3">
            {data.strongTopics.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz yeterli veri yok</p>
            ) : (
              data.strongTopics.map((topic, idx) => (
                <div key={idx} className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{topic.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">🏆</div>
                      <span className="text-green-600 font-bold text-lg">%{topic.successRate}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {getSubjectIcon(topic.subject)} {topic.subject} • {topic.correctCount}/{topic.totalQuestions} doğru
                  </div>
                  {/* İlerleme çubuğu */}
                  <div className="h-2 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${topic.successRate}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zayıf Konular */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Geliştirilmesi Gereken Konular</h3>
          </div>
          <div className="space-y-3">
            {data.weakTopics.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz yeterli veri yok</p>
            ) : (
              data.weakTopics.map((topic, idx) => (
                <div key={idx} className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{topic.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">📍</div>
                      <span className="text-red-600 font-bold text-lg">%{topic.successRate}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {getSubjectIcon(topic.subject)} {topic.subject} • {topic.wrongCount} yanlış, {topic.emptyCount} boş
                  </div>
                  {/* İlerleme çubuğu */}
                  <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${topic.successRate}%` }}
                    />
                  </div>
                  <div className="mt-3 bg-red-100 text-red-800 text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>⚡ Öncelikli çalışma önerilir - Bu konuya odaklanın!</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Konu Bazlı Başarı Grafiği */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Konu Bazlı Başarı Oranları</h3>
        {data.topicPerformances.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz sınav verisi bulunmuyor</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={data.topicPerformances}
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
                {data.topicPerformances.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getSuccessColor(entry.successRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Genel Performans Haritası</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="topic" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Başarı Oranı"
                dataKey="başarı"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detaylı Tablo */}
      <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detaylı Konu Analizi</h3>
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
            </tr>
          </thead>
          <tbody>
            {data.topicPerformances.map((topic, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">{topic.subject}</td>
                <td className="py-3 px-4 font-medium">{topic.topic}</td>
                <td className="text-center py-3 px-4">{topic.totalQuestions}</td>
                <td className="text-center py-3 px-4 text-green-600">{topic.correctCount}</td>
                <td className="text-center py-3 px-4 text-red-600">{topic.wrongCount}</td>
                <td className="text-center py-3 px-4 text-gray-500">{topic.emptyCount}</td>
                <td className="text-center py-3 px-4">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-white font-medium"
                    style={{ backgroundColor: getSuccessColor(topic.successRate) }}
                  >
                    %{topic.successRate}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
