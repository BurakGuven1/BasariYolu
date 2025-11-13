import { useState } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  X,
  Edit2,
  Trash2,
  Server,
} from 'lucide-react';
import {
  extractTextAndImagesFromPDF,
  parseQuestionsWithPattern,
  ParsedQuestion,
  PDFPageImage,
  QuestionImage,
  mapQuestionsToPages,
  extractQuestionImages,
} from '../lib/pdfParser';
import { parseQuestionsWithAI, estimateParsingCost } from '../lib/openaiParser';
import { parsePDFWithBackend, checkBackendHealth } from '../lib/pdfParserBackend';
import {
  convertParsedQuestionToDBFormat,
  bulkInsertQuestionsWithImages,
  bulkInsertQuestionsWithCroppedImages,
  createQuestionPreviews,
  validateBulkInsert,
  QuestionPreview,
} from '../lib/questionBulkInsert';

interface InstitutionPDFQuestionUploadProps {
  institutionId: string;
  onSuccess?: (insertedCount: number) => void;
  onClose?: () => void;
}

type ParseMethod = 'pattern' | 'ai' | 'backend';
type UploadStep = 'upload' | 'parsing' | 'preview' | 'inserting' | 'complete';

export default function InstitutionPDFQuestionUpload({
  institutionId,
  onSuccess,
  onClose,
}: InstitutionPDFQuestionUploadProps) {
  const [step, setStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseMethod, setParseMethod] = useState<ParseMethod>('backend');
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pageImages, setPageImages] = useState<PDFPageImage[]>([]);
  const [questionImages, setQuestionImages] = useState<QuestionImage[]>([]);
  const [parsedQuestions, setParsedQuestions] = useState<QuestionPreview[]>([]);
  const [insertResult, setInsertResult] = useState<{
    inserted: number;
    errors: Array<{ question: any; error: string }>;
  } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionPreview | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<{
    costUSD: number;
    costTRY: number;
  } | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Lütfen geçerli bir PDF dosyası seçin');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleExtractAndParse = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStep('parsing');
    setProgressMessage('PDF okunuyor...');

    try {
      // Step 1: Extract text AND images from PDF
      setProgressMessage('PDF sayfalari görsellere dönüştürülüyor...');
      const { text, pageCount, pageImages: extractedImages, pageTexts } = await extractTextAndImagesFromPDF(file, {
        extractImages: true,
        imageScale: 2, // 144 DPI for quality
        imageFormat: 'jpeg',
        imageQuality: 0.92,
      });

      setExtractedText(text);
      if (extractedImages) {
        setPageImages(extractedImages);
        console.log(`Extracted ${extractedImages.length} page images`);
      }

      // Estimate cost if using AI
      if (parseMethod === 'ai') {
        const cost = estimateParsingCost(text.length);
        setEstimatedCost({
          costUSD: cost.estimatedCostUSD,
          costTRY: cost.estimatedCostTRY,
        });
      }

      // Step 2: Parse questions
      setProgressMessage('Sorular parse ediliyor...');
      let questions: ParsedQuestion[] = [];

      if (parseMethod === 'pattern') {
        questions = parseQuestionsWithPattern(text);
        if (questions.length === 0) {
          throw new Error(
            'Pattern matching ile soru bulunamadı. AI ile parse etmeyi deneyin.'
          );
        }
      } else {
        const result = await parseQuestionsWithAI(text);
        questions = result.questions;
        if (questions.length === 0) {
          throw new Error('AI hiç soru bulamadı. PDF formatını kontrol edin.');
        }
      }

      // Step 3: Map questions to pages
      setProgressMessage('Sorular sayfalara eşleştiriliyor...');
      if (pageTexts && pageTexts.length > 0) {
        questions = mapQuestionsToPages(questions, pageTexts);
        console.log(`Mapped ${questions.length} questions to pages`);
      }

      // Step 4: Extract cropped images for each question
      setProgressMessage('Soru görselleri crop ediliyor...');
      try {
        const croppedImages = await extractQuestionImages(file, questions, {
          imageScale: 2,
          imageFormat: 'jpeg',
          imageQuality: 0.92,
          paddingTop: 80,     // OPTIMIZED: Balanced padding for titles and graphics above
          paddingBottom: 150, // OPTIMIZED: Balanced padding for all options and content below
        });
        setQuestionImages(croppedImages);
        console.log(`Extracted ${croppedImages.length} cropped question images`);
      } catch (cropError) {
        console.warn('Failed to extract cropped images, falling back to page images:', cropError);
        // Keep using page images as fallback
      }

      // Step 5: Create previews
      const previews = createQuestionPreviews(questions);
      setParsedQuestions(previews);
      setProgressMessage('');
      setStep('preview');
    } catch (err) {
      console.error('Parse error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'PDF parse edilirken bir hata oluştu'
      );
      setProgressMessage('');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInsert = async () => {
    const selectedQuestions = parsedQuestions.filter(q => q.selected);

    if (selectedQuestions.length === 0) {
      setError('Lütfen en az bir soru seçin');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('inserting');
    setProgressMessage('Hazırlanıyor...');
    setProgressPercent(0);
    setProgressCurrent(0);
    setProgressTotal(0);

    try {
      // Convert to DB format
      const dbQuestions = selectedQuestions.map(q =>
        convertParsedQuestionToDBFormat(q, institutionId, ['tyt'])
      );

      // Validate
      const { valid, invalid } = validateBulkInsert(dbQuestions);

      if (invalid.length > 0) {
        console.warn('Invalid questions:', invalid);
      }

      // Insert valid questions WITH IMAGES
      // Use cropped images if available, otherwise fall back to page images
      const result = questionImages.length > 0
        ? await bulkInsertQuestionsWithCroppedImages(
            valid,
            questionImages,
            institutionId,
            (current, total, message) => {
              setProgressMessage(message);
              setProgressCurrent(current);
              setProgressTotal(total);
              setProgressPercent(total > 0 ? Math.round((current / total) * 100) : 0);
            }
          )
        : await bulkInsertQuestionsWithImages(
            valid,
            pageImages,
            institutionId,
            (current, total, message) => {
              setProgressMessage(message);
              setProgressCurrent(current);
              setProgressTotal(total);
              setProgressPercent(total > 0 ? Math.round((current / total) * 100) : 0);
            }
          );

      setInsertResult(result);
      setProgressMessage('');
      setStep('complete');

      if (result.inserted > 0 && onSuccess) {
        onSuccess(result.inserted);
      }
    } catch (err) {
      console.error('Bulk insert error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Sorular eklenirken bir hata oluştu'
      );
      setProgressMessage('');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (id: string) => {
    setParsedQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, selected: !q.selected } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    setParsedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        <div className="pointer-events-none">
          <Upload className="mx-auto h-16 w-16 text-gray-400" />
          <p className="mt-4 text-lg font-semibold text-gray-900">
            PDF Dosyası Yükle
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Sürükleyip bırakın veya tıklayarak seçin
          </p>
          {file && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {file.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Parse Yöntemi Seç
        </label>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setParseMethod('ai')}
            className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition ${
              parseMethod === 'ai'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sparkles className="h-6 w-6 text-purple-500" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                AI-Powered (GPT-4o-mini)
              </p>
              <p className="text-xs text-gray-600">
                %90+ doğruluk • Görseller desteklenir • Tüm formatlar • ~₺0.08/PDF
              </p>
            </div>
            {parseMethod === 'ai' && (
              <CheckCircle className="h-5 w-5 text-blue-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setParseMethod('pattern')}
            className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 text-left transition ${
              parseMethod === 'pattern'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Zap className="h-6 w-6 text-yellow-500" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                Pattern Matching (Ücretsiz)
              </p>
              <p className="text-xs text-gray-600">
                %60-70 doğruluk • Görseller desteklenir • Klasik formatlar • Ücretsiz
              </p>
            </div>
            {parseMethod === 'pattern' && (
              <CheckCircle className="h-5 w-5 text-blue-600" />
            )}
          </button>
        </div>

        {/* Image Support Info */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mt-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-semibold">✨ Görsel Destek Aktif!</p>
              <p className="mt-1">
                PDF'deki tüm görseller, grafikler, şekiller ve matematiksel formüller
                otomatik olarak kaydedilecek ve sorularla birlikte gösterilecek.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleExtractAndParse}
        disabled={!file || loading}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            İşleniyor...
          </span>
        ) : (
          'Soruları Çıkar ve Parse Et'
        )}
      </button>
    </div>
  );

  const renderPreviewStep = () => {
    const selectedCount = parsedQuestions.filter(q => q.selected).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {parsedQuestions.length} Soru Bulundu
            </h3>
            <p className="text-sm text-gray-600">
              {selectedCount} soru seçildi • Düzenleyin veya kaydedin
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const allSelected = parsedQuestions.every(q => q.selected);
              setParsedQuestions(prev =>
                prev.map(q => ({ ...q, selected: !allSelected }))
              );
            }}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {parsedQuestions.every(q => q.selected)
              ? 'Tümünü Kaldır'
              : 'Tümünü Seç'}
          </button>
        </div>

        <div className="max-h-[500px] space-y-3 overflow-y-auto">
          {parsedQuestions.map(question => (
            <div
              key={question.id}
              className={`rounded-lg border p-4 transition ${
                question.selected
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={question.selected}
                  onChange={() => toggleQuestionSelection(question.id)}
                  className="mt-1 h-5 w-5 rounded border-gray-300"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        Soru {question.question_number}
                      </span>
                      <span className="ml-2 text-xs text-gray-600">
                        {question.subject} • {question.topic}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(question)}
                        className="rounded p-1 hover:bg-gray-200"
                      >
                        <Edit2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(question.id)}
                        className="rounded p-1 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-900">
                    {question.stem.slice(0, 200)}
                    {question.stem.length > 200 && '...'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {question.options.map(opt => (
                      <span
                        key={opt.label}
                        className={`rounded px-2 py-1 ${
                          opt.label === question.correct_answer
                            ? 'bg-green-100 font-semibold text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {opt.label}) {opt.value.slice(0, 30)}
                        {opt.value.length > 30 && '...'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep('upload')}
            className="flex-1 rounded-lg border border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Geri
          </button>
          <button
            type="button"
            onClick={handleBulkInsert}
            disabled={selectedCount === 0 || loading}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              `${selectedCount} Soruyu Kaydet`
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Tamamlandı!</h3>
        <p className="mt-2 text-gray-600">
          {insertResult?.inserted} soru başarıyla soru bankasına eklendi
        </p>
      </div>

      {insertResult && insertResult.errors.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
          <p className="font-semibold text-yellow-900">
            {insertResult.errors.length} soru eklenemedi
          </p>
          <p className="mt-1 text-sm text-yellow-800">
            Bazı sorularda format veya veri hataları tespit edildi.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        Kapat
      </button>
    </div>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            PDF'den Soru Yükle
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            PDF sınav dosyanızdan soruları otomatik olarak çıkarın
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      {step === 'upload' && renderUploadStep()}
      {(step === 'parsing' || step === 'inserting') && (
        <div className="py-12">
          <div className="text-center mb-6">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-lg font-semibold text-gray-900">
              {step === 'parsing' ? 'PDF İşleniyor...' : 'Sorular Kaydediliyor...'}
            </p>
            {progressMessage && (
              <p className="mt-2 text-sm text-gray-600">
                {progressMessage}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {step === 'inserting' && progressTotal > 0 && (
            <div className="mx-auto max-w-md space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>{progressCurrent} / {progressTotal} işlem</span>
                <span className="font-semibold text-blue-600">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {pageImages.length > 0 && (
                <p className="text-xs text-green-600 text-center">
                  ✓ {pageImages.length} sayfa görseli yükleniyor
                </p>
              )}
            </div>
          )}
        </div>
      )}
      {step === 'preview' && renderPreviewStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
}
