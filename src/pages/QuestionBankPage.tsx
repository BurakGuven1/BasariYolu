import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, Download, Filter, Loader2, Printer, RefreshCw, ArrowLeft } from 'lucide-react';
import {
  fetchQuestionSets,
  fetchQuestions,
  fetchTopicsBySubject,
  fetchWeightedSubjectQuestions,
  QuestionOwnerScope,
  QuestionRecord,
  QuestionRequest,
  QuestionSetSummary,
} from '../lib/questionBank';
import { useAuth } from '../hooks/useAuth';
import { InstitutionSession, refreshInstitutionSession } from '../lib/institutionApi';
import { sanitizeHTML } from '../utils/security';

const SUBJECTS = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilimler', 'İngilizce'];

const DIFFICULTIES = [
  { label: 'Kolay', value: 'easy' },
  { label: 'Orta', value: 'medium' },
  { label: 'Zor', value: 'hard' },
];

const OWNER_SCOPES = [
  { label: 'Tum Kaynaklar', value: 'all' },
  { label: 'Platform', value: 'platform' },
  { label: 'Kurum', value: 'institution' },
  { label: 'Ogretmen', value: 'teacher' },
];

const LEVELS = [
  { label: '5. Sinif', value: '5sinif' },
  { label: '6. Sinif', value: '6sinif' },
  { label: '7. Sinif', value: '7sinif' },
  { label: '8. Sinif', value: '8sinif' },
  { label: 'TYT', value: 'tyt' },
  { label: 'AYT', value: 'ayt' },
];

const DEFAULT_LIMIT = 10;
const EXAM_PRESETS = {
  lgs: {
    label: 'LGS Denemesi',
    description: '20 Türkçe • 20 Matematik • 20 Fen • 10 Tarih • 10 Din • 10 İngilizce',
    level: '8sinif',
    slots: [
      { subject: 'Türkçe', count: 20 },
      { subject: 'Matematik', count: 20 },
      { subject: 'Fen Bilimleri', count: 20 },
      { subject: 'T.C. İnkılap Tarihi ve Atatürkçülük', count: 10 },
      { subject: 'Din Kültürü ve Ahlak Bilgisi', count: 10 },
      { subject: 'İngilizce', count: 10 },
    ],
  },
  tyt: {
    label: 'TYT Denemesi',
    description: '40 Türkçe • 40 Matematik • 20 Fen • 20 Sosyal (120 soru)',
    level: 'tyt',
    slots: [
      { subject: 'Türkçe', count: 40 },
      { subject: 'Matematik', count: 40 },
      { subject: 'Fen Bilimleri', count: 20 },
      { subject: 'Sosyal Bilimler', count: 20 },
    ],
  },
  aytSay: {
    label: 'AYT Sayısal',
    description: '40 Matematik • 14 Fizik • 13 Kimya • 13 Biyoloji',
    level: 'ayt',
    slots: [
      { subject: 'Matematik', count: 40 },
      { subject: 'Fizik', count: 14 },
      { subject: 'Kimya', count: 13 },
      { subject: 'Biyoloji', count: 13 },
    ],
  },
  aytEa: {
    label: 'AYT Eşit Ağırlık',
    description: '40 Matematik • 20 Edebiyat • 10 Tarih-1 • 6 Coğrafya-1',
    level: 'ayt',
    slots: [
      { subject: 'Matematik', count: 40 },
      { subject: 'Edebiyat', count: 20 },
      { subject: 'Tarih-1', count: 10 },
      { subject: 'Cografya-1', count: 6 },
    ],
  },
  aytSoz: {
    label: 'AYT Sözel',
    description: '24 Edebiyat • 10 Tarih-1 • 6 Coğrafya-1 • 11 Tarih-2 • 11 Coğrafya-2 • 12 Felsefe • 6 Din',
    level: 'ayt',
    slots: [
      { subject: 'Edebiyat', count: 24 },
      { subject: 'Tarih-1', count: 10 },
      { subject: 'Cografya-1', count: 6 },
      { subject: 'Tarih-2', count: 11 },
      { subject: 'Cografya-2', count: 11 },
      { subject: 'Felsefe', count: 12 },
      { subject: 'Din', count: 6 },
    ],
  },
} as const;

