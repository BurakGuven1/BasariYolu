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
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { examData } from '../data/examTopics';

// Helper function to convert Turkish characters for PDF compatibility
const toAscii = (text: string): string => {
  const charMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U',
  };
  return text.split('').map(char => charMap[char] || char).join('');
};

interface StudentExamResultDetailProps {
  userId: string;
  institutionId: string;
  templateId: string;
  examDate: string;
  onBack: () => void;
}

// Helper function to calculate exam score based on exam type
const calculateExamScore = (
  template: any,
  topicStats: Map<string, { correct: number; wrong: number; empty: number }>,
  netScore: number
): number | null => {
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
    const aytHamPuan = (netScore * 5) + 100;
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

  const downloadPDF = async (
    topicStats: Map<string, { correct: number; wrong: number; empty: number }>,
    template: any,
    examScore: number | null,
    improvement: number | null,
    classAverage: number
  ) => {
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
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      let yPos = margin;

      // PAGE 1: HEADER & STATISTICS
      // Header with gradient effect
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('SINAV PERFORMANS RAPORU'), pageWidth / 2, 12, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(toAscii(`${template?.name || ''} - ${new Date(examDate).toLocaleDateString('tr-TR')}`), pageWidth / 2, 22, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      yPos = 38;

      // Exam Score Box (prominent)
      if (examScore !== null) {
        pdf.setFillColor(240, 240, 255);
        pdf.roundedRect(margin, yPos, contentWidth, 16, 2, 2, 'F');
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(79, 70, 229);
        pdf.text(toAscii('SINAV PUANI:'), margin + 4, yPos + 6);
        pdf.setFontSize(14);
        pdf.text(`${examScore} / 500`, margin + 45, yPos + 6);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(toAscii(`Sinav Turu: ${template?.exam_type || ''}`), margin + contentWidth - 50, yPos + 6);
        yPos += 20;
      }

      // Statistics table using autoTable (supports Turkish characters)
      autoTable(pdf, {
        startY: yPos,
        head: [['Dogru', 'Yanlis', 'Bos', 'Net']],
        body: [[
          String(result.correct_count),
          String(result.wrong_count),
          String(result.empty_count),
          result.net_score.toFixed(2),
        ]],
        theme: 'grid',
        styles: {
          fontSize: 10,
          halign: 'center',
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 10,
          font: 'helvetica',
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: contentWidth / 4 },
          1: { cellWidth: contentWidth / 4 },
          2: { cellWidth: contentWidth / 4 },
          3: { cellWidth: contentWidth / 4 },
        },
        margin: { left: margin, right: margin },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 8;

      // Weak Topics Section (compact)
      const weakTopics = Array.from(topicStats.entries())
        .map(([topic, stats]) => {
          const total = stats.correct + stats.wrong + stats.empty;
          const successRate = total > 0 ? (stats.correct / total) * 100 : 0;
          return { topic, stats, total, successRate };
        })
        .filter(t => t.successRate < 60)
        .sort((a, b) => a.successRate - b.successRate);

      // Check for recurring weak topics from previous exams
      const recurringWeakTopics = weakTopics.filter(wt => {
        // Check if this topic was also weak in previous exams
        const wasWeakBefore = previousResults.some(prevResult => {
          const prevTemplate = prevResult.template as any;
          const prevMapping = prevTemplate?.question_mapping || [];
          const prevTopicStats = new Map<string, { correct: number; wrong: number; empty: number }>();

          Object.entries(prevResult.answers).forEach(([qNum, answer]: [string, any]) => {
            const q = prevMapping.find((m: any) => m.questionNumber === parseInt(qNum));
            if (q?.topic === wt.topic) {
              if (!prevTopicStats.has(q.topic)) {
                prevTopicStats.set(q.topic, { correct: 0, wrong: 0, empty: 0 });
              }
              const s = prevTopicStats.get(q.topic)!;
              if (answer.studentAnswer === 'X') s.empty++;
              else if (answer.isCorrect) s.correct++;
              else s.wrong++;
            }
          });

          const stats = prevTopicStats.get(wt.topic);
          if (stats) {
            const total = stats.correct + stats.wrong + stats.empty;
            const rate = total > 0 ? (stats.correct / total) * 100 : 0;
            return rate < 60;
          }
          return false;
        });
        return wasWeakBefore;
      });

      if (weakTopics.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(194, 65, 12);
        pdf.text(toAscii('ACIL CALISILMASI GEREKEN KONULAR'), margin, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 6;

        // Use autoTable for compact display
        const weakTopicData = weakTopics.slice(0, 10).map(wt => {
          const isRecurring = recurringWeakTopics.some(r => r.topic === wt.topic);
          return [
            (isRecurring ? '* ' : '') + toAscii(wt.topic),
            `${wt.stats.correct}`,
            `${wt.stats.wrong}`,
            `${wt.stats.empty}`,
            `%${Math.round(wt.successRate)}`,
          ];
        });

        autoTable(pdf, {
          startY: yPos,
          head: [[toAscii('Konu'), 'D', 'Y', 'B', toAscii('Basari')]],
          body: weakTopicData,
          theme: 'striped',
          styles: {
            fontSize: 7,
            cellPadding: 1.5,
            font: 'helvetica',
          },
          headStyles: {
            fillColor: [255, 243, 205],
            textColor: [0, 0, 0],
            fontSize: 8,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: contentWidth * 0.50 },
            1: { cellWidth: contentWidth * 0.10, halign: 'center' },
            2: { cellWidth: contentWidth * 0.10, halign: 'center' },
            3: { cellWidth: contentWidth * 0.10, halign: 'center' },
            4: { cellWidth: contentWidth * 0.20, halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        yPos = (pdf as any).lastAutoTable.finalY + 6;

        // Note about recurring topics
        if (recurringWeakTopics.length > 0) {
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(220, 38, 38);
          pdf.text(toAscii(`* = Bu konu onceki denemede de zayifti (${recurringWeakTopics.length} tekrarlayan konu)`), margin, yPos);
          pdf.setTextColor(0, 0, 0);
          yPos += 5;
        }
      }

      // Check if we need a new page
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      // PAGE 2: TOPIC ANALYSIS TABLE
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('KONU BAZLI DETAYLI ANALIZ'), margin, yPos);
      yPos += 6;

      const topicsArray = Array.from(topicStats.entries());
      const topicTableData = topicsArray.map(([topic, stats]) => {
        const total = stats.correct + stats.wrong + stats.empty;
        const successRate = total > 0 ? (stats.correct / total) * 100 : 0;
        return [
          toAscii(topic),
          String(stats.correct),
          String(stats.wrong),
          String(stats.empty),
          `%${Math.round(successRate)}`,
        ];
      });

      autoTable(pdf, {
        startY: yPos,
        head: [[toAscii('Konu'), toAscii('Dogru'), toAscii('Yanlis'), toAscii('Bos'), toAscii('Basari')]],
        body: topicTableData,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.45 },
          1: { cellWidth: contentWidth * 0.12, halign: 'center' },
          2: { cellWidth: contentWidth * 0.12, halign: 'center' },
          3: { cellWidth: contentWidth * 0.12, halign: 'center' },
          4: { cellWidth: contentWidth * 0.19, halign: 'right' },
        },
        margin: { left: margin, right: margin },
        didParseCell: (data) => {
          // Color code success rates
          if (data.column.index === 4 && data.section === 'body') {
            const rate = parseInt(data.cell.text[0].replace('%', ''));
            if (rate >= 75) {
              data.cell.styles.textColor = [22, 163, 74]; // green
            } else if (rate >= 50) {
              data.cell.styles.textColor = [234, 179, 8]; // yellow
            } else {
              data.cell.styles.textColor = [220, 38, 38]; // red
            }
          }
        },
      });

      yPos = (pdf as any).lastAutoTable.finalY + 6;

      // Smart Recommendations with Topic Frequency Analysis
      if (yPos < pageHeight - 50) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(toAscii('KISISELLESTIRILMIS ONERILER VE STRATEJI'), margin, yPos);
        yPos += 5;

        const recommendations: string[] = [];

        // Analyze topic frequency from examData
        const examType = template?.exam_type;
        let subjectKey = '';
        if (examType === 'TYT' || examType === 'AYT') {
          // Determine subject based on topics
          const firstTopic = topicsArray[0]?.[0] || '';
          if (firstTopic.toLowerCase().includes('matematik') || firstTopic.toLowerCase().includes('geometri')) {
            subjectKey = examType === 'TYT' ? 'TYT Matematik' : 'AYT Matematik';
          } else if (firstTopic.toLowerCase().includes('fizik')) {
            subjectKey = 'TYT Fizik';
          } else if (firstTopic.toLowerCase().includes('kimya')) {
            subjectKey = 'TYT Kimya';
          } else if (firstTopic.toLowerCase().includes('türkçe') || firstTopic.toLowerCase().includes('paragraf')) {
            subjectKey = 'TYT Turkce';
          }
        }

        // Check which weak topics have high frequency in recent exams
        const highFrequencyWeakTopics: { topic: string; count: number }[] = [];
        if (subjectKey && examData[subjectKey]) {
          weakTopics.forEach(wt => {
            const topicData = examData[subjectKey].konular.find(k =>
              k.konu.toLowerCase().includes(wt.topic.toLowerCase()) ||
              wt.topic.toLowerCase().includes(k.konu.toLowerCase())
            );
            if (topicData) {
              const recent3Years = parseInt(topicData.yillar['2023'] || '0') +
                                  parseInt(topicData.yillar['2024'] || '0') +
                                  parseInt(topicData.yillar['2025'] || '0');
              if (recent3Years >= 15) {
                highFrequencyWeakTopics.push({ topic: wt.topic, count: recent3Years });
              }
            }
          });
        }

        // Priority recommendations based on high-frequency weak topics
        if (highFrequencyWeakTopics.length > 0) {
          recommendations.push(toAscii(`🎯 KRITIK: ${highFrequencyWeakTopics[0].topic} konusu son 3 yilda ${highFrequencyWeakTopics[0].count}+ soru cikti! Bu konuya oncelikle calis.`));
        }

        // Recurring weak topics
        if (recurringWeakTopics.length > 0) {
          const topics = recurringWeakTopics.slice(0, 2).map(t => toAscii(t.topic)).join(', ');
          recommendations.push(toAscii(`⚠️ TEKRAR EDEN ZAYIFLIK: ${topics} surekli dusuk kalıyor. Farkli kaynaklardan calis, konu anlatim videolari izle.`));
        }

        // Performance-based recommendations
        const successRate = (result.correct_count / (result.correct_count + result.wrong_count + result.empty_count)) * 100;
        if (successRate >= 75) {
          recommendations.push(toAscii(`✨ MUKEMMEL: %${Math.round(successRate)} basari orani! Suanki tempoyu koruyarak zor sorulara odaklan.`));
        } else if (successRate >= 60) {
          recommendations.push(toAscii(`💪 IYI GIDIYORSUN: %${Math.round(successRate)} basari var. Zayif konulara her gun 30 dk ayir.`));
        } else {
          recommendations.push(toAscii(`📚 TEMEL GUCLENDIR: %${Math.round(successRate)} basari dusuk. Once temel konulari pekistir, sonra ileri seviyeye gec.`));
        }

        // Empty answer strategy
        if (result.empty_count > template?.total_questions * 0.15) {
          recommendations.push(toAscii(`⏰ ZAMAN YONETIMI: ${result.empty_count} soru bos - tahmin teknikleri calis, zaman yonetimini iyilestir.`));
        } else if (result.empty_count > 0) {
          recommendations.push(toAscii(`👍 BOS AZALDI: ${result.empty_count} bos iyi bir seviye. Bilinmeyen sorularda eliminasyon yontemi kullan.`));
        }

        // Wrong answer reduction
        if (result.wrong_count > result.correct_count) {
          recommendations.push(toAscii(`🔍 YANLIS AZALT: Yanlis sayisi (${result.wrong_count}) cok yuksek. Acele etme, soru koklerini dikkatli oku.`));
        } else {
          const netPenalty = Math.round(result.wrong_count * 0.25 * 10) / 10;
          recommendations.push(toAscii(`📊 NET KAYBI: ${netPenalty} net yanlis yuzunden gitti. Emin olmadan isaretleme!`));
        }

        // Improvement tracking
        if (improvement !== null) {
          if (improvement > 5) {
            recommendations.push(toAscii(`🚀 SUPER ILERLEME: +${improvement.toFixed(1)} net artis! Bu calisma planini surdurmek kilit.`));
          } else if (improvement > 0) {
            recommendations.push(toAscii(`📈 ILERLEME VAR: +${improvement.toFixed(1)} net artis. Tutarli calismayla bu hiz katlanacak.`));
          } else if (improvement < -3) {
            recommendations.push(toAscii(`⚡ DIKKAT: ${Math.abs(improvement).toFixed(1)} net dustu. Calisma yontemini gozden gecir, dinlenmeye dikkat et.`));
          }
        }

        // Class comparison
        if (classResults.length > 1) {
          if (result.net_score > classAverage + 5) {
            recommendations.push(toAscii(`🏆 SINIF LIDERI: Sinif ortalamasinin ${(result.net_score - classAverage).toFixed(1)} net ustuunde! Hedef daha yuksek!`));
          } else if (result.net_score > classAverage) {
            recommendations.push(toAscii(`👏 ORTALAMA USTU: +${(result.net_score - classAverage).toFixed(1)} net avantajlisin. Bu farki acmak icin zor sorulara odaklan.`));
          } else {
            recommendations.push(toAscii(`💡 POTANSIYEL VAR: Sinif ort. ${classAverage.toFixed(1)}, sen ${result.net_score.toFixed(1)}. Gunluk duzenli calismayla yakala!`));
          }
        }

        // Study plan recommendations
        if (weakTopics.length >= 10) {
          recommendations.push(toAscii(`📅 AKILLI PLAN: ${weakTopics.length} zayif konu var. Her gun 2-3 konuya odaklan, hepsini birden yapmaya calisma.`));
        } else if (weakTopics.length > 0) {
          recommendations.push(toAscii(`✅ ODAKLI CALIS: ${weakTopics.length} konuya her gun 1 saat ayir. 2 haftada hepsini guclendirebilirsin.`));
        } else {
          recommendations.push(toAscii(`🌟 MUKEMMEL DENGE: Tum konularda iyisin! Simdi hiz ve dogru calisarak net sayini artir.`));
        }

        // Motivational closing
        if (examScore && examScore >= 400) {
          recommendations.push(toAscii(`🎓 HEDEF 500: ${examScore} puanla cok yakinsin! Zayif konulari kapatin, 500\'e ulasabilirsin!`));
        }

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        recommendations.slice(0, 8).forEach((rec, idx) => {
          const lines = pdf.splitTextToSize(rec, contentWidth - 4);
          lines.forEach((line: string) => {
            if (yPos > pageHeight - 15) return;
            pdf.text(line, margin + 2, yPos);
            yPos += 3.5;
          });
        });
      }

      // Footer on each page
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(128, 128, 128);
        pdf.text(toAscii(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`), margin, pageHeight - 8);
        pdf.text(toAscii(`Sayfa ${i} / ${pageCount}`), pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text(toAscii('Basari Yolu'), pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      const fileName = toAscii(`Sinav_Raporu_${template?.name || 'Deneme'}_${examDate}.pdf`).replace(/\s+/g, '_');
      pdf.save(fileName);
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

  // Calculate exam score using the helper function
  const examScore = calculateExamScore(template, topicStats, result.net_score);

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
          onClick={() => downloadPDF(topicStats, template, examScore, improvement, classAverage)}
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
