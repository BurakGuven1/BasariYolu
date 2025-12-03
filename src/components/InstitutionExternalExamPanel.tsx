import { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Eye,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  fetchExternalExamTemplates,
  createBulkExternalExamResults,
  fetchExternalExamResults,
  deleteExternalExamResult,
  assignExamToStudents,
  fetchAssignmentSummaries,
  fetchInstitutionAssignments,
  deleteAssignment,
  updateAssignmentDeadline,
  type ExternalExamTemplate,
  type BulkExamResultEntry,
  type AssignmentSummary,
  type AssignmentWithStats,
} from '../lib/institutionExternalExamApi';
import ExamTemplateBuilder from './ExamTemplateBuilder';
import StudentExamResultDetail from './StudentExamResultDetail';

interface InstitutionExternalExamPanelProps {
  institutionId: string;
  userId: string;
}

export default function InstitutionExternalExamPanel({
  institutionId,
  userId,
}: InstitutionExternalExamPanelProps) {
  const [templates, setTemplates] = useState<ExternalExamTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const [assignmentSummaries, setAssignmentSummaries] = useState<AssignmentSummary[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [showStudentPerformance, setShowStudentPerformance] = useState(false);
  const [selectedStudentPerformance, setSelectedStudentPerformance] = useState<{
    userId: string;
    templateId: string;
    examDate: string;
  } | null>(null);

  // Öğrenci listesi (kurum öğrencileri)
  const [students, setStudents] = useState<Array<{ userId: string; name: string }>>([]);

  useEffect(() => {
    loadTemplates();
    loadStudents();
    loadAssignments();
  }, [institutionId]);

  const loadTemplates = async () => {
    try {
      const data = await fetchExternalExamTemplates(institutionId);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await import('../lib/supabase').then(mod =>
        mod.supabase
          .from('institution_student_requests')
          .select('user_id, full_name')
          .eq('institution_id', institutionId)
          .eq('status', 'approved')
      );

      if (!error && data) {
        setStudents(data.map(s => ({ userId: s.user_id, name: s.full_name })));
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoadingAssignments(true);
      const summaries = await fetchAssignmentSummaries(institutionId);
      setAssignmentSummaries(summaries);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleExcelUpload = useCallback(
    async (file: File) => {
      if (!selectedTemplate) {
        setUploadStatus({
          type: 'error',
          message: 'Önce bir sınav template seçin',
        });
        return;
      }

      setLoading(true);
      setUploadStatus({ type: null, message: '' });

      try {
        // Excel dosyasını oku
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonData.length === 0) {
          throw new Error('Excel dosyası boş');
        }

        // Template'i bul
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) {
          throw new Error('Template bulunamadı');
        }

        // Excel formatını parse et
        // Beklenen format: İlk sütun "Öğrenci Adı", sonraki sütunlar "Soru 1", "Soru 2", ...
        const bulkResults: BulkExamResultEntry[] = [];

        for (const row of jsonData) {
          const studentName = row['Öğrenci Adı'] || row['Ogrenci Adi'] || row['Student Name'];

          if (!studentName) {
            console.warn('Satırda öğrenci adı bulunamadı:', row);
            continue;
          }

          // Cevap anahtarı satırını atla
          if (studentName.includes('CEVAP ANAHTARI') || studentName.includes('🔑')) {
            continue;
          }

          // Boş satırları atla
          if (!studentName.trim()) {
            continue;
          }

          // Öğrenci ID'sini bul (ad eşleştirmesi)
          const student = students.find(s =>
            s.name.toLowerCase().trim() === studentName.toLowerCase().trim()
          );

          if (!student) {
            console.warn('Öğrenci bulunamadı:', studentName);
            continue;
          }

          // Cevapları parse et (A/B/C/D/E/X formatında - X = boş)
          const answers: Record<number, 'A' | 'B' | 'C' | 'D' | 'E' | 'X'> = {};

          for (let i = 1; i <= template.total_questions; i++) {
            const questionKey = `Soru ${i}`;
            let answer = (row[questionKey] || '').toString().toUpperCase().trim();

            // Geçerli cevap formatında değilse varsayılan boş (X)
            if (!['A', 'B', 'C', 'D', 'E', 'X'].includes(answer)) {
              answer = 'X';
            }

            answers[i] = answer as 'A' | 'B' | 'C' | 'D' | 'E' | 'X';
          }

          bulkResults.push({
            studentUserId: student.userId,
            studentName: studentName,
            answers,
          });
        }

        if (bulkResults.length === 0) {
          throw new Error('İşlenebilir öğrenci verisi bulunamadı. Excel formatını kontrol edin.');
        }

        // API'ye gönder
        const result = await createBulkExternalExamResults({
          institutionId,
          templateId: selectedTemplate,
          examDate,
          results: bulkResults,
          createdBy: userId,
        });

        setUploadStatus({
          type: 'success',
          message: `✓ ${result.success} öğrenci sonucu eklendi${
            result.failed > 0 ? `, ${result.failed} hata` : ''
          }`,
        });

        // 3 saniye sonra mesajı temizle
        setTimeout(() => {
          setUploadStatus({ type: null, message: '' });
        }, 5000);
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadStatus({
          type: 'error',
          message: error.message || 'Excel yükleme hatası',
        });
      } finally {
        setLoading(false);
      }
    },
    [selectedTemplate, examDate, institutionId, userId, students, templates]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleExcelUpload(file);
    }
  };

  const downloadExcelTemplate = () => {
    if (!selectedTemplate) {
      alert('Önce bir sınav template seçin');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    // Excel template oluştur
    const headers = ['Öğrenci Adı'];
    for (let i = 1; i <= template.total_questions; i++) {
      headers.push(`Soru ${i}`);
    }

    // Önce cevap anahtarı satırı ekle (varsa)
    const exampleData: any[] = [];

    if (template.answer_key && Object.keys(template.answer_key).length > 0) {
      const answerKeyRow: any = { 'Öğrenci Adı': '🔑 CEVAP ANAHTARI' };
      for (let i = 1; i <= template.total_questions; i++) {
        answerKeyRow[`Soru ${i}`] = template.answer_key[i] || '-';
      }
      exampleData.push(answerKeyRow);

      // Boş ayırıcı satır
      const separatorRow: any = { 'Öğrenci Adı': '' };
      for (let i = 1; i <= template.total_questions; i++) {
        separatorRow[`Soru ${i}`] = '';
      }
      exampleData.push(separatorRow);
    }

    // Tüm öğrenciler için boş satırlar ekle
    students.forEach(student => {
      const row: any = { 'Öğrenci Adı': student.name };
      for (let i = 1; i <= template.total_questions; i++) {
        row[`Soru ${i}`] = ''; // Kullanıcı A/B/C/D/E/X girecek
      }
      exampleData.push(row);
    });

    // Workbook oluştur
    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sınav Sonuçları');

    // İndir
    XLSX.writeFile(workbook, `${template.name}_Sonuc_Sablonu.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Harici Sınav Sonuçları</h2>
            <p className="text-gray-600 text-sm">
              Fiziksel sınavların (yayınevi denemeleri vb.) sonuçlarını toplu olarak yükleyin
            </p>
          </div>
        </div>

        {/* Açıklama */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">Nasıl Çalışır?</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Sınav türünü seçin veya yeni template oluşturun</li>
            <li>Template için cevap anahtarını girin (şablona girebilirsiniz)</li>
            <li>"Şablon İndir" ile Excel dosyasını indirin</li>
            <li>Excel'de öğrenci cevaplarını doldurun (A/B/C/D/E veya X=boş)</li>
            <li>"Excel Yükle" ile sonuçları sisteme aktarın</li>
            <li>Sistem otomatik olarak cevap anahtarı ile karşılaştırır!</li>
            <li>Performans analizi konu bazlı otomatik oluşur!</li>
          </ol>
        </div>
      </div>

      {/* Sınav Seçimi */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">1. Sınav Türü Seçin</h3>
          <button
            onClick={() => setShowTemplateBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Yeni Template Oluştur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 mb-4">Henüz template yok</p>
              <button
                onClick={() => setShowTemplateBuilder(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                İlk Template'i Oluştur
              </button>
            </div>
          ) : (
            templates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTemplate === template.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{template.name}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{template.exam_type}</span>
                      {template.publisher && <span> • {template.publisher}</span>}
                      <div className="text-xs text-gray-500 mt-1">
                        {template.total_questions} soru
                      </div>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <CheckCircle className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Sınav Tarihi ve Öğrencilere Atama */}
      {selectedTemplate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">2. Sınav Tarihi & Öğrencilere Ata</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Öğrencilere Ata Butonu */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Users className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Öğrencilere Sınav Ata</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Öğrenciler kendi ekranlarından cevaplarını girebilirler.
                    Cevaplar otomatik olarak cevap anahtarı ile karşılaştırılır.
                  </p>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Users className="h-5 w-5" />
                    Öğrencilere Ata
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload/Download */}
      {selectedTemplate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">3. Sonuçları Yükle</h3>

          <div className="space-y-4">
            {/* Şablon İndir */}
            <div>
              <button
                onClick={downloadExcelTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download className="h-5 w-5" />
                Excel Şablonu İndir
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Öğrenci listesi ile hazırlanmış Excel dosyasını indirin
              </p>
            </div>

            {/* Excel Yükle */}
            <div>
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium cursor-pointer inline-flex">
                <Upload className="h-5 w-5" />
                Excel Dosyası Yükle
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <p className="text-sm text-gray-600 mt-2">
                Doldurduğunuz Excel dosyasını yükleyin (D/Y/B formatında)
              </p>
            </div>

            {/* Status Messages */}
            {loading && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-800">Sonuçlar yükleniyor...</span>
              </div>
            )}

            {uploadStatus.type === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800">{uploadStatus.message}</span>
              </div>
            )}

            {uploadStatus.type === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">{uploadStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Performance Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-green-600" />
              Öğrenci Performansları
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Öğrencilerin sınav sonuçlarını görüntüleyin ve analiz edin
            </p>
          </div>
        </div>

        <StudentPerformanceList
          institutionId={institutionId}
          summaries={assignmentSummaries}
          loading={loadingAssignments}
          onViewPerformance={(userId, templateId, examDate) => {
            setSelectedStudentPerformance({ userId, templateId, examDate });
            setShowStudentPerformance(true);
          }}
        />
      </div>

      {/* Assignment Management Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-purple-600" />
              Atama Yönetimi
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Öğrencilere atanan sınavları görüntüleyin ve yönetin
            </p>
          </div>
          <button
            onClick={() => setShowManagement(!showManagement)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            {showManagement ? 'Gizle' : 'Göster'}
          </button>
        </div>

        {showManagement && (
          <AssignmentManagementView
            institutionId={institutionId}
            summaries={assignmentSummaries}
            loading={loadingAssignments}
            onRefresh={loadAssignments}
          />
        )}
      </div>

      {/* Student Performance Modal */}
      {showStudentPerformance && selectedStudentPerformance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <StudentExamResultDetail
              userId={selectedStudentPerformance.userId}
              institutionId={institutionId}
              templateId={selectedStudentPerformance.templateId}
              examDate={selectedStudentPerformance.examDate}
              onBack={() => {
                setShowStudentPerformance(false);
                setSelectedStudentPerformance(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Assign Exam Modal */}
      {showAssignModal && selectedTemplate && (
        <AssignExamModal
          institutionId={institutionId}
          templateId={selectedTemplate}
          template={templates.find(t => t.id === selectedTemplate)!}
          students={students}
          examDate={examDate}
          userId={userId}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedStudents([]);
          }}
        />
      )}

      {/* Template Builder Modal */}
      {showTemplateBuilder && (
        <ExamTemplateBuilder
          institutionId={institutionId}
          onTemplateCreated={() => {
            loadTemplates();
            setShowTemplateBuilder(false);
          }}
          onClose={() => setShowTemplateBuilder(false)}
        />
      )}
    </div>
  );
}

/**
 * Öğrencilere Sınav Atama Modal
 */
interface AssignExamModalProps {
  institutionId: string;
  templateId: string;
  template: ExternalExamTemplate;
  students: Array<{ userId: string; name: string }>;
  examDate: string;
  userId: string;
  onClose: () => void;
}

function AssignExamModal({
  institutionId,
  templateId,
  template,
  students,
  examDate,
  userId,
  onClose,
}: AssignExamModalProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleStudent = (userId: string) => {
    setSelectedStudents(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.userId));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      setError('En az bir öğrenci seçmelisiniz');
      return;
    }

    if (!deadline) {
      setError('Son giriş tarihi belirtmelisiniz');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await assignExamToStudents({
        institutionId,
        templateId,
        studentUserIds: selectedStudents,
        examDate,
        deadline,
        assignedBy: userId,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error assigning exam:', err);
      setError(err.message || 'Sınav ataması yapılırken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h2 className="text-2xl font-bold">Öğrencilere Sınav Ata</h2>
          <p className="text-blue-100 mt-1">{template.name}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Exam Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Sınav Türü:</span>
                <span className="ml-2 text-blue-900">{template.exam_type}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Soru Sayısı:</span>
                <span className="ml-2 text-blue-900">{template.total_questions}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Sınav Tarihi:</span>
                <span className="ml-2 text-blue-900">
                  {new Date(examDate).toLocaleDateString('tr-TR')}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Cevap Anahtarı:</span>
                <span className="ml-2 text-blue-900">
                  {template.answer_key && Object.keys(template.answer_key).length > 0
                    ? `✓ ${Object.keys(template.answer_key).length} soru`
                    : '❌ Tanımlanmamış'}
                </span>
              </div>
            </div>

            {(!template.answer_key || Object.keys(template.answer_key).length === 0) && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
                <strong>Uyarı:</strong> Cevap anahtarı tanımlanmamış. Öğrenciler cevap giremeyecek!
              </div>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Son Giriş Tarihi *
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={examDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Öğrenciler bu tarihe kadar cevaplarını girebilirler
            </p>
          </div>

          {/* Student Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Öğrenci Seçimi ({selectedStudents.length}/{students.length})
              </label>
              <button
                onClick={toggleAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedStudents.length === students.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {students.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Henüz onaylı öğrenci yok
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map(student => (
                    <label
                      key={student.userId}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.userId)}
                        onChange={() => toggleStudent(student.userId)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{student.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Sınav başarıyla atandı! Öğrenciler ekranlarında görecekler.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedStudents.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Atanıyor...
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                {selectedStudents.length} Öğrenciye Ata
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Atama Yönetim Ekranı
 */
interface AssignmentManagementViewProps {
  institutionId: string;
  summaries: AssignmentSummary[];
  loading: boolean;
  onRefresh: () => void;
}

function AssignmentManagementView({
  institutionId,
  summaries,
  loading,
  onRefresh,
}: AssignmentManagementViewProps) {
  const [selectedSummary, setSelectedSummary] = useState<AssignmentSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Atamalar yükleniyor...</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz atama yapılmamış</h3>
        <p className="text-gray-600">
          Öğrencilere sınav atadığınızda burada görünecektir
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaries.map((summary) => {
        const deadline = summary.deadline ? new Date(summary.deadline) : null;
        const isExpired = deadline && deadline < new Date();
        const daysLeft = deadline
          ? Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return (
          <div
            key={`${summary.template_id}-${summary.exam_date}`}
            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Left: Exam Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-lg font-bold text-gray-900">{summary.template_name}</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {summary.exam_type}
                  </span>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Sınav: {new Date(summary.exam_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isExpired ? 'text-red-600' : daysLeft && daysLeft <= 3 ? 'text-orange-600' : ''}`} />
                      <span className={isExpired ? 'text-red-600 font-medium' : daysLeft && daysLeft <= 3 ? 'text-orange-600 font-medium' : ''}>
                        {isExpired
                          ? 'Süresi doldu'
                          : `Son Giriş: ${deadline.toLocaleDateString('tr-TR')} ${daysLeft && daysLeft <= 3 ? `(${daysLeft} gün)` : ''}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-700 font-medium">Cevap Girme Oranı</span>
                    <span className="text-gray-900 font-semibold">
                      {summary.submitted_count} / {summary.total_assigned} (%{Math.round(summary.submission_rate)})
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        summary.submission_rate === 100
                          ? 'bg-green-500'
                          : summary.submission_rate >= 50
                          ? 'bg-blue-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${summary.submission_rate}%` }}
                    />
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    {summary.submitted_count} Tamamlandı
                  </div>
                  {summary.pending_count > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      {summary.pending_count} Bekliyor
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setSelectedSummary(summary);
                    setShowDetails(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Detayları Gör
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Details Modal */}
      {showDetails && selectedSummary && (
        <AssignmentDetailsModal
          institutionId={institutionId}
          summary={selectedSummary}
          onClose={() => {
            setShowDetails(false);
            setSelectedSummary(null);
          }}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

/**
 * Atama Detay Modal
 */
interface AssignmentDetailsModalProps {
  institutionId: string;
  summary: AssignmentSummary;
  onClose: () => void;
  onRefresh: () => void;
}

function AssignmentDetailsModal({
  institutionId,
  summary,
  onClose,
  onRefresh,
}: AssignmentDetailsModalProps) {
  const [assignments, setAssignments] = useState<AssignmentWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignmentDetails();
  }, [summary]);

  const loadAssignmentDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchInstitutionAssignments(institutionId, summary.template_id);
      // Filter by exam_date
      const filtered = data.filter(a => a.exam_date === summary.exam_date);
      setAssignments(filtered);
    } catch (error) {
      console.error('Error loading assignment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Bu atamayı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteAssignment(assignmentId);
      await loadAssignmentDetails();
      onRefresh();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Atama silinirken bir hata oluştu');
    }
  };

  const handleExtendDeadline = async (assignmentId: string, currentDeadline: string | null) => {
    const newDeadline = prompt(
      'Yeni son giriş tarihini girin (YYYY-MM-DD):',
      currentDeadline || summary.exam_date
    );

    if (!newDeadline) return;

    try {
      await updateAssignmentDeadline(assignmentId, newDeadline);
      await loadAssignmentDetails();
      onRefresh();
      alert('Son giriş tarihi güncellendi');
    } catch (error) {
      console.error('Error updating deadline:', error);
      alert('Tarih güncellenirken bir hata oluştu');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <h2 className="text-2xl font-bold">{summary.template_name}</h2>
          <div className="flex items-center gap-4 mt-2 text-purple-100">
            <span>{summary.exam_type}</span>
            <span>•</span>
            <span>Sınav: {new Date(summary.exam_date).toLocaleDateString('tr-TR')}</span>
            <span>•</span>
            <span>{summary.total_assigned} Öğrenci</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Detaylar yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => {
                const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
                const isExpired = deadline && deadline < new Date();

                return (
                  <div
                    key={assignment.id}
                    className={`border rounded-lg p-4 ${
                      assignment.has_submitted
                        ? 'border-green-200 bg-green-50'
                        : isExpired
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Student Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{assignment.student_name}</h4>
                          {assignment.has_submitted ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle className="h-3 w-3" />
                              Cevaplar Girildi
                            </div>
                          ) : isExpired ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <AlertCircle className="h-3 w-3" />
                              Süresi Doldu
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                              <Clock className="h-3 w-3" />
                              Bekliyor
                            </div>
                          )}
                        </div>
                        {deadline && (
                          <p className="text-sm text-gray-600 mt-1">
                            Son Giriş: {deadline.toLocaleDateString('tr-TR')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!assignment.has_submitted && (
                          <button
                            onClick={() => handleExtendDeadline(assignment.id, assignment.deadline)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Süre Uzat
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Atamayı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Öğrenci Performans Listesi
 */
interface StudentPerformanceListProps {
  institutionId: string;
  summaries: AssignmentSummary[];
  loading: boolean;
  onViewPerformance: (userId: string, templateId: string, examDate: string) => void;
}

function StudentPerformanceList({
  institutionId,
  summaries,
  loading,
  onViewPerformance,
}: StudentPerformanceListProps) {
  const [students, setStudents] = useState<Array<{
    userId: string;
    name: string;
    examResults: any[];
  }>>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadStudentPerformances();
  }, [institutionId]);

  const loadStudentPerformances = async () => {
    try {
      setLoadingDetails(true);

      // Get all institution students
      const { data: studentData, error: studentError } = await import('../lib/supabase').then(mod =>
        mod.supabase
          .from('institution_student_requests')
          .select('user_id, full_name')
          .eq('institution_id', institutionId)
          .eq('status', 'approved')
      );

      if (studentError || !studentData) {
        console.error('Error loading students:', studentError);
        return;
      }

      // For each student, get all their exam results
      const studentPerformances = await Promise.all(
        studentData.map(async (student) => {
          try {
            const results = await fetchExternalExamResults(institutionId, student.user_id);
            return {
              userId: student.user_id,
              name: student.full_name,
              examResults: results.sort((a, b) =>
                new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
              ),
            };
          } catch (error) {
            console.error(`Error loading results for student ${student.user_id}:`, error);
            return {
              userId: student.user_id,
              name: student.full_name,
              examResults: [],
            };
          }
        })
      );

      setStudents(studentPerformances.filter(s => s.examResults.length > 0));
    } catch (error) {
      console.error('Error loading student performances:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading || loadingDetails) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Öğrenci performansları yükleniyor...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz sonuç girilmemiş</h3>
        <p className="text-gray-600">
          Öğrenciler cevaplarını girdikçe burada görünecektir
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Öğrenci Adı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Toplam Deneme
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Son 2 Deneme Puanı
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ortalama Puan
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => {
            const last2Results = student.examResults.slice(0, 2);
            const avgScore = student.examResults.length > 0
              ? student.examResults.reduce((sum, r) => sum + (r.net_score || 0), 0) / student.examResults.length
              : 0;

            // Determine exam type (TYT/AYT/LGS) from most recent exam
            const examType = student.examResults[0]?.template?.exam_type || '';

            return (
              <tr key={student.userId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{student.examResults.length} Deneme</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm">
                    {last2Results.map((result, idx) => (
                      <span
                        key={result.id}
                        className={`px-2 py-1 rounded ${
                          idx === 0
                            ? 'bg-indigo-100 text-indigo-800 font-semibold'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {result.net_score?.toFixed(1) || '0.0'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {avgScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                      {examType}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      // Open modal with latest exam
                      const latest = student.examResults[0];
                      onViewPerformance(student.userId, latest.template_id, latest.exam_date);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Download className="h-4 w-4" />
                    Performans Analizi
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
