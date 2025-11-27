import { useState, useEffect } from 'react';
import {
  Download,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  Circle,
  Award,
  Users,
  BarChart3,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { fetchExternalExamResults, type ExternalExamResult } from '../lib/institutionExternalExamApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StudentExamResultDetailProps {
  userId: string;
  institutionId: string;
  templateId: string;
  examDate: string;
  onBack: () => void;
}

export default function StudentExamResultDetail({
  userId,
  institutionId,
  templateId,
  examDate,
  onBack,
}: StudentExamResultDetailProps) {
  const [result, setResult] = useState<ExternalExamResult | null>(null);
  const [classResults, setClassResults] = useState<ExternalExamResult[]>([]);
  const [previousResults, setPreviousResults] = useState<ExternalExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadResults();
  }, [userId, institutionId, templateId, examDate]);

  const loadResults = async () => {
    try {
      setLoading(true);

      // Öğrencinin bu sınav sonucu
      const allResults = await fetchExternalExamResults(institutionId, userId);
      const studentResult = allResults.find(
        r => r.template_id === templateId && r.exam_date === examDate
      );

      if (studentResult) {
        setResult(studentResult);
      }

      // Sınıftaki tüm öğrencilerin bu sınav sonuçları (karşılaştırma için)
      const allClassResults = await fetchExternalExamResults(institutionId);
      const sameExamResults = allClassResults.filter(
        r => r.template_id === templateId && r.exam_date === examDate
      );
      setClassResults(sameExamResults);

      // Öğrencinin önceki aynı tip sınav sonuçları
      const template = studentResult?.template;
      if (template) {
        const previous = allResults.filter(
          r =>
            r.template_id !== templateId &&
            r.template?.exam_type === template.exam_type &&
            new Date(r.exam_date) < new Date(examDate)
        );
        setPreviousResults(previous.sort((a, b) =>
          new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!result) return;

    try {
      setDownloading(true);
      const element = document.getElementById('exam-result-content');
      if (!element) return;

      // Optimize html2canvas settings
      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduce from 2 to 1.5
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG with 70% quality
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Enable compression
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`Sınav_Raporu_${result.template?.name}_${examDate}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF oluşturulurken bir hata oluştu');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Sonuçlar yükleniyor...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-600">Sonuç bulunamadı</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  const template = result.template as any;
  const questionMapping = template?.question_mapping || [];

  // Konu bazlı analiz
  const topicStats = new Map<string, { correct: number; wrong: number; empty: number }>();

  Object.entries(result.answers).forEach(([questionNumStr, answer]) => {
    const questionNum = parseInt(questionNumStr);
    const question = questionMapping.find((q: any) => q.questionNumber === questionNum);

    if (question) {
      const topic = question.topic;
      if (!topicStats.has(topic)) {
        topicStats.set(topic, { correct: 0, wrong: 0, empty: 0 });
      }

      const stats = topicStats.get(topic)!;
      if (answer.studentAnswer === 'X') {
        stats.empty++;
      } else if (answer.isCorrect) {
        stats.correct++;
      } else {
        stats.wrong++;
      }
    }
  });

  // Sınıf ortalaması hesapla
  const classAverage = classResults.length > 0
    ? classResults.reduce((sum, r) => sum + r.net_score, 0) / classResults.length
    : 0;

  const classRank = classResults
    .sort((a, b) => b.net_score - a.net_score)
    .findIndex(r => r.user_id === userId) + 1;

  // Önceki sınavlarla karşılaştırma
  const previousAverage = previousResults.length > 0
    ? previousResults.reduce((sum, r) => sum + r.net_score, 0) / previousResults.length
    : null;

  const improvement = previousAverage !== null ? result.net_score - previousAverage : null;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Geri Dön
        </button>
        <button
          onClick={downloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Download className="h-5 w-5" />
          {downloading ? 'İndiriliyor...' : 'PDF İndir'}
        </button>
      </div>

      {/* Content for PDF */}
      <div id="exam-result-content" className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{template?.name}</h2>
          <div className="flex items-center gap-6 text-indigo-100">
            <span>{template?.exam_type}</span>
            <span>•</span>
            <span>{new Date(examDate).toLocaleDateString('tr-TR')}</span>
            <span>•</span>
            <span>{template?.total_questions} Soru</span>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Doğru</p>
                <p className="text-2xl font-bold text-green-600">{result.correct_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Yanlış</p>
                <p className="text-2xl font-bold text-red-600">{result.wrong_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Circle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Boş</p>
                <p className="text-2xl font-bold text-gray-600">{result.empty_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net</p>
                <p className="text-2xl font-bold text-indigo-600">{result.net_score.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Class Comparison */}
        {classResults.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600" />
              Sınıf Karşılaştırması
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-700 mb-1">Senin Nettin</p>
                <p className="text-3xl font-bold text-purple-900">{result.net_score.toFixed(2)}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-1">Sınıf Ortalaması</p>
                <p className="text-3xl font-bold text-blue-900">{classAverage.toFixed(2)}</p>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-700 mb-1">Sıralaman</p>
                <p className="text-3xl font-bold text-orange-900">
                  {classRank} / {classResults.length}
                </p>
              </div>
            </div>

            {/* Comparison indicator */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {result.net_score > classAverage ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Sınıf ortalamasının {(result.net_score - classAverage).toFixed(2)} net üzerinde
                  </span>
                </>
              ) : result.net_score < classAverage ? (
                <>
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  <span className="text-orange-700 font-medium">
                    Sınıf ortalamasının {(classAverage - result.net_score).toFixed(2)} net altında
                  </span>
                </>
              ) : (
                <span className="text-gray-700 font-medium">Sınıf ortalamasında</span>
              )}
            </div>
          </div>
        )}

        {/* Previous Exams Comparison */}
        {previousResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Gelişim Analizi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Önceki Denemeler Ortalaması</p>
                <p className="text-2xl font-bold text-gray-900">{previousAverage?.toFixed(2)}</p>
              </div>

              <div className={`rounded-lg p-4 ${improvement && improvement > 0 ? 'bg-green-50' : improvement && improvement < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-600 mb-1">Gelişim</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${improvement && improvement > 0 ? 'text-green-700' : improvement && improvement < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    {improvement && improvement > 0 ? '+' : ''}{improvement?.toFixed(2)}
                  </p>
                  {improvement && improvement > 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  ) : improvement && improvement < 0 ? (
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="mb-2 font-medium">Son 3 Deneme:</p>
              <div className="space-y-2">
                {previousResults.slice(0, 3).map((prevResult, idx) => (
                  <div key={prevResult.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>{prevResult.template?.name}</span>
                    <span className="font-semibold">{prevResult.net_score.toFixed(2)} net</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weak Topics - Priority */}
        {(() => {
          const weakTopics = Array.from(topicStats.entries())
            .map(([topic, stats]) => {
              const total = stats.correct + stats.wrong + stats.empty;
              const successRate = total > 0 ? (stats.correct / total) * 100 : 0;
              return { topic, stats, total, successRate };
            })
            .filter(t => t.successRate < 60)
            .sort((a, b) => a.successRate - b.successRate);

          return weakTopics.length > 0 ? (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                ⚠️ Acil Çalışılması Gereken Konular
              </h3>
              <div className="space-y-3">
                {weakTopics.map(({ topic, stats, total, successRate }) => (
                  <div key={topic} className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{topic}</h4>
                      <span className="text-lg font-bold text-orange-600">%{Math.round(successRate)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">✓ {stats.correct}</span>
                      <span className="text-red-600">✗ {stats.wrong}</span>
                      <span className="text-gray-500">○ {stats.empty}</span>
                    </div>
                    <p className="text-sm text-orange-800 mt-2 font-medium">
                      → Bu konuya öncelik verin! {total} sorudan sadece {stats.correct} doğru.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                ✓ Harika! Tüm Konularda İyi Durumdasın
              </h3>
              <p className="text-green-800">
                Tüm konularda %60'ın üzerinde başarı gösterdin. Böyle devam et!
              </p>
            </div>
          );
        })()}

        {/* Topic Analysis with Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Konu Bazlı Detaylı Analiz
          </h3>

          {/* Bar Chart */}
          <div className="mb-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Array.from(topicStats.entries()).map(([topic, stats]) => {
                  const total = stats.correct + stats.wrong + stats.empty;
                  const successRate = total > 0 ? (stats.correct / total) * 100 : 0;
                  return {
                    name: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
                    fullName: topic,
                    'Başarı Oranı': Math.round(successRate),
                    Doğru: stats.correct,
                    Yanlış: stats.wrong,
                    Boş: stats.empty,
                  };
                })}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Doğru" fill="#10b981" />
                <Bar dataKey="Yanlış" fill="#ef4444" />
                <Bar dataKey="Boş" fill="#9ca3af" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed List */}
          <div className="space-y-3">
            {Array.from(topicStats.entries()).map(([topic, stats]) => {
              const total = stats.correct + stats.wrong + stats.empty;
              const successRate = total > 0 ? (stats.correct / total) * 100 : 0;

              return (
                <div key={topic} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{topic}</h4>
                    <span className="text-sm text-gray-600">
                      {total} soru
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Doğru: {stats.correct}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Yanlış: {stats.wrong}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded"></div>
                      <span>Boş: {stats.empty}</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Başarı Oranı</span>
                      <span className="font-semibold">%{Math.round(successRate)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          successRate >= 75
                            ? 'bg-green-500'
                            : successRate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
