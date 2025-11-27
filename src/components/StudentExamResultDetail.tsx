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

  // Calculate exam score based on exam type
  const calculateExamScore = () => {
    const examType = template?.exam_type;
    if (!examType) return null;

    // Helper function to calculate net score for a subject
    const calculateNetScore = (correct: number, wrong: number) => {
      return Math.max(0, correct - (wrong / 4));
    };

    // Group topics by subject (using heuristics)
    const subjectStats = new Map<string, { correct: number; wrong: number; empty: number }>();

    topicStats.forEach((stats, topic) => {
      const topicLower = topic.toLowerCase();
      let subject = 'Diğer';

      // Türkçe
      if (topicLower.includes('türkçe') || topicLower.includes('dil') || topicLower.includes('sözcük') ||
          topicLower.includes('cümle') || topicLower.includes('paragraf') || topicLower.includes('anlam')) {
        subject = 'Türkçe';
      }
      // Matematik
      else if (topicLower.includes('matematik') || topicLower.includes('geometri') || topicLower.includes('sayı') ||
               topicLower.includes('fonksiyon') || topicLower.includes('olasılık') || topicLower.includes('alan')) {
        subject = 'Matematik';
      }
      // Fen
      else if (topicLower.includes('fen') || topicLower.includes('fizik') || topicLower.includes('kimya') ||
               topicLower.includes('biyoloji') || topicLower.includes('bilim')) {
        subject = 'Fen';
      }
      // Sosyal
      else if (topicLower.includes('sosyal') || topicLower.includes('tarih') || topicLower.includes('coğrafya') ||
               topicLower.includes('felsefe') || topicLower.includes('din') || topicLower.includes('inkılap')) {
        subject = 'Sosyal';
      }
      // Edebiyat
      else if (topicLower.includes('edebiyat') || topicLower.includes('şiir') || topicLower.includes('roman')) {
        subject = 'Edebiyat';
      }
      // İngilizce
      else if (topicLower.includes('ingilizce') || topicLower.includes('english')) {
        subject = 'İngilizce';
      }

      if (!subjectStats.has(subject)) {
        subjectStats.set(subject, { correct: 0, wrong: 0, empty: 0 });
      }

      const subjectStat = subjectStats.get(subject)!;
      subjectStat.correct += stats.correct;
      subjectStat.wrong += stats.wrong;
      subjectStat.empty += stats.empty;
    });

    // Calculate score based on exam type
    if (examType === 'TYT') {
      const turkce = subjectStats.get('Türkçe') || { correct: 0, wrong: 0, empty: 0 };
      const matematik = subjectStats.get('Matematik') || { correct: 0, wrong: 0, empty: 0 };
      const fen = subjectStats.get('Fen') || { correct: 0, wrong: 0, empty: 0 };
      const sosyal = subjectStats.get('Sosyal') || { correct: 0, wrong: 0, empty: 0 };

      const turkceNet = calculateNetScore(turkce.correct, turkce.wrong);
      const matematikNet = calculateNetScore(matematik.correct, matematik.wrong);
      const fenNet = calculateNetScore(fen.correct, fen.wrong);
      const sosyalNet = calculateNetScore(sosyal.correct, sosyal.wrong);

      const hamPuan = 100 + (turkceNet * 3.33) + (matematikNet * 3.33) + (fenNet * 3.45) + (sosyalNet * 3.45);
      return Math.min(500, Math.max(100, Math.round(hamPuan * 100) / 100));
    } else if (examType === 'AYT') {
      // For AYT, we'll use a simplified calculation based on total net
      const aytHamPuan = (result.net_score * 5) + 100;
      return Math.min(500, Math.max(100, Math.round(aytHamPuan * 100) / 100));
    } else if (examType === 'LGS') {
      const turkce = subjectStats.get('Türkçe') || { correct: 0, wrong: 0, empty: 0 };
      const matematik = subjectStats.get('Matematik') || { correct: 0, wrong: 0, empty: 0 };
      const fen = subjectStats.get('Fen') || { correct: 0, wrong: 0, empty: 0 };
      const sosyal = subjectStats.get('Sosyal') || { correct: 0, wrong: 0, empty: 0 };
      const ingilizce = subjectStats.get('İngilizce') || { correct: 0, wrong: 0, empty: 0 };

      const turkceNet = calculateNetScore(turkce.correct, turkce.wrong);
      const matematikNet = calculateNetScore(matematik.correct, matematik.wrong);
      const fenNet = calculateNetScore(fen.correct, fen.wrong);
      const sosyalNet = calculateNetScore(sosyal.correct, sosyal.wrong);
      const ingilizceNet = calculateNetScore(ingilizce.correct, ingilizce.wrong);

      const katsayiliToplam = (turkceNet * 4) + (matematikNet * 4) + (fenNet * 4) +
                              (sosyalNet * 1) + (ingilizceNet * 1);

      const hamPuan = (katsayiliToplam * 500) / 270;
      return Math.min(500, Math.max(0, Math.round(hamPuan * 100) / 100));
    }

    return null;
  };

  const examScore = calculateExamScore();

  const downloadPDF = async () => {
    if (!result) return;

    try {
      setDownloading(true);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to add text
      const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
        pdf.setFontSize(size);
        if (style === 'bold') {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }

        if (align === 'center') {
          pdf.text(text, pageWidth / 2, yPos, { align: 'center' });
        } else if (align === 'right') {
          pdf.text(text, pageWidth - margin, yPos, { align: 'right' });
        } else {
          pdf.text(text, margin, yPos);
        }
      };

      // Header
      pdf.setFillColor(79, 70, 229); // Indigo color
      pdf.rect(0, 0, pageWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      yPos = 15;
      addText('SINAV PERFORMANS RAPORU', 18, 'bold', 'center');
      yPos = 25;
      addText(`${template?.name} - ${new Date(examDate).toLocaleDateString('tr-TR')}`, 12, 'normal', 'center');

      // Reset text color
      pdf.setTextColor(0, 0, 0);
      yPos = 45;

      // Exam Score (prominent)
      if (examScore !== null) {
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');
        pdf.setFillColor(79, 70, 229);
        pdf.roundedRect(margin + 5, yPos + 5, 60, 10, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SINAV PUANI', margin + 35, yPos + 12, { align: 'center' });
        pdf.setTextColor(79, 70, 229);
        pdf.setFontSize(16);
        pdf.text(`${examScore} / 500`, margin + 110, yPos + 13, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        yPos += 25;
      }

      // Overall Statistics
      yPos += 5;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GENEL İSTATİSTİKLER', margin, yPos);
      yPos += 8;

      const statsBoxWidth = (contentWidth - 10) / 4;
      const statsY = yPos;

      // Doğru
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(margin, statsY, statsBoxWidth, 18, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Doğru', margin + statsBoxWidth / 2, statsY + 6, { align: 'center' });
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 163, 74);
      pdf.text(String(result.correct_count), margin + statsBoxWidth / 2, statsY + 14, { align: 'center' });
      pdf.setTextColor(0, 0, 0);

      // Yanlış
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(margin + statsBoxWidth + 3, statsY, statsBoxWidth, 18, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Yanlış', margin + statsBoxWidth + 3 + statsBoxWidth / 2, statsY + 6, { align: 'center' });
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(String(result.wrong_count), margin + statsBoxWidth + 3 + statsBoxWidth / 2, statsY + 14, { align: 'center' });
      pdf.setTextColor(0, 0, 0);

      // Boş
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(margin + (statsBoxWidth + 3) * 2, statsY, statsBoxWidth, 18, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Boş', margin + (statsBoxWidth + 3) * 2 + statsBoxWidth / 2, statsY + 6, { align: 'center' });
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(107, 114, 128);
      pdf.text(String(result.empty_count), margin + (statsBoxWidth + 3) * 2 + statsBoxWidth / 2, statsY + 14, { align: 'center' });
      pdf.setTextColor(0, 0, 0);

      // Net
      pdf.setFillColor(224, 231, 255);
      pdf.roundedRect(margin + (statsBoxWidth + 3) * 3, statsY, statsBoxWidth, 18, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Net', margin + (statsBoxWidth + 3) * 3 + statsBoxWidth / 2, statsY + 6, { align: 'center' });
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(79, 70, 229);
      pdf.text(result.net_score.toFixed(2), margin + (statsBoxWidth + 3) * 3 + statsBoxWidth / 2, statsY + 14, { align: 'center' });
      pdf.setTextColor(0, 0, 0);

      yPos = statsY + 25;

      // Weak Topics
      const weakTopics = Array.from(topicStats.entries())
        .map(([topic, stats]) => {
          const total = stats.correct + stats.wrong + stats.empty;
          const successRate = total > 0 ? (stats.correct / total) * 100 : 0;
          return { topic, stats, total, successRate };
        })
        .filter(t => t.successRate < 60)
        .sort((a, b) => a.successRate - b.successRate);

      if (weakTopics.length > 0) {
        yPos += 5;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(194, 65, 12);
        pdf.text('⚠ ACİL ÇALIŞILMASI GEREKEN KONULAR', margin, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 7;

        weakTopics.slice(0, 5).forEach(({ topic, stats, successRate }) => {
          pdf.setFillColor(254, 243, 199);
          pdf.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(topic.substring(0, 50), margin + 2, yPos + 5);

          pdf.setTextColor(194, 65, 12);
          pdf.text(`%${Math.round(successRate)}`, margin + contentWidth - 15, yPos + 5);
          pdf.setTextColor(0, 0, 0);

          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(107, 114, 128);
          pdf.text(`D:${stats.correct} Y:${stats.wrong} B:${stats.empty}`, margin + 2, yPos + 9);
          pdf.setTextColor(0, 0, 0);

          yPos += 13;
        });
      } else {
        yPos += 5;
        pdf.setFillColor(220, 252, 231);
        pdf.roundedRect(margin, yPos, contentWidth, 15, 2, 2, 'F');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 163, 74);
        pdf.text('✓ Harika! Tüm Konularda İyi Durumdasın', margin + contentWidth / 2, yPos + 7, { align: 'center' });
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Tüm konularda %60\'ın üzerinde başarı gösterdin. Böyle devam et!', margin + contentWidth / 2, yPos + 11, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        yPos += 18;
      }

      // Topic Analysis Table
      yPos += 5;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KONU BAZLI DETAYLI ANALİZ', margin, yPos);
      yPos += 7;

      // Table header
      pdf.setFillColor(79, 70, 229);
      pdf.rect(margin, yPos, contentWidth, 8, 'F');
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('Konu', margin + 2, yPos + 5);
      pdf.text('D', margin + 110, yPos + 5);
      pdf.text('Y', margin + 125, yPos + 5);
      pdf.text('B', margin + 140, yPos + 5);
      pdf.text('Başarı', margin + 155, yPos + 5);
      pdf.setTextColor(0, 0, 0);
      yPos += 8;

      // Table rows (limit to fit on page)
      const topicsArray = Array.from(topicStats.entries());
      const maxTopics = Math.min(topicsArray.length, 12);

      topicsArray.slice(0, maxTopics).forEach(([topic, stats], index) => {
        const total = stats.correct + stats.wrong + stats.empty;
        const successRate = total > 0 ? (stats.correct / total) * 100 : 0;

        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos - 4, contentWidth, 6, 'F');
        }

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text(topic.substring(0, 35), margin + 2, yPos);
        pdf.text(String(stats.correct), margin + 110, yPos);
        pdf.text(String(stats.wrong), margin + 125, yPos);
        pdf.text(String(stats.empty), margin + 140, yPos);

        // Success rate with color
        if (successRate >= 75) {
          pdf.setTextColor(22, 163, 74);
        } else if (successRate >= 50) {
          pdf.setTextColor(234, 179, 8);
        } else {
          pdf.setTextColor(220, 38, 38);
        }
        pdf.text(`%${Math.round(successRate)}`, margin + 155, yPos);
        pdf.setTextColor(0, 0, 0);

        yPos += 6;
      });

      // Recommendations
      yPos += 8;
      if (yPos > 260) {
        // If too close to bottom, skip recommendations
      } else {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ÖNERİLER', margin, yPos);
        yPos += 7;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const recommendations = [];

        if (weakTopics.length > 0) {
          recommendations.push(`• ${weakTopics.length} konuda ekstra çalışma yapman öneriliyor.`);
        }
        if (result.empty_count > template?.total_questions * 0.1) {
          recommendations.push(`• Boş bıraktığın ${result.empty_count} soruyu azaltmaya çalış.`);
        }
        if (result.wrong_count > result.correct_count * 0.5) {
          recommendations.push('• Yanlış sayını azaltmak için konu tekrarı yap.');
        }
        if (classResults.length > 1 && result.net_score < classAverage) {
          recommendations.push('• Sınıf ortalamasını yakalamak için düzenli çalış.');
        }
        if (recommendations.length === 0) {
          recommendations.push('• Harika bir performans! Böyle devam et.');
        }

        recommendations.forEach(rec => {
          pdf.text(rec, margin + 2, yPos);
          yPos += 5;
        });
      }

      // Footer
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, margin, pageHeight - 10);
      pdf.text('Başarı Yolu - Öğrenci Performans Sistemi', pageWidth - margin, pageHeight - 10, { align: 'right' });

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

        {/* Exam Score - Prominent Display */}
        {examScore !== null && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Sınav Puanın</p>
                <p className="text-5xl font-bold">{examScore}</p>
                <p className="text-xl opacity-90 mt-1">/ 500</p>
              </div>
              <div className="p-4 bg-white bg-opacity-20 rounded-xl">
                <Award className="h-16 w-16" />
              </div>
            </div>
          </div>
        )}

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
