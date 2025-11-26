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
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  fetchExternalExamTemplates,
  createBulkExternalExamResults,
  fetchExternalExamResults,
  deleteExternalExamResult,
  type ExternalExamTemplate,
  type BulkExamResultEntry,
} from '../lib/institutionExternalExamApi';

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

  // Öğrenci listesi (kurum öğrencileri)
  const [students, setStudents] = useState<Array<{ userId: string; name: string }>>([]);

  useEffect(() => {
    loadTemplates();
    loadStudents();
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

          // Öğrenci ID'sini bul (ad eşleştirmesi)
          const student = students.find(s =>
            s.name.toLowerCase().trim() === studentName.toLowerCase().trim()
          );

          if (!student) {
            console.warn('Öğrenci bulunamadı:', studentName);
            continue;
          }

          // Cevapları parse et
          const answers: Record<number, 'D' | 'Y' | 'B'> = {};

          for (let i = 1; i <= template.total_questions; i++) {
            const questionKey = `Soru ${i}`;
            let answer = (row[questionKey] || '').toString().toUpperCase().trim();

            // D/Y/B formatında değilse varsayılan boş
            if (!['D', 'Y', 'B'].includes(answer)) {
              answer = 'B';
            }

            answers[i] = answer as 'D' | 'Y' | 'B';
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

    // Örnek satırlar ekle
    const exampleData = students.slice(0, 3).map(student => {
      const row: any = { 'Öğrenci Adı': student.name };
      for (let i = 1; i <= template.total_questions; i++) {
        row[`Soru ${i}`] = ''; // Boş bırak, kullanıcı dolduracak
      }
      return row;
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
            <li>Sınav türünü seçin (TYT, AYT, LGS vb.)</li>
            <li>"Şablon İndir" ile Excel dosyasını indirin</li>
            <li>Excel'de öğrenci cevaplarını doldurun (D/Y/B)</li>
            <li>"Excel Yükle" ile sonuçları sisteme aktarın</li>
            <li>Performans analizi otomatik oluşur!</li>
          </ol>
        </div>
      </div>

      {/* Sınav Seçimi */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">1. Sınav Türü Seçin</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <p className="text-gray-500 col-span-full">Template bulunamadı</p>
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

      {/* Sınav Tarihi */}
      {selectedTemplate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">2. Sınav Tarihi</h3>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
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

      {/* Bilgi Notu */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Excel Formatı
        </h3>
        <div className="text-sm text-purple-800 space-y-2">
          <p>Excel dosyanız şu formatta olmalı:</p>
          <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">Öğrenci Adı</th>
                  <th className="border border-gray-300 px-2 py-1">Soru 1</th>
                  <th className="border border-gray-300 px-2 py-1">Soru 2</th>
                  <th className="border border-gray-300 px-2 py-1">...</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1">Ahmet Yılmaz</td>
                  <td className="border border-gray-300 px-2 py-1">D</td>
                  <td className="border border-gray-300 px-2 py-1">Y</td>
                  <td className="border border-gray-300 px-2 py-1">...</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            <strong>D</strong> = Doğru, <strong>Y</strong> = Yanlış, <strong>B</strong> = Boş
          </p>
        </div>
      </div>
    </div>
  );
}
