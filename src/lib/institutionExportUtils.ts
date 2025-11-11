import * as XLSX from 'xlsx';
import { supabase } from './supabase';
import type { InstitutionStudentRequest } from './institutionStudentApi';
import type { InstitutionExamResult } from './institutionStudentApi';

/**
 * Export institution students list to Excel
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

    // Prepare data for Excel
    const exportData = students.map((student: InstitutionStudentRequest) => ({
      'Ad Soyad': student.full_name,
      'E-posta': student.email,
      'Telefon': student.phone || '-',
      'Durum': student.status === 'approved' ? 'Onaylandı' : student.status === 'pending' ? 'Bekliyor' : 'Reddedildi',
      'Başvuru Tarihi': new Date(student.created_at).toLocaleDateString('tr-TR'),
      'Onay Tarihi': student.approved_at ? new Date(student.approved_at).toLocaleDateString('tr-TR') : '-',
      'Red Nedeni': student.rejection_reason || '-',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Öğrenciler');

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Ad Soyad
      { wch: 30 }, // E-posta
      { wch: 15 }, // Telefon
      { wch: 12 }, // Durum
      { wch: 15 }, // Başvuru Tarihi
      { wch: 15 }, // Onay Tarihi
      { wch: 30 }, // Red Nedeni
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ogrenci_listesi_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting students:', error);
    throw error;
  }
}

/**
 * Export exam results to Excel
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

    // Prepare data for Excel
    const exportData = results.map((result: any) => ({
      'Öğrenci': result.student?.full_name || 'Bilinmiyor',
      'E-posta': result.student?.email || '-',
      'Sınav': result.blueprint?.title || 'Bilinmiyor',
      'Ders': result.blueprint?.subject || '-',
      'Doğru': result.correct_count,
      'Yanlış': result.wrong_count,
      'Boş': result.empty_count,
      'Puan': result.score !== null ? result.score.toFixed(2) : '-',
      'Başlangıç': result.started_at ? new Date(result.started_at).toLocaleString('tr-TR') : '-',
      'Bitiş': result.completed_at ? new Date(result.completed_at).toLocaleString('tr-TR') : '-',
      'Tarih': new Date(result.created_at).toLocaleDateString('tr-TR'),
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sınav Sonuçları');

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Öğrenci
      { wch: 30 }, // E-posta
      { wch: 30 }, // Sınav
      { wch: 15 }, // Ders
      { wch: 8 },  // Doğru
      { wch: 8 },  // Yanlış
      { wch: 8 },  // Boş
      { wch: 10 }, // Puan
      { wch: 18 }, // Başlangıç
      { wch: 18 }, // Bitiş
      { wch: 12 }, // Tarih
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `sinav_sonuclari_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting exam results:', error);
    throw error;
  }
}

/**
 * Export performance summary report to Excel
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
    const studentIds = students.map(s => s.id);
    const { data: examResults, error: resultsError } = await supabase
      .from('institution_exam_results')
      .select('student_id, correct_count, wrong_count, empty_count, score, completed_at')
      .eq('institution_id', institutionId)
      .in('student_id', studentIds);

    if (resultsError) {
      throw resultsError;
    }

    // Calculate performance metrics for each student
    const performanceData = students.map(student => {
      const studentResults = examResults?.filter(r => r.student_id === student.id) || [];

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

      return {
        'Ad Soyad': student.full_name,
        'E-posta': student.email,
        'Toplam Sınav': totalExams,
        'Toplam Doğru': totalCorrect,
        'Toplam Yanlış': totalWrong,
        'Toplam Boş': totalEmpty,
        'Ortalama Puan': averageScore.toFixed(2),
        'Başarı Oranı (%)': successRate.toFixed(2),
        'Son Sınav': lastExamDate ? new Date(lastExamDate).toLocaleDateString('tr-TR') : '-',
      };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(performanceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performans Raporu');

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Ad Soyad
      { wch: 30 }, // E-posta
      { wch: 12 }, // Toplam Sınav
      { wch: 12 }, // Toplam Doğru
      { wch: 12 }, // Toplam Yanlış
      { wch: 12 }, // Toplam Boş
      { wch: 14 }, // Ortalama Puan
      { wch: 16 }, // Başarı Oranı
      { wch: 15 }, // Son Sınav
    ];
    worksheet['!cols'] = columnWidths;

    // Add summary row at the end
    const totalRow = {
      'Ad Soyad': 'TOPLAM',
      'E-posta': '',
      'Toplam Sınav': performanceData.reduce((sum, row) => sum + parseInt(row['Toplam Sınav'] as any), 0),
      'Toplam Doğru': performanceData.reduce((sum, row) => sum + parseInt(row['Toplam Doğru'] as any), 0),
      'Toplam Yanlış': performanceData.reduce((sum, row) => sum + parseInt(row['Toplam Yanlış'] as any), 0),
      'Toplam Boş': performanceData.reduce((sum, row) => sum + parseInt(row['Toplam Boş'] as any), 0),
      'Ortalama Puan': (performanceData.reduce((sum, row) => sum + parseFloat(row['Ortalama Puan'] as any), 0) / performanceData.length).toFixed(2),
      'Başarı Oranı (%)': (performanceData.reduce((sum, row) => sum + parseFloat(row['Başarı Oranı (%)'] as any), 0) / performanceData.length).toFixed(2),
      'Son Sınav': '',
    };

    XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `performans_raporu_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting performance report:', error);
    throw error;
  }
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, filename };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
}
