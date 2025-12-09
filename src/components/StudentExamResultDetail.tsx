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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

interface InstitutionInfo {
  name: string;
  studentName: string;
  studentEmail: string;
}

interface StudentExamResultDetailProps {
  userId: string;
  institutionId: string;
  templateId: string;
  examDate: string;
  onBack: () => void;
  institutionInfo?: InstitutionInfo;
}

type QuestionStats = { correct: number; wrong: number; empty: number };
const normalizeSubject = (value: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');


// Helper function to calculate exam score based on OSYM-style formulas
const calculateExamScore = (
  template: any,
  subjectStats: Map<string, QuestionStats>,
  netScore: number
): number | null => {
  const examType = template?.exam_type;
  if (!examType) return null;

  const sumStats = (aliases: string[]): QuestionStats => {
    const combined: QuestionStats = { correct: 0, wrong: 0, empty: 0 };
    const normalizedAliases = aliases.map(alias => normalizeSubject(alias));

    subjectStats.forEach((stats, subject) => {
      const key = normalizeSubject(subject);
      if (normalizedAliases.some(alias => alias && key.includes(alias))) {
        combined.correct += stats.correct;
        combined.wrong += stats.wrong;
        combined.empty += stats.empty;
      }
    });

    return combined;
  };

  const totalQuestions = (stats: QuestionStats) => stats.correct + stats.wrong + stats.empty;
  const calculateNet = (stats: QuestionStats, wrongPenalty: number) =>
    Math.max(0, stats.correct - stats.wrong / wrongPenalty);

  // TYT: base 100 + weighted nets
  if (examType === 'TYT') {
    // Geometri sorular��n�� matemati��e ekle
    const turkce = sumStats(['turk', 'turkce']);
    const matematik = sumStats(['matematik', 'geometri']);
    const fen = sumStats(['fen', 'fizik', 'kimya', 'biyoloji']);
    const sosyal = sumStats(['sosyal', 'tarih', 'inkilap', 'cografya', 'felsefe', 'din']);

    const turkceNet = calculateNet(turkce, 4);
    const matematikNet = calculateNet(matematik, 4);
    const fenNet = calculateNet(fen, 4);
    const sosyalNet = calculateNet(sosyal, 4);

    const weighted = 100 + turkceNet * 1.32 + matematikNet * 1.32 + sosyalNet * 0.44 + fenNet * 0.44;
    const totalQ = template?.total_questions || 120;
    const scaled = 100 + Math.max(0, netScore) * (400 / totalQ);
    const hamPuan = Math.max(weighted, scaled);
    return Math.min(500, Math.max(100, Math.round(hamPuan * 100) / 100));
  }

  // AYT: SAY / EA / SÖZ katsay��lar��
  if (examType === 'AYT') {
    const matematik = sumStats(['matematik', 'geometri']);
    const fizik = sumStats(['fizik']);
    const kimya = sumStats(['kimya']);
    const biyoloji = sumStats(['biyoloji']);
    const edebiyat = sumStats(['edebiyat']);
    const tarih = sumStats(['tarih']);
    const cografya = sumStats(['cografya']);
    const felsefe = sumStats(['felsefe']);
    const din = sumStats(['din']);

    const matematikNet = calculateNet(matematik, 4);
    const fizikNet = calculateNet(fizik, 4);
    const kimyaNet = calculateNet(kimya, 4);
    const biyolojiNet = calculateNet(biyoloji, 4);
    const edebiyatNet = calculateNet(edebiyat, 4);
    const tarihNet = calculateNet(tarih, 4);
    const cografyaNet = calculateNet(cografya, 4);
    const felsefeNet = calculateNet(felsefe, 4);
    const dinNet = calculateNet(din, 4);

    const scienceTotal = totalQuestions(fizik) + totalQuestions(kimya) + totalQuestions(biyoloji);
    const sozelTotal = totalQuestions(edebiyat) + totalQuestions(tarih) + totalQuestions(cografya) + totalQuestions(felsefe) + totalQuestions(din);
    const eaTotal = totalQuestions(edebiyat) + totalQuestions(tarih) + totalQuestions(cografya);

    let hamPuan = 100;

    if (scienceTotal > 0) {
      // AYT-SAY
      hamPuan += matematikNet * 3.0 + fizikNet * 2.85 + kimyaNet * 3.07 + biyolojiNet * 3.07;
    } else if (sozelTotal > 0) {
      // AYT-S?Z
      hamPuan += edebiyatNet * 3.0 + tarihNet * 2.8 + cografyaNet * 3.33 + felsefeNet * 3.07 + dinNet * 3.07;
    } else if (eaTotal > 0 || totalQuestions(matematik) > 0) {
      // AYT-EA
      hamPuan += matematikNet * 3.0 + edebiyatNet * 2.8 + tarihNet * 3.33 + cografyaNet * 3.33;
    } else {
      hamPuan = netScore * 5 + 100;
    }

    const totalQ = template?.total_questions || 80;
    const scaled = 100 + Math.max(0, netScore) * (400 / totalQ);
    const finalScore = Math.max(hamPuan, scaled);

    return Math.min(500, Math.max(100, Math.round(finalScore * 100) / 100));
  }

  // LGS: 500'l��k sistem, 3 yanl�� Y 1 do��ru
  if (examType === 'LGS') {
    const turkce = sumStats(['turk', 'turkce']);
    const matematik = sumStats(['matematik', 'geometri']);
    const fen = sumStats(['fen', 'fenbilimleri', 'fizik', 'kimya', 'biyoloji']);
    const inkilap = sumStats(['inkilap', 'tarih']);
    const din = sumStats(['din']);
    const ingilizce = sumStats(['ingilizce', 'english']);

    const turkceNet = calculateNet(turkce, 3);
    const matematikNet = calculateNet(matematik, 3);
    const fenNet = calculateNet(fen, 3);
    const inkilapNet = calculateNet(inkilap, 3);
    const dinNet = calculateNet(din, 3);
    const ingilizceNet = calculateNet(ingilizce, 3);

    const katsayiliToplam = turkceNet * 4 + matematikNet * 4 + fenNet * 4 + inkilapNet * 1 + dinNet * 1 + ingilizceNet * 1;
    const hamPuan = (katsayiliToplam * 500) / 270;
    const totalQ = template?.total_questions || 90;
    const scaled = Math.max(0, netScore) * (500 / totalQ);
    const finalScore = Math.max(hamPuan, scaled);
    return Math.min(500, Math.max(0, Math.round(finalScore * 100) / 100));
  }

  return null;
};
export default function StudentExamResultDetail({
  userId,
  institutionId,
  templateId,
  examDate,
  onBack,
  institutionInfo,
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
    topicStats: Map<string, QuestionStats>,
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
      pdf.rect(0, 0, pageWidth, institutionInfo ? 38 : 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('SINAV PERFORMANS RAPORU'), pageWidth / 2, 12, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(toAscii(`${template?.name || ''} - ${new Date(examDate).toLocaleDateString('tr-TR')}`), pageWidth / 2, 22, { align: 'center' });

      // Kurum bilgileri varsa ekle
      if (institutionInfo) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text(toAscii(institutionInfo.name), pageWidth / 2, 30, { align: 'center' });
        pdf.text(toAscii(`Ogrenci: ${institutionInfo.studentName}`), pageWidth / 2, 36, { align: 'center' });
      }

      pdf.setTextColor(0, 0, 0);
      yPos = institutionInfo ? 46 : 38;

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
          const prevTopicStats = new Map<string, QuestionStats>();

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
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(toAscii('KISISELLESTIRILMIS ONERILER VE STRATEJI'), margin, yPos);
        yPos += 7;

        const recommendations: Array<{ icon: string; title: string; text: string; type: 'success' | 'warning' | 'info' }> = [];

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

        // Calculate success rate and strong topics
        const successRate = (result.correct_count / (result.correct_count + result.wrong_count + result.empty_count)) * 100;
        const strongTopics = Array.from(topicStats.entries())
          .map(([topic, stats]) => {
            const total = stats.correct + stats.wrong + stats.empty;
            const rate = total > 0 ? (stats.correct / total) * 100 : 0;
            return { topic, rate, total };
          })
          .filter(t => t.rate >= 80 && t.total >= 3)
          .sort((a, b) => b.rate - a.rate);

        // 1. Celebrate strong performance
        if (strongTopics.length > 0) {
          const topStrong = strongTopics.slice(0, 2).map(t => toAscii(t.topic)).join(', ');
          recommendations.push({
            icon: '[+]',
            title: toAscii('TEBRIKLER - GUCLU KONULAR'),
            text: toAscii(`${topStrong} konularında mükemmel performans! Bu konulardaki başarını koruyarak diğer alanlara odaklanabilirsin.`),
            type: 'success'
          });
        }

        // 2. Overall performance feedback
        if (successRate >= 75) {
          recommendations.push({
            icon: '[+]',
            title: toAscii('MÜKEMMEL PERFORMANS'),
            text: toAscii(`%${Math.round(successRate)} başarı oranı gösterdin! Şuanki çalışma tempoyu koruyarak daha zor sorulara odaklanabilirsin.`),
            type: 'success'
          });
        } else if (successRate >= 60) {
          recommendations.push({
            icon: '[*]',
            title: toAscii('İYİ GİDİYORSUN'),
            text: toAscii(`%${Math.round(successRate)} başarı oranıyla iyi bir seviyedesin. Zayıf konulara günlük 30-45 dakika ayırarak başarı oranını daha da artırabilirsin.`),
            type: 'info'
          });
        } else {
          recommendations.push({
            icon: '[!]',
            title: toAscii('TEMEL GÜÇLENDİR'),
            text: toAscii(`%${Math.round(successRate)} başarı oranı. Önce temel konuları pekiştir, konu anlatım videoları izle, sonra soru çözmeye odaklan.`),
            type: 'warning'
          });
        }

        // 3. High-frequency weak topics (CRITICAL)
        if (highFrequencyWeakTopics.length > 0) {
          recommendations.push({
            icon: '[!]',
            title: toAscii('KRITIK ONCELIK'),
            text: toAscii(`${highFrequencyWeakTopics[0].topic} konusu son 3 yılda ${highFrequencyWeakTopics[0].count}+ soru çıktı ve senin zayıf konun! Bu konuya öncelikle çalış.`),
            type: 'warning'
          });
        }

        // 4. Recurring weak topics
        if (recurringWeakTopics.length > 0) {
          const topics = recurringWeakTopics.slice(0, 2).map(t => toAscii(t.topic)).join(', ');
          recommendations.push({
            icon: '[!]',
            title: toAscii('TEKRAR EDEN ZAYIFLIK'),
            text: toAscii(`${topics} konuları birden fazla denemede düşük. Farklı kaynaklardan çalış, konu anlatım videoları izle, alternatif çözüm yöntemleri öğren.`),
            type: 'warning'
          });
        }

        // 5. Wrong answer analysis
        if (result.wrong_count > result.correct_count) {
          recommendations.push({
            icon: '[!]',
            title: toAscii('DIKKAT: YANLIS SAYISI YUKSEK'),
            text: toAscii(`${result.wrong_count} yanlış cevap var. Soruları aceleye getirme, soru köklerini dikkatli oku, emin olmadığın soruları boş bırak.`),
            type: 'warning'
          });
        } else if (result.wrong_count > 0) {
          const netPenalty = Math.round(result.wrong_count * 0.25);
          recommendations.push({
            icon: '[*]',
            title: toAscii('NET KAYBI'),
            text: toAscii(`${netPenalty} net yanlış cevaplar yüzünden kayıp oldu. Emin olmadığın sorularda tahmin yerine boş bırakmayı tercih et.`),
            type: 'info'
          });
        }

        // 6. Empty answer strategy
        if (result.empty_count > template?.total_questions * 0.15) {
          recommendations.push({
            icon: '[*]',
            title: toAscii('ZAMAN YÖNETİMİ'),
            text: toAscii(`${result.empty_count} soru boş kaldı. Zaman yönetimini iyileştir, kolay sorularla başlayıp zor sorulara geç, tahmin teknikleri çalış.`),
            type: 'info'
          });
        }

        // 7. Improvement tracking
        if (improvement !== null) {
          if (improvement > 5) {
            recommendations.push({
              icon: '[+]',
              title: toAscii('SÜPER İLERLEME'),
              text: toAscii(`Önceki denemelere göre +${improvement.toFixed(1)} net artış! Bu çalışma planını sürdürmek çok önemli, böyle devam et!`),
              type: 'success'
            });
          } else if (improvement > 0) {
            recommendations.push({
              icon: '[+]',
              title: toAscii('İLERLEME KAYDEDİYORSUN'),
              text: toAscii(`+${improvement.toFixed(1)} net artış gösterdin. Tutarlı çalışmayla bu ilerleme hızı daha da artacak.`),
              type: 'success'
            });
          } else if (improvement < -3) {
            recommendations.push({
              icon: '[!]',
              title: toAscii('DİKKAT: DÜŞÜŞ VAR'),
              text: toAscii(`${Math.abs(improvement).toFixed(1)} net azalma olmuş. Çalışma yöntemini gözden geçir, dinlenmeye ve düzene dikkat et, stres yönetimi yap.`),
              type: 'warning'
            });
          }
        }

        // 8. Class comparison
        if (classResults.length > 1) {
          if (result.net_score > classAverage + 5) {
            recommendations.push({
              icon: '[+]',
              title: toAscii('SINIF LİDERİ'),
              text: toAscii(`Sınıf ortalamasının ${(result.net_score - classAverage).toFixed(1)} net üstündesin! Hedeflerini daha yüksek belirleyebilirsin.`),
              type: 'success'
            });
          } else if (result.net_score > classAverage) {
            recommendations.push({
              icon: '[+]',
              title: toAscii('ORTALAMA ÜSTÜ'),
              text: toAscii(`Sınıf ortalamasından ${(result.net_score - classAverage).toFixed(1)} net öndesin. Bu farkı açmak için zor sorulara odaklan.`),
              type: 'success'
            });
          } else if (result.net_score < classAverage - 3) {
            recommendations.push({
              icon: '[*]',
              title: toAscii('POTANSIYEL VAR'),
              text: toAscii(`Sınıf ort. ${classAverage.toFixed(1)}, sen ${result.net_score.toFixed(1)}. ünlük düzenli çalışma ve konu pekiştirme ile ortalamaya ulaşabilirsin.`),
              type: 'info'
            });
          }
        }

        // 9. Study plan
        if (weakTopics.length >= 10) {
          recommendations.push({
            icon: '[*]',
            title: toAscii('AKILLI ÇALIŞMA PLANI'),
            text: toAscii(`${weakTopics.length} zayıf konu tespit edildi. günlük 2-3 konuya odaklan, hepsini birden çözmeye çalışma. Önce en zayıf 5 konuya öncelik ver.`),
            type: 'info'
          });
        } else if (weakTopics.length > 0) {
          recommendations.push({
            icon: '[*]',
            title: toAscii('ODAKLI ÇALIŞMA PLANI'),
            text: toAscii(`${weakTopics.length} zayıf konuya her gün 45-60 dakika ayır. Konu anlatımı izle, örnekler çöz, test çöz. 2 haftada tamamını güçlendirebilirsin.`),
            type: 'info'
          });
        } else {
          recommendations.push({
            icon: '[+]',
            title: toAscii('MÜKEMMEL DENGE'),
            text: toAscii(`Tüm konularda başarılıyız! Şimdi hız ve doğruluk çalışmaları yaparak net sayını daha da artır, zaman yönetimini iyileştir.`),
            type: 'success'
          });
        }

        // 10. Motivational closing
        if (examScore && examScore >= 450) {
          recommendations.push({
            icon: '[+]',
            title: toAscii('HEDEF 500 PUAN'),
            text: toAscii(`${examScore} puanla 500'e çok yakınsın! Zayıf konuları kapat, deneme çözmeye devam et. Hedefine ulaşabilirsin!`),
            type: 'success'
          });
        }

        // Render recommendations with better formatting
        pdf.setFont('helvetica', 'normal');
        recommendations.slice(0, 8).forEach((rec) => {
          if (yPos > pageHeight - 20) return;

          // Icon and title
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');

          // Set color based on type
          if (rec.type === 'success') {
            pdf.setTextColor(22, 163, 74); // green
          } else if (rec.type === 'warning') {
            pdf.setTextColor(220, 38, 38); // red
          } else {
            pdf.setTextColor(79, 70, 229); // indigo
          }

          pdf.text(`${rec.icon} ${rec.title}`, margin, yPos);
          yPos += 4;

          // Body text
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          const lines = pdf.splitTextToSize(rec.text, contentWidth - 8);
          lines.forEach((line: string) => {
            if (yPos > pageHeight - 15) return;
            pdf.text(line, margin + 4, yPos);
            yPos += 3;
          });

          yPos += 2; // spacing between recommendations
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
  const topicStats = new Map<string, QuestionStats>();
  const subjectStats = new Map<string, QuestionStats>();

  Object.entries(result.answers).forEach(([questionNumStr, answer]) => {
    const questionNum = parseInt(questionNumStr);
    const question = questionMapping.find((q: any) => q.questionNumber === questionNum);

    if (question) {
      const topic = question.topic;
      const topicLower = (topic || '').toLowerCase();
      let subject = question.subject || '';

      // Ders bilgisi yoksa konudan tahmin et
      if (!subject) {
        if (topicLower.includes('türk') || topicLower.includes('dil') || topicLower.includes('paragraf')) subject = 'Turkce';
        else if (topicLower.includes('mat') || topicLower.includes('geo') || topicLower.includes('say')) subject = 'Matematik';
        else if (topicLower.includes('fiz')) subject = 'Fizik';
        else if (topicLower.includes('kim')) subject = 'Kimya';
        else if (topicLower.includes('biyo')) subject = 'Biyoloji';
        else if (topicLower.includes('fen')) subject = 'Fen';
        else if (topicLower.includes('tarih') || topicLower.includes('ink')) subject = 'Tarih';
        else if (topicLower.includes('coğ') || topicLower.includes('cog')) subject = 'Cografya';
        else if (topicLower.includes('felsefe')) subject = 'Felsefe';
        else if (topicLower.includes('din') || topicLower.includes('dkab')) subject = 'Din';
        else if (topicLower.includes('edeb')) subject = 'Edebiyat';
        else if (topicLower.includes('ing') || topicLower.includes('english')) subject = 'Ingilizce';
      }

      if (!subject) subject = 'Diger';

      if (!topicStats.has(topic)) {
        topicStats.set(topic, { correct: 0, wrong: 0, empty: 0 });
      }
      if (!subjectStats.has(subject)) {
        subjectStats.set(subject, { correct: 0, wrong: 0, empty: 0 });
      }

      const topicStat = topicStats.get(topic)!;
      const subjectStat = subjectStats.get(subject)!;
      if (answer.studentAnswer === 'X') {
        topicStat.empty++;
        subjectStat.empty++;
      } else if (answer.isCorrect) {
        topicStat.correct++;
        subjectStat.correct++;
      } else {
        topicStat.wrong++;
        subjectStat.wrong++;
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
  const examScore = calculateExamScore(template, subjectStats, result.net_score);

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
                {previousResults.slice(0, 3).map((prevResult) => (
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