type ExamPresetKey = keyof typeof EXAM_PRESETS;

type AnswerMap = Record<string, string>;

interface QuestionAggregate {
  total: number;
  correct: number;
  incorrect: number;
  blank: number;
}

interface QuestionResultDetail {
  status: 'correct' | 'incorrect' | 'blank';
  correctAnswerLabel?: string;
  correctAnswerValue?: string;
  selectedAnswer?: string;
  subject: string;
  topic: string;
}

interface QuestionResultsSummary {
  total: number;
  correct: number;
  incorrect: number;
  blank: number;
  detail: Record<string, QuestionResultDetail>;
  bySubject: Record<string, QuestionAggregate>;
  byTopic: Record<string, QuestionAggregate>;
}

const createAggregate = (): QuestionAggregate => ({
  total: 0,
  correct: 0,
  incorrect: 0,
  blank: 0,
});

export default function QuestionBankPage() {
  useAuth();
  const navigate = useNavigate();
  const [institutionSession, setInstitutionSession] = useState<InstitutionSession | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    topic: '',
    tags: '',
    difficulty: '',
    ownerScope: 'all',
    level: '',
    count: DEFAULT_LIMIT,
  });
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSetSummary[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<QuestionResultsSummary | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingSets, setLoadingSets] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshInstitutionSession()
      .then(setInstitutionSession)
      .catch(() => setInstitutionSession(null));
  }, []);

  useEffect(() => {
    if (!filters.subject) {
      setAvailableTopics([]);
      if (filters.topic) {
        setFilters((prev) => ({ ...prev, topic: '' }));
      }
      return;
    }
    let active = true;
    setTopicsLoading(true);
    fetchTopicsBySubject(filters.subject)
      .then((topics) => {
        if (active) setAvailableTopics(topics);
      })
      .catch(() => {
        if (active) setAvailableTopics([]);
      })
      .finally(() => {
        if (active) setTopicsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters.subject]);

  const normalizedRequest = useMemo<QuestionRequest>(() => {
    const payload: QuestionRequest = { count: filters.count, ownerScope: filters.ownerScope as any };
    if (filters.subject) payload.subject = filters.subject;
    if (filters.topic) payload.topic = filters.topic;
    if (filters.difficulty) payload.difficulty = filters.difficulty as any;
    const tagList = filters.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tagList.length) payload.tags = tagList;
    if (filters.level) payload.levels = [filters.level];
    if (filters.ownerScope === 'institution' && institutionSession?.institution?.id) {
      payload.ownerIds = [institutionSession.institution.id];
    }
    return payload;
  }, [filters, institutionSession]);

  const handleFetchQuestions = async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const data = await fetchQuestions(normalizedRequest);
      setQuestions(data);
      setAnswers({});
      setResults(null);
      setShowExplanations(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sorular yüklenirken bir hata oluştu';
      setError(message);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    handleFetchQuestions();
  }, []);

  useEffect(() => {
    const loadQuestionSets = async () => {
      setLoadingSets(true);
      try {
        const sets = await fetchQuestionSets({
          institutionId: institutionSession?.institution?.id,
          includePublic: true,
          limit: 10,
        });
        setQuestionSets(sets);
      } catch (err) {
        console.error('Question sets error', err);
      } finally {
        setLoadingSets(false);
      }
    };
    loadQuestionSets();
  }, [institutionSession]);

  const handlePrint = () => {
    if (!questions.length) return;

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="UTF-8" />
          <title>basariyolum.com</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              font-size: 12px;
              color: #1f2937;
              margin: 20px;
              background: #fff;
            }
            .print-header {
              text-align: center;
              margin-bottom: 24px;
            }
            .print-header h1 {
              margin: 0;
              font-size: 18px;
              letter-spacing: 0.05em;
              text-transform: uppercase;
            }
            .print-header p {
              margin: 4px 0 0;
              color: #6b7280;
              font-size: 12px;
            }
            .questions {
              column-count: 2;
              column-gap: 24px;
            }
            .question {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 12px;
              margin-bottom: 16px;
              background: #fafafa;
            }
            .question-header {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .stem {
              font-size: 12px;
            }
            .stem p {
              margin: 4px 0;
            }
            .options {
              margin: 8px 0 0;
              padding-left: 16px;
            }
            .options li {
              margin-bottom: 4px;
            }
            .answer-line {
              margin-top: 6px;
              font-size: 11px;
              color: #4b5563;
            }
            @media print {
              body {
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <header class="print-header">
            <h1>Başarılar Dileriz</h1>
            <h3>basariyolum.com</h3>
            <p>${new Date().toLocaleDateString('tr-TR')}</p>
          </header>
          <section class="questions">
            ${questions
              .map((question, index) => {
                const options = question.content?.options
                  ?.map(
                    (option) =>
                      `<li><strong>${option.label}.</strong> ${option.value ?? ''}</li>`,
                  )
                  .join('') ?? '';

                return `
                  <article class="question">
                    <div class="question-header">
                      Soru ${index + 1} • ${question.subject} • ${question.topic}
                    </div>
                    <div class="stem">${question.content?.stem ?? ''}</div>
                    ${
                      options
                        ? `<ol class="options">${options}</ol>`
                        : '<p class="answer-line">Cevap alanı:</p>'
                    }
                    <div class="answer-line">Cevabım: ___________</div>
                  </article>
                `;
              })
              .join('')}
          </section>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFilters((prev) => {
      if (field === 'subject') {
        return { ...prev, subject: value as string, topic: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleBuildExam = async (presetId: ExamPresetKey) => {
    const preset = EXAM_PRESETS[presetId];
    setExamLoading(true);
    setError(null);
    try {
      const aggregated: QuestionRecord[] = [];
      const baseLevels = preset.level ? [preset.level] : filters.level ? [filters.level] : undefined;
      const missingSubjects: string[] = [];
      const insufficientSubjects: Array<{ subject: string; needed: number; found: number }> = [];

      for (const slot of preset.slots) {
        const slotQuestions = await fetchWeightedSubjectQuestions(
          slot.subject,
          slot.count,
          {
            ownerScope: filters.ownerScope as QuestionOwnerScope,
            levels: baseLevels,
          },
        );

        // Yetersiz soru kontrolü
        if (slotQuestions.length === 0) {
          missingSubjects.push(`${slot.subject} (0/${slot.count} soru)`);
        } else if (slotQuestions.length < slot.count) {
          insufficientSubjects.push({
            subject: slot.subject,
            needed: slot.count,
            found: slotQuestions.length,
          });
        }

        aggregated.push(...slotQuestions);
      }

      // Hata mesajları
      if (missingSubjects.length > 0 || insufficientSubjects.length > 0) {
        let errorMsg = '⚠️ Deneme oluşturuldu ancak eksiklikler var:\n\n';

        if (missingSubjects.length > 0) {
          errorMsg += `❌ Hiç soru bulunamayan dersler: ${missingSubjects.join(', ')}\n\n`;
        }

        if (insufficientSubjects.length > 0) {
          errorMsg += '⚠️ Yetersiz soru olan dersler:\n';
          insufficientSubjects.forEach(({ subject, needed, found }) => {
            errorMsg += `  • ${subject}: ${found}/${needed} soru bulundu\n`;
          });
          errorMsg += '\n';
        }

        errorMsg += `✅ Toplam ${aggregated.length}/${preset.slots.reduce((sum, s) => sum + s.count, 0)} soru oluşturuldu.\n\n`;
        errorMsg += '💡 İpucu: Daha fazla soru eklemek için Kurum Dashboard\'dan soru yükleyin.';

        setError(errorMsg);
      }

      setQuestions(aggregated);
      setAnswers({});
      setResults(null);
      setShowExplanations(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deneme oluşturulamadı';
      setError(message);
    } finally {
      setExamLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, label: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  };

  const resetAnswers = () => {
    setAnswers({});
    setResults(null);
    setShowExplanations(false);
  };

  const evaluateTest = () => {
    if (!questions.length) return;
    const detail: Record<string, QuestionResultDetail> = {};
    const bySubject: Record<string, QuestionAggregate> = {};
    const byTopic: Record<string, QuestionAggregate> = {};

    let correct = 0;
    let incorrect = 0;
    let blank = 0;

    questions.forEach((question) => {
      const selectedLabel = answers[question.id];
      const answerValue = question.answer_key?.value?.toString().trim().toLowerCase();
      const selectedOption = question.content?.options?.find((opt) => opt.label === selectedLabel);
      const selectedValue = selectedOption?.value?.toString().trim().toLowerCase();

      let status: 'correct' | 'incorrect' | 'blank' = 'blank';
      if (selectedLabel) {
        if (answerValue) {
          const normalizedLabel = selectedLabel.trim().toLowerCase();
          if (normalizedLabel === answerValue || selectedValue === answerValue) {
            status = 'correct';
            correct += 1;
          } else {
            status = 'incorrect';
            incorrect += 1;
          }
        } else {
          status = 'blank';
          blank += 1;
        }
      } else {
        blank += 1;
      }

      const subjectStats = bySubject[question.subject] || createAggregate();
      const topicStats = byTopic[question.topic] || createAggregate();
      subjectStats.total += 1;
      topicStats.total += 1;
      if (status === 'correct') {
        subjectStats.correct += 1;
        topicStats.correct += 1;
      } else if (status === 'incorrect') {
        subjectStats.incorrect += 1;
        topicStats.incorrect += 1;
      } else {
        subjectStats.blank += 1;
        topicStats.blank += 1;
      }
      bySubject[question.subject] = subjectStats;
      byTopic[question.topic] = topicStats;

      let correctAnswerLabel: string | undefined;
      if (answerValue && question.content?.options) {
        const matched = question.content.options.find((opt) => {
          return (
            opt.label.trim().toLowerCase() === answerValue ||
            opt.value?.toString().trim().toLowerCase() === answerValue
          );
        });
        correctAnswerLabel = matched?.label;
      }

      detail[question.id] = {
        status,
        correctAnswerLabel,
        correctAnswerValue: question.answer_key?.value?.toString(),
        selectedAnswer: selectedLabel,
        subject: question.subject,
        topic: question.topic,
      };
    });

    setResults({
      total: questions.length,
      correct,
      incorrect,
      blank,
      detail,
      bySubject,
      byTopic,
    });
    setShowExplanations(true);
  };

  const renderSummary = () => {
    if (!results) return null;
    const renderAggregate = (title: string, data: Record<string, QuestionAggregate>) => (
      <div className="rounded-2xl border border-gray-100 p-4 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        {Object.keys(data).length === 0 ? (
          <p className="mt-2 text-xs text-gray-500">Veri yok</p>
        ) : (
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            {Object.entries(data).map(([key, stats]) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                <div className="font-semibold text-gray-800">{key}</div>
                <div className="flex gap-3">
                  <span className="text-green-600">D: {stats.correct}</span>
                  <span className="text-red-500">Y: {stats.incorrect}</span>
                  <span className="text-gray-500">B: {stats.blank}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    return (
      <section className="rounded-3xl border border-gray-100 bg-white/60 p-6 shadow-inner">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-gray-500">Sonuçlar</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {results.correct} Doğru • {results.incorrect} Yanlış • {results.blank} Boş
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={evaluateTest}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Sonucu Yenile
            </button>
            <button
              onClick={resetAnswers}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Testi Sıfırla
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {renderAggregate('Ders Bazlı Performans', results.bySubject)}
          {renderAggregate('Konu Bazlı Performans', results.byTopic)}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-4 space-y-8">
        {/* Geri Dönüş Butonu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </button>
          <div className="text-sm text-gray-500">
            Dashboard'a veya bir önceki sayfaya dön
          </div>
        </div>

        <header className="rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/80">Soru Bankası</p>
              <h1 className="text-3xl font-bold md:text-4xl">Akıllı Soru Seçici</h1>
              <p className="mt-3 max-w-2xl text-base text-white/90">
                Konu, ders, zorluk ya da etiketlere göre saniyeler içinde özel soru listeleri oluştur. Kurum PDF testlerini indir,
                çıktısını al veya çevrim içi çöz.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Printer className="h-4 w-4" />
                Çıktı Al
              </button>
              <button
                onClick={() => {
                  if (!questions.length) return;
                  const answerSheet = questions
                    .map((question, index) => {
                      const answerValue = question.answer_key?.value?.toString() ?? '';
                      const matched =
                        question.content?.options?.find(
                          (opt) =>
                            opt.label.trim().toLowerCase() === answerValue.trim().toLowerCase() ||
                            opt.value?.toString().trim().toLowerCase() === answerValue.trim().toLowerCase(),
                        )?.label ?? answerValue;
                      return `Soru ${index + 1}: ${matched}`;
                    })
                    .join('\n');
                  const blob = new Blob([answerSheet], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const downloadLink = document.createElement('a');
                  downloadLink.href = url;
                  downloadLink.download = 'soru-bankasi-cevap-anahtari.txt';
                  downloadLink.click();
                  setTimeout(() => URL.revokeObjectURL(url), 500);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-70"
              >
                <BookOpenCheck className="h-4 w-4" />
                Cevap Anahtarı
              </button>
              <button
                onClick={handleFetchQuestions}
                disabled={loadingQuestions}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-70"
              >
                {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Soruları Yenile
              </button>
            </div>
          </div>
        </header>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <BookOpenCheck className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deneme Oluştur</h2>
              <p className="text-sm text-gray-500">
                Çıkmış konu dağılımlarına göre hazır sınavler oluştur. Her buton o sınav tipinin soru sayısı ve sırasını kullanır.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {Object.entries(EXAM_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleBuildExam(key as ExamPresetKey)}
                disabled={examLoading}
                className="flex w-full flex-col items-start rounded-2xl border border-gray-100 p-4 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md disabled:opacity-60"
              >
                <div className="flex w-full items-center justify-between">
                  <p className="text-base font-semibold text-gray-900">{preset.label}</p>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {preset.level?.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{preset.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Filter className="h-5 w-5 text-indigo-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filtreler</h2>
              <p className="text-sm text-gray-500">
                İstediğin ders, konu ve zorluk düzeyini seç. Etiketleri virgülle ayırabilirsin.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Ders</label>
              <select
                value={filters.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Hepsi</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Konu</label>
              <select
                value={filters.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                disabled={!filters.subject || topicsLoading || !availableTopics.length}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">{filters.subject ? 'Hepsi' : 'Önce ders seçin'}</option>
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              {!filters.subject ? (
                <p className="mt-1 text-xs text-gray-500">Konu seçebilmek için önce ders seçin.</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Zorluk</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Hepsi</option>
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Etiketler</label>
              <input
                value={filters.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="fonksiyon, deneme"
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Sahiplik</label>
              <select
                value={filters.ownerScope}
                onChange={(e) => handleInputChange('ownerScope', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                {OWNER_SCOPES.map((scope) => (
                  <option key={scope.value} value={scope.value}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Soru Sayısı</label>
              <input
                type="number"
                min={1}
                max={200}
                value={filters.count}
                onChange={(e) => handleInputChange('count', Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Seviye</label>
              <select
                value={filters.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Hepsi</option>
                {LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleFetchQuestions}
              disabled={loadingQuestions}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {loadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              Soruları Getir
            </button>
            <button
              onClick={() => {
                setFilters({
                  subject: '',
                  topic: '',
                  tags: '',
                  difficulty: '',
                  ownerScope: 'all',
                  level: '',
                  count: DEFAULT_LIMIT,
                });
                setQuestions([]);
                resetAnswers();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Filtreleri Sıfırla
            </button>
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 whitespace-pre-line">
              {error}
            </p>
          )}
        </section>

        {renderSummary()}

        <section className="space-y-4 rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <BookOpenCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sorular</h2>
              <p className="text-sm text-gray-500">
                Seçili filtrelere göre getirilen sorular. Şıkları işaretle, testi değerlendir ve performansını izle.
              </p>
            </div>
          </div>
          {questions.length ? (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={evaluateTest}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Testi Değerlendir
              </button>
              <button
                onClick={() => setShowExplanations((prev) => !prev)}
                disabled={!results}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                {showExplanations ? 'Açıklamaları Gizle' : 'Açıklamaları Göster'}
              </button>
              <button
                onClick={resetAnswers}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                İşaretleri Temizle
              </button>
            </div>
          ) : null}
          {loadingQuestions && !questions.length ? (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-3 text-sm">Sorular yükleniyor...</span>
            </div>
          ) : questions.length ? (
            <ol className="space-y-5">
              {questions.map((question, index) => {
                const answer = answers[question.id];
                const evaluation = results?.detail[question.id];
                const isAnswered = Boolean(answer);
                const statusClass =
                  evaluation?.status === 'correct'
                    ? 'border-emerald-300 bg-emerald-50'
                    : evaluation?.status === 'incorrect'
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-gray-100 bg-white';

                return (
                  <li key={question.id} className={`rounded-2xl border p-5 shadow-sm ${statusClass}`}>
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-gray-500">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
                        Soru {index + 1}
                      </span>
                      <span>{question.subject}</span>
                      <span>•</span>
                      <span>{question.topic}</span>
                      <span>•</span>
                      <span className="capitalize">{question.difficulty}</span>
                    </div>
                    <div
                      className="prose prose-sm mt-4 max-w-none text-gray-900"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(question.content?.stem ?? '') }}
                    />
                    {question.content?.options?.length ? (
                      <div className="mt-4 space-y-2">
                        {question.content.options.map((option) => {
                          const isSelected = answer === option.label;
                          const isCorrectOption =
                            evaluation?.correctAnswerLabel === option.label ||
                            evaluation?.correctAnswerValue?.trim().toLowerCase() ===
                              option.value?.toString().trim().toLowerCase();
                          let optionStyle = 'border-gray-100 bg-gray-50 text-gray-700';
                          if (!results && isSelected) optionStyle = 'border-indigo-200 bg-indigo-50 text-indigo-800';
                          if (results && isCorrectOption)
                            optionStyle = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                          if (results && isSelected && evaluation?.status === 'incorrect')
                            optionStyle = 'border-rose-300 bg-rose-50 text-rose-700';

                          return (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => handleOptionSelect(question.id, option.label)}
                              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-2 text-left text-sm transition ${optionStyle}`}
                            >
                              <span className="font-semibold">{option.label}.</span>
                              <span>{option.value}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        Bu soru için seçenek bulunamadı. Açıklama kısmını inceleyin.
                      </p>
                    )}
                    {results ? (
                      <div className="mt-3 text-sm">
                        {evaluation?.status === 'correct' && (
                          <p className="font-semibold text-emerald-600">Doğru cevap!</p>
                        )}
                        {evaluation?.status === 'incorrect' && (
                          <p className="font-semibold text-rose-600">
                            Yanlış cevap. Doğru seçenek: {evaluation.correctAnswerLabel || evaluation.correctAnswerValue}
                          </p>
                        )}
                        {evaluation?.status === 'blank' && (
                          <p className="font-semibold text-gray-500">Boş bırakıldı.</p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-gray-500">
                        {isAnswered ? 'Bu soruyu işaretledin.' : 'Bu soruyu henüz işaretlemedin.'}
                      </p>
                    )}

                    {results && showExplanations && (
                      <div className="mt-4 space-y-3 rounded-2xl bg-white/80 p-4 text-sm shadow-inner">
                        {question.answer_key?.explanation ? (
                          <div>
                            <p className="font-semibold text-gray-800">Cevap Açıklaması</p>
                            <p className="mt-1 text-gray-600">{question.answer_key.explanation}</p>
                          </div>
                        ) : null}
                        {Array.isArray(question.solution?.steps) && question.solution.steps.length ? (
                          <div>
                            <p className="font-semibold text-gray-800">Çözüm Adımları</p>
                            <ol className="mt-1 space-y-1 text-gray-600">
                              {question.solution.steps.map((step: string, idx: number) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-gray-500">Henüz kriterlere uygun soru bulunamadı.</p>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <Download className="h-5 w-5 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">PDF Testleri</h2>
              <p className="text-sm text-gray-500">
                Kurumlar ve BasariYolu tarafından paylaşılan test PDF’leri. İndirip yazdırarak çözebilirsiniz.
              </p>
            </div>
          </div>
          {loadingSets && !questionSets.length ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">PDF listesi yükleniyor...</span>
            </div>
          ) : questionSets.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {questionSets.map((set) => (
                <article key={set.id} className="rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {set.visibility === 'public' ? 'Genel' : 'Kurum İçin'}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">{set.title}</h3>
                  {set.description ? (
                    <p className="mt-2 text-sm text-gray-600">{set.description}</p>
                  ) : null}
                  {set.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {set.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={set.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      PDF İndir
                    </a>
                    <span className="text-xs text-gray-400">
                      {new Date(set.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Henüz paylaşılmış PDF testi bulunmuyor.</p>
          )}
        </section>
      </div>
    </div>
  );
}
