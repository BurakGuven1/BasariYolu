import ExcelJS from 'exceljs';
import { supabase } from './supabase';
import type { InstitutionStudentRequest } from './institutionStudentApi';

/**
 * Export institution students list to Excel using secure ExcelJS
 */
export async function exportStudentsToExcel(institutionId: string, status: 'approved' | 'pending' | 'all' = 'approved') {
  try {
    // Fetch students from institution_student_requests table
    let query = supabase
      .from('institution_student_requests')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: students, error } = await query;

    if (error) {
      throw error;
    }

    if (!students || students.length === 0) {
      throw new Error('Dışa aktarılacak öğrenci bulunamadı.');
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Öğrenciler');

    // Define columns with proper widths
    worksheet.columns = [
      { header: 'Ad Soyad', key: 'fullName', width: 25 },
      { header: 'E-posta', key: 'email', width: 30 },
      { header: 'Telefon', key: 'phone', width: 15 },
      { header: 'Durum', key: 'status', width: 12 },
      { header: 'Başvuru Tarihi', key: 'createdAt', width: 15 },
      { header: 'Onay Tarihi', key: 'approvedAt', width: 15 },
      { header: 'Red Nedeni', key: 'rejectionReason', width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    students.forEach((student: InstitutionStudentRequest) => {
      worksheet.addRow({
        fullName: student.full_name,
        email: student.email,
        phone: student.phone || '-',
        status: student.status === 'approved' ? 'Onaylandı' : student.status === 'pending' ? 'Bekliyor' : 'Reddedildi',
        createdAt: new Date(student.created_at).toLocaleDateString('tr-TR'),
        approvedAt: student.approved_at ? new Date(student.approved_at).toLocaleDateString('tr-TR') : '-',
        rejectionReason: student.rejection_reason || '-',
      });
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ogrenci_listesi_${timestamp}.xlsx`;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBuffer(buffer, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting students:', error);
    throw error;
  }
}

/**
 * Export exam results to Excel using secure ExcelJS
 */
export async function exportExamResultsToExcel(institutionId: string, examBlueprintId?: string) {
  try {
    // Fetch exam results from institution_exam_results table
    let query = supabase
      .from('institution_exam_results')
      .select(`
        *,
        student:institution_student_requests!institution_exam_results_student_id_fkey(full_name, email),
        blueprint:institution_exam_blueprints!institution_exam_results_exam_blueprint_id_fkey(title, subject)
      `)
      .eq('institution_id', institutionId)
      .order('completed_at', { ascending: false });

    if (examBlueprintId) {
      query = query.eq('exam_blueprint_id', examBlueprintId);
    }

    const { data: results, error } = await query;

    if (error) {
      throw error;
    }

    if (!results || results.length === 0) {
      throw new Error('Dışa aktarılacak sınav sonucu bulunamadı.');
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sınav Sonuçları');

    // Define columns
    worksheet.columns = [
      { header: 'Öğrenci', key: 'student', width: 25 },
      { header: 'E-posta', key: 'email', width: 30 },
      { header: 'Sınav', key: 'exam', width: 30 },
      { header: 'Ders', key: 'subject', width: 15 },
      { header: 'Doğru', key: 'correct', width: 8 },
      { header: 'Yanlış', key: 'wrong', width: 8 },
      { header: 'Boş', key: 'empty', width: 8 },
      { header: 'Puan', key: 'score', width: 10 },
      { header: 'Başlangıç', key: 'startedAt', width: 18 },
      { header: 'Bitiş', key: 'completedAt', width: 18 },
      { header: 'Tarih', key: 'createdAt', width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    results.forEach((result: any) => {
      worksheet.addRow({
        student: result.student?.full_name || 'Bilinmiyor',
        email: result.student?.email || '-',
        exam: result.blueprint?.title || 'Bilinmiyor',
        subject: result.blueprint?.subject || '-',
        correct: result.correct_count,
        wrong: result.wrong_count,
        empty: result.empty_count,
        score: result.score !== null ? result.score.toFixed(2) : '-',
        startedAt: result.started_at ? new Date(result.started_at).toLocaleString('tr-TR') : '-',
        completedAt: result.completed_at ? new Date(result.completed_at).toLocaleString('tr-TR') : '-',
        createdAt: new Date(result.created_at).toLocaleDateString('tr-TR'),
      });
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `sinav_sonuclari_${timestamp}.xlsx`;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBuffer(buffer, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting exam results:', error);
    throw error;
  }
}

/**
 * Export performance summary report to Excel using secure ExcelJS
 */
export async function exportPerformanceReportToExcel(institutionId: string) {
  try {
    // Fetch all approved students
    const { data: students, error: studentsError } = await supabase
      .from('institution_student_requests')
      .select('id, user_id, full_name, email')
      .eq('institution_id', institutionId)
      .eq('status', 'approved')
      .order('full_name');

    if (studentsError) {
      throw studentsError;
    }

    if (!students || students.length === 0) {
      throw new Error('Dışa aktarılacak öğrenci bulunamadı.');
    }

    // Fetch exam results for all students
    const userIds = students.map(s => s.user_id);
    const { data: examResults, error: resultsError } = await supabase
      .from('institution_exam_results')
      .select('user_id, correct_count, wrong_count, empty_count, score, completed_at')
      .eq('institution_id', institutionId)
      .in('user_id', userIds);

    if (resultsError) {
      throw resultsError;
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Performans Raporu');

    // Define columns
    worksheet.columns = [
      { header: 'Ad Soyad', key: 'fullName', width: 25 },
      { header: 'E-posta', key: 'email', width: 30 },
      { header: 'Toplam Sınav', key: 'totalExams', width: 12 },
      { header: 'Toplam Doğru', key: 'totalCorrect', width: 12 },
      { header: 'Toplam Yanlış', key: 'totalWrong', width: 12 },
      { header: 'Toplam Boş', key: 'totalEmpty', width: 12 },
      { header: 'Ortalama Puan', key: 'avgScore', width: 14 },
      { header: 'Başarı Oranı (%)', key: 'successRate', width: 16 },
      { header: 'Son Sınav', key: 'lastExam', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Calculate performance metrics for each student
    let totalExamsSum = 0;
    let totalCorrectSum = 0;
    let totalWrongSum = 0;
    let totalEmptySum = 0;
    let avgScoreSum = 0;
    let successRateSum = 0;

    students.forEach(student => {
      const studentResults = examResults?.filter(r => r.user_id === student.user_id) || [];

      const totalExams = studentResults.length;
      const totalCorrect = studentResults.reduce((sum, r) => sum + r.correct_count, 0);
      const totalWrong = studentResults.reduce((sum, r) => sum + r.wrong_count, 0);
      const totalEmpty = studentResults.reduce((sum, r) => sum + r.empty_count, 0);
      const totalQuestions = totalCorrect + totalWrong + totalEmpty;
      const averageScore = totalExams > 0
        ? studentResults.reduce((sum, r) => sum + (r.score || 0), 0) / totalExams
        : 0;
      const successRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      const lastExamDate = studentResults.length > 0
        ? studentResults
            .filter(r => r.completed_at)
            .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]?.completed_at
        : null;

      worksheet.addRow({
        fullName: student.full_name,
        email: student.email,
        totalExams,
        totalCorrect,
        totalWrong,
        totalEmpty,
        avgScore: averageScore.toFixed(2),
        successRate: successRate.toFixed(2),
        lastExam: lastExamDate ? new Date(lastExamDate).toLocaleDateString('tr-TR') : '-',
      });

      // Accumulate for totals
      totalExamsSum += totalExams;
      totalCorrectSum += totalCorrect;
      totalWrongSum += totalWrong;
      totalEmptySum += totalEmpty;
      avgScoreSum += averageScore;
      successRateSum += successRate;
    });

    // Add summary row
    const summaryRow = worksheet.addRow({
      fullName: 'TOPLAM',
      email: '',
      totalExams: totalExamsSum,
      totalCorrect: totalCorrectSum,
      totalWrong: totalWrongSum,
      totalEmpty: totalEmptySum,
      avgScore: (avgScoreSum / students.length).toFixed(2),
      successRate: (successRateSum / students.length).toFixed(2),
      lastExam: '',
    });

    // Style summary row
    summaryRow.font = { bold: true };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD700' },
    };

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `performans_raporu_${timestamp}.xlsx`;

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    downloadBuffer(buffer, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting performance report:', error);
    throw error;
  }
}

/**
 * Helper function to download buffer as file
 */
function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV format
 */
export async function exportToCSV(data: any[], filename: string) {
  try {
    if (data.length === 0) {
      throw new Error('Dışa aktarılacak veri bulunamadı.');
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Get headers from first object
    const headers = Object.keys(data[0]);
    worksheet.columns = headers.map(header => ({ header, key: header, width: 15 }));

    // Add rows
    data.forEach(row => worksheet.addRow(row));

    // Generate CSV buffer
    const buffer = await workbook.csv.writeBuffer();

    // Download
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}
