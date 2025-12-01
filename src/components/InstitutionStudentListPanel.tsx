import { useState, useEffect } from 'react';
import { Users, Download, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchExternalExamResults, type ExternalExamResult } from '../lib/institutionExternalExamApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InstitutionStudentListPanelProps {
  institutionId: string;
}

interface Student {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  examCount: number;
  results: ExternalExamResult[];
}

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

export default function InstitutionStudentListPanel({ institutionId }: InstitutionStudentListPanelProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [institutionId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Onaylı öğrencileri getir
      const { data: studentRequests, error: studentError } = await supabase
        .from('institution_student_requests')
        .select('user_id, full_name, email, phone')
        .eq('institution_id', institutionId)
        .eq('status', 'approved')
        .order('full_name');

      if (studentError) throw studentError;

      if (!studentRequests || studentRequests.length === 0) {
        setStudents([]);
        return;
      }

      // Tüm deneme sonuçlarını getir
      const allResults = await fetchExternalExamResults(institutionId);

      // Öğrencilere göre grupla
      const studentsWithResults: Student[] = studentRequests.map(req => {
        const studentResults = allResults.filter(r => r.user_id === req.user_id);
        return {
          userId: req.user_id,
          fullName: req.full_name,
          email: req.email,
          phone: req.phone,
          examCount: studentResults.length,
          results: studentResults.sort((a, b) =>
            new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
          ),
        };
      });

      setStudents(studentsWithResults);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err.message || 'Öğrenci listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceAnalysisPDF = async (student: Student) => {
    if (student.results.length === 0) {
      alert('Bu öğrencinin henüz deneme sonucu yok.');
      return;
    }

    try {
      setDownloadingId(student.userId);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let yPosition = 20;

      // Başlık
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('DENEME PERFORMANS ANALIZI'), 105, yPosition, { align: 'center' });
      yPosition += 10;

      // Öğrenci bilgileri
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(toAscii(`Ogrenci: ${student.fullName}`), 20, yPosition);
      yPosition += 7;
      pdf.text(toAscii(`E-posta: ${student.email}`), 20, yPosition);
      yPosition += 7;
      pdf.text(toAscii(`Toplam Deneme: ${student.examCount}`), 20, yPosition);
      yPosition += 10;

      // Çizgi
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, yPosition, 190, yPosition);
      yPosition += 10;

      // Deneme sonuçları tablosu
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('Deneme Sonuclari'), 20, yPosition);
      yPosition += 7;

      const tableData = student.results.map((result, index) => {
        const examName = result.template?.name || 'Bilinmiyor';
        const examDate = new Date(result.exam_date).toLocaleDateString('tr-TR');
        const correct = result.correct_count;
        const wrong = result.wrong_count;
        const empty = result.empty_count;
        const net = result.net_score.toFixed(2);
        const score = result.score ? result.score.toFixed(2) : '-';

        return [
          (index + 1).toString(),
          toAscii(examName),
          examDate,
          `${correct}D`,
          `${wrong}Y`,
          `${empty}B`,
          net,
          score,
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [[
          toAscii('#'),
          toAscii('Deneme Adi'),
          toAscii('Tarih'),
          toAscii('Dogru'),
          toAscii('Yanlis'),
          toAscii('Bos'),
          toAscii('Net'),
          toAscii('Puan'),
        ]],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 60 },
          2: { cellWidth: 25 },
          3: { cellWidth: 15 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 },
        },
      });

      // @ts-ignore
      yPosition = pdf.lastAutoTable.finalY + 15;

      // İstatistikler
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('Genel Istatistikler'), 20, yPosition);
      yPosition += 10;

      const totalCorrect = student.results.reduce((sum, r) => sum + r.correct_count, 0);
      const totalWrong = student.results.reduce((sum, r) => sum + r.wrong_count, 0);
      const totalEmpty = student.results.reduce((sum, r) => sum + r.empty_count, 0);
      const avgNet = student.results.reduce((sum, r) => sum + r.net_score, 0) / student.results.length;
      const avgScore = student.results.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) /
        student.results.filter(r => r.score).length;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(toAscii(`Toplam Dogru: ${totalCorrect}`), 20, yPosition);
      yPosition += 6;
      pdf.text(toAscii(`Toplam Yanlis: ${totalWrong}`), 20, yPosition);
      yPosition += 6;
      pdf.text(toAscii(`Toplam Bos: ${totalEmpty}`), 20, yPosition);
      yPosition += 6;
      pdf.text(toAscii(`Ortalama Net: ${avgNet.toFixed(2)}`), 20, yPosition);
      yPosition += 6;
      if (!isNaN(avgScore)) {
        pdf.text(toAscii(`Ortalama Puan: ${avgScore.toFixed(2)}`), 20, yPosition);
        yPosition += 6;
      }

      // Gelişim analizi
      yPosition += 10;
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(toAscii('Gelisim Analizi'), 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      if (student.results.length >= 2) {
        const firstNet = student.results[student.results.length - 1].net_score;
        const lastNet = student.results[0].net_score;
        const improvement = lastNet - firstNet;
        const improvementPercent = ((improvement / firstNet) * 100).toFixed(1);

        if (improvement > 0) {
          pdf.setTextColor(0, 150, 0);
          pdf.text(
            toAscii(`Net skorunuz ${improvement.toFixed(2)} puan artis gosterdi (${improvementPercent}% iyilesme)`),
            20,
            yPosition
          );
        } else if (improvement < 0) {
          pdf.setTextColor(200, 0, 0);
          pdf.text(
            toAscii(`Net skorunuz ${Math.abs(improvement).toFixed(2)} puan azalis gosterdi (${Math.abs(parseFloat(improvementPercent))}% dusus)`),
            20,
            yPosition
          );
        } else {
          pdf.setTextColor(100, 100, 100);
          pdf.text(toAscii('Net skorunuz sabit kaldi'), 20, yPosition);
        }
        pdf.setTextColor(0, 0, 0);
        yPosition += 7;
      }

      // Tarih bilgisi
      yPosition += 10;
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        toAscii(`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`),
        20,
        yPosition
      );

      // PDF'i indir
      const fileName = `${student.fullName.replace(/\s+/g, '_')}_performans_analizi.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz onaylı öğrenci yok</h3>
        <p className="text-sm text-gray-600">
          Öğrenci başvurularını "Öğrenciler" sekmesinden onaylayabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Öğrenci Listesi</h2>
          <p className="text-sm text-gray-600 mt-1">
            Toplam {students.length} onaylı öğrenci
          </p>
        </div>
      </div>

      {/* Öğrenci listesi */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Öğrenci Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deneme Sayısı
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.userId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{student.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <FileText className="h-4 w-4" />
                      {student.examCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {student.examCount > 0 ? (
                      <button
                        onClick={() => generatePerformanceAnalysisPDF(student)}
                        disabled={downloadingId === student.userId}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingId === student.userId ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            İndiriliyor...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Performans Analizi
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">Henüz deneme yok</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bilgi kutusu */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Performans Analizi Hakkında
            </h3>
            <p className="text-xs text-blue-800">
              Performans analizi PDF'i, öğrencinin tüm deneme sonuçlarını, gelişim grafiğini ve istatistiklerini içerir.
              Bu rapor öğrencilerle paylaşılabilir ve ilerleme takibi için kullanılabilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
