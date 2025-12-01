import { useState, useEffect } from 'react';
import { Users, Download, TrendingUp, FileText, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchExternalExamResults, type ExternalExamResult } from '../lib/institutionExternalExamApi';
import StudentExamResultDetail from './StudentExamResultDetail';

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

interface SelectedStudentForAnalysis {
  userId: string;
  fullName: string;
  email: string;
  templateId: string;
  examDate: string;
}

export default function InstitutionStudentListPanel({ institutionId }: InstitutionStudentListPanelProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudentForAnalysis | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');

  useEffect(() => {
    loadInstitutionAndStudents();
  }, [institutionId]);

  const loadInstitutionAndStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Kurum bilgisini getir
      const { data: institutionData, error: instError } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', institutionId)
        .single();

      if (instError) throw instError;
      setInstitutionName(institutionData?.name || '');

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

  const handleOpenPerformanceAnalysis = (student: Student) => {
    if (student.examCount === 0) {
      alert('Bu öğrencinin henüz deneme sonucu yok.');
      return;
    }

    // En son sınav sonucunu al
    const latestResult = student.results[0];

    setSelectedStudent({
      userId: student.userId,
      fullName: student.fullName,
      email: student.email,
      templateId: latestResult.template_id || '',
      examDate: latestResult.exam_date,
    });
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
          Öğrenci başvurularını "Öğrenci Başvuruları" sekmesinden onaylayabilirsiniz.
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
                        onClick={() => handleOpenPerformanceAnalysis(student)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Performans Analizi
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
              Performans analizi sayfasında öğrencinin tüm deneme sonuçlarını görebilir,
              detaylı istatistikleri inceleyebilir ve PDF raporu olarak indirebilirsiniz.
              Rapor kurum bilgileriniz ile özelleştirilmiştir.
            </p>
          </div>
        </div>
      </div>

      {/* Performans Analizi Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedStudent.fullName} - Performans Analizi
                </h3>
                <p className="text-sm text-gray-600">{institutionName}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <StudentExamResultDetail
                userId={selectedStudent.userId}
                institutionId={institutionId}
                templateId={selectedStudent.templateId}
                examDate={selectedStudent.examDate}
                onBack={() => setSelectedStudent(null)}
                institutionInfo={{
                  name: institutionName,
                  studentName: selectedStudent.fullName,
                  studentEmail: selectedStudent.email,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
