import { useState } from 'react';
import { Save, Copy, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import {
  createExternalExamTemplate,
  type ExternalExamQuestionMapping,
} from '../lib/institutionExternalExamApi';
import { STANDARD_EXAM_TEMPLATES } from '../lib/standardExamTemplates';

interface ExamTemplateBuilderProps {
  institutionId: string;
  onTemplateCreated: () => void;
  onClose: () => void;
}

export default function ExamTemplateBuilder({
  institutionId,
  onTemplateCreated,
  onClose,
}: ExamTemplateBuilderProps) {
  const [step, setStep] = useState<'basic' | 'questions' | 'answerKey'>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [publisher, setPublisher] = useState('');
  const [examType, setExamType] = useState<'TYT' | 'AYT' | 'LGS'>('TYT');
  const [totalQuestions, setTotalQuestions] = useState(120);
  const [questionMappings, setQuestionMappings] = useState<ExternalExamQuestionMapping[]>([]);
  const [answerKey, setAnswerKey] = useState<Record<string, string>>({});
  const [useStandard, setUseStandard] = useState(false);

  const handleLoadStandardTemplate = () => {
    const standard = STANDARD_EXAM_TEMPLATES.find(t => t.examType === examType);
    if (standard) {
      setTotalQuestions(standard.totalQuestions);
      setQuestionMappings(standard.questionMapping);
      setUseStandard(true);
      setStep('questions');
    }
  };

  const handleGenerateEmptyQuestions = () => {
    const emptyMappings: ExternalExamQuestionMapping[] = Array.from(
      { length: totalQuestions },
      (_, i) => ({
        questionNumber: i + 1,
        subject: '',
        topic: '',
      })
    );
    setQuestionMappings(emptyMappings);
    setUseStandard(false);
    setStep('questions');
  };

  const updateQuestionMapping = (index: number, field: 'subject' | 'topic', value: string) => {
    const updated = [...questionMappings];
    updated[index] = { ...updated[index], [field]: value };
    setQuestionMappings(updated);
  };

  const handleBulkUpdate = (
    startIndex: number,
    endIndex: number,
    subject: string,
    topic: string
  ) => {
    const updated = [...questionMappings];
    for (let i = startIndex; i <= endIndex; i++) {
      if (updated[i - 1]) {
        updated[i - 1] = {
          questionNumber: i,
          subject: subject || updated[i - 1].subject,
          topic: topic || updated[i - 1].topic,
        };
      }
    }
    setQuestionMappings(updated);
  };

  const updateAnswerKey = (questionNumber: number, answer: string) => {
    setAnswerKey(prev => ({
      ...prev,
      [questionNumber]: answer.toUpperCase(),
    }));
  };

  const handleBulkAnswerEntry = (startingFrom: number, answers: string) => {
    // Parse answers string (e.g., "A D B C E A D B C E...")
    const answerArray = answers.toUpperCase().split(/\s+/).filter(a => a.length > 0);
    const updated = { ...answerKey };
    answerArray.forEach((answer, index) => {
      const questionNum = startingFrom + index;
      if (questionNum <= totalQuestions && ['A', 'B', 'C', 'D', 'E'].includes(answer)) {
        updated[questionNum] = answer;
      }
    });
    setAnswerKey(updated);
  };

  const handleSaveTemplate = async () => {
    // Validation
    if (!name.trim()) {
      setError('Sınav adı gereklidir');
      return;
    }

    const emptyMappings = questionMappings.filter(m => !m.subject || !m.topic);
    if (emptyMappings.length > 0) {
      setError(`${emptyMappings.length} soru için ders/konu bilgisi eksik`);
      return;
    }

    // Cevap anahtarı opsiyonel - boş da olabilir, sonra eklenebilir
    const answerKeyCount = Object.keys(answerKey).length;
    if (answerKeyCount > 0 && answerKeyCount < totalQuestions) {
      setError(`Cevap anahtarı eksik: ${answerKeyCount}/${totalQuestions} soru cevaplandı. Ya tümünü doldurun ya da boş bırakın (sonra ekleyebilirsiniz).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createExternalExamTemplate({
        name,
        publisher: publisher || undefined,
        examType,
        totalQuestions,
        questionMapping: questionMappings,
        answerKey: Object.keys(answerKey).length > 0 ? answerKey : undefined,
        isPublic: false,
        institutionId,
      });

      setSuccess(true);
      setTimeout(() => {
        onTemplateCreated();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Template creation error:', err);
      setError(err.message || 'Template oluşturma hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <h2 className="text-2xl font-bold">Sınav Template Oluştur</h2>
          <p className="text-indigo-100 mt-1">
            {step === 'basic' && 'Adım 1/3: Temel Bilgiler'}
            {step === 'questions' && 'Adım 2/3: Soru Eşleştirmeleri'}
            {step === 'answerKey' && 'Adım 3/3: Cevap Anahtarı (Opsiyonel)'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'basic' ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sınav Adı *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Örn: X Yayınları 7. Deneme TYT"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yayınevi (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={publisher}
                  onChange={e => setPublisher(e.target.value)}
                  placeholder="Örn: X Yayınları, Bilfen, Kalem"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sınav Türü *
                  </label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value as 'TYT' | 'AYT' | 'LGS')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="LGS">LGS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Toplam Soru *
                  </label>
                  <input
                    type="number"
                    value={totalQuestions}
                    onChange={e => setTotalQuestions(parseInt(e.target.value) || 0)}
                    min="1"
                    max="200"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Standard Template Option */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Hızlı Başlat</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLoadStandardTemplate}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="h-5 w-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium">
                        Standart {examType} Yapısını Kullan
                      </div>
                      <div className="text-xs text-blue-100">
                        MEB müfredatına uygun hazır template
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleGenerateEmptyQuestions}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <BookOpen className="h-5 w-5" />
                    <div className="text-left flex-1">
                      <div className="font-medium">Manuel Olarak Oluştur</div>
                      <div className="text-xs text-gray-200">
                        Her soruyu kendin eşleştir (uzun sürebilir)
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : step === 'questions' ? (
            <div className="space-y-6">
              {/* Bulk Update Tool */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">Toplu Güncelleme</h3>
                <div className="grid grid-cols-5 gap-2">
                  <input
                    type="number"
                    placeholder="Başlangıç"
                    id="bulkStart"
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Bitiş"
                    id="bulkEnd"
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ders"
                    id="bulkSubject"
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Konu"
                    id="bulkTopic"
                    className="px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <button
                    onClick={() => {
                      const start = parseInt(
                        (document.getElementById('bulkStart') as HTMLInputElement)?.value || '0'
                      );
                      const end = parseInt(
                        (document.getElementById('bulkEnd') as HTMLInputElement)?.value || '0'
                      );
                      const subject = (document.getElementById('bulkSubject') as HTMLInputElement)
                        ?.value;
                      const topic = (document.getElementById('bulkTopic') as HTMLInputElement)?.value;
                      if (start > 0 && end >= start) {
                        handleBulkUpdate(start, end, subject, topic);
                      }
                    }}
                    className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                  >
                    Uygula
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Örn: Soru 1-20 arası "Türkçe" "Paragraf" olarak ayarla
                  7-19 arasında "Matematik" "Problemler" olarak ayarla
                </p>
              </div>

              {/* Question Mappings */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questionMappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded"
                  >
                    <div className="col-span-1 text-center font-medium text-gray-700">
                      {mapping.questionNumber}
                    </div>
                    <input
                      type="text"
                      value={mapping.subject}
                      onChange={e => updateQuestionMapping(index, 'subject', e.target.value)}
                      placeholder="Ders"
                      className="col-span-5 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="text"
                      value={mapping.topic}
                      onChange={e => updateQuestionMapping(index, 'topic', e.target.value)}
                      placeholder="Konu"
                      className="col-span-6 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
              </div>

              {useStandard && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  ✓ Standart template yüklendi. İsterseniz soruları düzenleyebilirsiniz.
                </div>
              )}
            </div>
          ) : step === 'answerKey' ? (
            <div className="space-y-6">
              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Cevap Anahtarı (Opsiyonel)</h3>
                <p className="text-sm text-blue-800">
                  Cevap anahtarını şimdi girebilir veya daha sonra ekleyebilirsiniz.
                  Cevap anahtarı girildikten sonra öğrenci cevapları otomatik olarak karşılaştırılacaktır.
                </p>
              </div>

              {/* Bulk Answer Entry */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3">Toplu Cevap Girişi</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-6 gap-2">
                    <input
                      type="number"
                      placeholder="1"
                      id="answerStartFrom"
                      className="px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <textarea
                      id="bulkAnswers"
                      placeholder="A D B C E A D B C E..."
                      rows={3}
                      className="col-span-4 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const start = parseInt(
                          (document.getElementById('answerStartFrom') as HTMLInputElement)?.value || '1'
                        );
                        const answers = (document.getElementById('bulkAnswers') as HTMLTextAreaElement)?.value || '';
                        handleBulkAnswerEntry(start, answers);
                      }}
                      className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      Ekle
                    </button>
                  </div>
                  <p className="text-xs text-purple-700">
                    Cevapları boşlukla ayırarak girin (A, B, C, D, E). Örn: A D B C E A D B
                  </p>
                </div>
              </div>

              {/* Answer Key Grid */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(questionNum => (
                    <div key={questionNum} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 w-8">{questionNum}.</span>
                      <select
                        value={answerKey[questionNum] || ''}
                        onChange={e => updateAnswerKey(questionNum, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">-</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">İlerleme:</span>
                  <span className="font-semibold text-gray-900">
                    {Object.keys(answerKey).length} / {totalQuestions} soru
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all"
                    style={{
                      width: `${(Object.keys(answerKey).length / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Error/Success */}
          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle className="h-5 w-5" />
              Template başarıyla oluşturuldu!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            İptal
          </button>

          <div className="flex gap-2">
            {(step === 'questions' || step === 'answerKey') && (
              <button
                onClick={() => setStep(step === 'questions' ? 'basic' : 'questions')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Geri
              </button>
            )}

            {step === 'basic' ? (
              <div className="text-sm text-gray-600">Devam etmek için hızlı başlat seçin</div>
            ) : step === 'questions' ? (
              <button
                onClick={() => {
                  // Validate before moving to answer key
                  const emptyMappings = questionMappings.filter(m => !m.subject || !m.topic);
                  if (emptyMappings.length > 0) {
                    setError(`${emptyMappings.length} soru için ders/konu bilgisi eksik`);
                    return;
                  }
                  setError(null);
                  setStep('answerKey');
                }}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Devam: Cevap Anahtarı →
              </button>
            ) : step === 'answerKey' ? (
              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Kaydet
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
