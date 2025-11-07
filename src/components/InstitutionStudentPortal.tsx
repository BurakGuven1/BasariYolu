import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookMarked,
  CalendarDays,
  CheckCircle,
  Clock,
  Loader2,
  Megaphone,
  NotebookPen,
  Play,
} from 'lucide-react';
import type {
  InstitutionExamAnswerRecord,
  InstitutionAnnouncement,
  InstitutionAssignment,
  InstitutionExamResult,
  InstitutionStudentRequest,
} from '../lib/institutionStudentApi';
import { submitInstitutionExamResult } from '../lib/institutionStudentApi';
import type {
  InstitutionExamBlueprint,
  InstitutionQuestion,
  InstitutionQuestionChoice,
} from '../lib/institutionQuestionApi';
import { getInstitutionQuestionsByIds } from '../lib/institutionQuestionApi';

interface InstitutionStudentPortalProps {
  request: InstitutionStudentRequest;
  blueprints: InstitutionExamBlueprint[];
  results?: InstitutionExamResult[];
  announcements?: InstitutionAnnouncement[];
  assignments?: InstitutionAssignment[];
  studentId?: string;
  userId?: string;
  onExamSubmitted?: () => void;
}

type AnswerMapEntry = {
  choiceId?: string | null;
  choiceLabel?: string | null;
  text?: string | null;
};

type PortalView = 'overview' | 'exam' | 'summary';

const formatDate = (value: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const getLatestResult = (entries: InstitutionExamResult[]) => entries[0];
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const formatShortDate = (value: string | null) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return value;
  }
};

const getAnnouncementTone = (type: string) => {
  switch (type) {
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'urgent':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
};

const getAssignmentTone = (status: string) => {
  switch (status) {
    case 'completed':
      return 'text-emerald-600';
    case 'archived':
      return 'text-gray-500';
    default:
      return 'text-blue-600';
  }
};

export default function InstitutionStudentPortal({
  request,
  blueprints,
  results = [],
  announcements = [],
  assignments = [],
  studentId,
  userId,
  onExamSubmitted,
}: InstitutionStudentPortalProps) {
  const institutionName = request.institution?.name ?? 'Kurumunuz';
  const resolvedUserId = userId ?? request.user_id;

  const groupedResults = useMemo(() => {
    return results.reduce<Record<string, InstitutionExamResult[]>>((acc, result) => {
      if (!result.exam_blueprint_id) return acc;
      if (!acc[result.exam_blueprint_id]) {
        acc[result.exam_blueprint_id] = [];
      }
      acc[result.exam_blueprint_id].push(result);
      return acc;
    }, {});
  }, [results]);

  const summaryStats = useMemo(() => {
    if (!results.length) {
      return { total: 0, best: 0, average: 0 };
    }
    const best = results.reduce((value, item) => Math.max(value, item.score ?? 0), 0);
    const average =
      results.reduce((sum, item) => sum + (item.score ?? 0), 0) / Math.max(results.length, 1);
    return {
      total: results.length,
      best: Number(best.toFixed(1)),
      average: Number(average.toFixed(1)),
    };
  }, [results]);

  const [view, setView] = useState<PortalView>('overview');
  const [examQuestions, setExamQuestions] = useState<InstitutionQuestion[]>([]);
  const [answerMap, setAnswerMap] = useState<Record<string, AnswerMapEntry>>({});
  const [activeBlueprint, setActiveBlueprint] = useState<InstitutionExamBlueprint | null>(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);
  const [examSummary, setExamSummary] =
    useState<{ correct: number; wrong: number; empty: number; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const latestAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => new Date(b.publish_at).getTime() - new Date(a.publish_at).getTime())
      .slice(0, 4);
  }, [announcements]);

  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      })
      .slice(0, 4);
  }, [assignments]);

  const resetExamState = () => {
    setActiveBlueprint(null);
    setExamQuestions([]);
    setAnswerMap({});
    setExamSummary(null);
    setExamError(null);
    startTimeRef.current = null;
  };

  const handleStartExam = async (blueprint: InstitutionExamBlueprint) => {
    setExamLoading(true);
    setExamError(null);
    setExamSummary(null);
    setActiveBlueprint(blueprint);
    setView('exam');

    try {
      const questions = await getInstitutionQuestionsByIds(blueprint.institution_id, blueprint.question_ids);
      const orderedQuestions = blueprint.question_ids
        .map((questionId) => questions.find((item) => item.id === questionId) ?? null)
        .filter((item): item is InstitutionQuestion => Boolean(item));

      if (!orderedQuestions.length) {
        throw new Error('Bu sınava ait sorular bulunamadı.');
      }

      setExamQuestions(orderedQuestions);
      setAnswerMap({});
      startTimeRef.current = Date.now();
    } catch (error: unknown) {
      console.error('[InstitutionStudentPortal] exam load error:', error);
      setExamError(getErrorMessage(error, 'Sınav yüklenirken hata oluştu.'));
      resetExamState();
      setView('overview');
    } finally {
      setExamLoading(false);
    }
  };

  const handleSelectChoice = (questionId: string, choice: InstitutionQuestionChoice) => {
    setAnswerMap((prev) => ({
      ...prev,
      [questionId]: { choiceId: choice.id, choiceLabel: choice.label ?? null },
    }));
  };

  const handleTextAnswerChange = (questionId: string, value: string) => {
    setAnswerMap((prev) => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), text: value },
    }));
  };

  const calculateSummary = () => {
    let correct = 0;
    let wrong = 0;
    let empty = 0;
    const answersPayload: Record<string, InstitutionExamAnswerRecord> = {};

    for (const question of examQuestions) {
      const entry = answerMap[question.id];

      if (question.question_type === 'multiple_choice') {
        const selected = question.choices.find((choice) => choice.id === entry?.choiceId);
        const isCorrect = Boolean(selected?.isCorrect);
        const isEmpty = !selected;

        answersPayload[question.id] = {
          questionType: question.question_type,
          choiceId: selected?.id ?? entry?.choiceId ?? null,
          choiceLabel: selected?.label ?? entry?.choiceLabel ?? null,
          isCorrect,
        };

        if (isEmpty) empty += 1;
        else if (isCorrect) correct += 1;
        else wrong += 1;
      } else {
        const value = (entry?.text ?? '').trim();
        const expected = (question.answer_key ?? '').trim();
        const hasAnswer = value.length > 0;
        const isCorrect = hasAnswer && expected.length > 0
          ? value.toLowerCase() === expected.toLowerCase()
          : false;

        answersPayload[question.id] = {
          questionType: question.question_type,
          answerText: value || null,
          isCorrect,
        };

        if (!hasAnswer) empty += 1;
        else if (isCorrect) correct += 1;
        else wrong += 1;
      }
    }

    const total = examQuestions.length || 1;
    const score = Number(((correct / total) * 100).toFixed(2));

    return { answersPayload, correct, wrong, empty, score };
  };

  const handleSubmitExam = async () => {
    if (!activeBlueprint || !resolvedUserId) {
      setExamError('Kullanıcı bilgisi bulunamadı.');
      return;
    }

    setSubmitting(true);
    setExamError(null);

    try {
      const { answersPayload, correct, wrong, empty, score } = calculateSummary();
      const durationSeconds = startTimeRef.current
        ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        : null;

      await submitInstitutionExamResult({
        institutionId: request.institution_id,
        examBlueprintId: activeBlueprint.id,
        userId: resolvedUserId,
        studentId,
        questionIds: examQuestions.map((question) => question.id),
        answers: answersPayload,
        correctCount: correct,
        wrongCount: wrong,
        emptyCount: empty,
        score,
        durationSeconds,
      });

      setExamSummary({ correct, wrong, empty, score });
      setView('summary');
      onExamSubmitted?.();
    } catch (error: unknown) {
      console.error('[InstitutionStudentPortal] submit exam error:', error);
      setExamError(getErrorMessage(error, 'Sonuç kaydedilirken hata oluştu.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToOverview = () => {
    resetExamState();
    setView('overview');
  };

  const answeredCount = useMemo(() => {
    return examQuestions.reduce((count, question) => {
      const entry = answerMap[question.id];
      if (!entry) return count;
      if (entry.choiceId) return count + 1;
      if (entry.text && entry.text.trim().length > 0) return count + 1;
      return count;
    }, 0);
  }, [answerMap, examQuestions]);

  const progressPercent = examQuestions.length
    ? Math.round((answeredCount / examQuestions.length) * 100)
    : 0;

  const renderOverview = () => (
    <div className="space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-blue-500">Kurum Öğrenci Alanı</p>
        <h2 className="text-xl font-semibold text-gray-900">{institutionName}</h2>
        <p className="mt-2 text-sm text-gray-600">
          Kurumunuzun paylaştığı sınav taslakları, duyurular ve ödevler bu panelde toplanır; yeni gönderiler otomatik
          olarak burada görünür.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Sınav performansı</p>
            <h3 className="text-lg font-semibold text-gray-900">Genel bakış</h3>
          </div>
          <Award className="h-5 w-5 text-amber-500" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs uppercase text-gray-500">Toplam sınav</p>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs uppercase text-gray-500">En iyi skor</p>
            <p className="text-2xl font-bold text-emerald-600">%{summaryStats.best}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs uppercase text-gray-500">Ortalama skor</p>
            <p className="text-2xl font-bold text-indigo-600">%{summaryStats.average}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Kurumsal duyurular</p>
              <h3 className="text-lg font-semibold text-gray-900">Güncel bilgiler</h3>
            </div>
            <Megaphone className="h-5 w-5 text-purple-500" />
          </div>
          {latestAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-500">Henüz paylaşılmış bir duyuru yok.</p>
          ) : (
            <div className="space-y-3">
              {latestAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`rounded-xl border px-4 py-3 ${getAnnouncementTone(announcement.type)} bg-opacity-70`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-sm text-gray-900">{announcement.title}</p>
                    <span className="text-xs text-gray-600">{formatShortDate(announcement.publish_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{announcement.content}</p>
                  <p className="mt-1 text-xs text-gray-500 capitalize">
                    {announcement.type === 'urgent'
                      ? 'Acil'
                      : announcement.type === 'success'
                        ? 'Başarı'
                        : announcement.type === 'warning'
                          ? 'Uyarı'
                          : 'Bilgilendirme'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ödev & Çalışmalar</p>
              <h3 className="text-lg font-semibold text-gray-900">Gündemdeki görevler</h3>
            </div>
            <NotebookPen className="h-5 w-5 text-rose-500" />
          </div>
          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-gray-500">
              Kurumunuz henüz bir ödev paylaşmadı; yeni görevler burada listelenecek.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">{assignment.title}</p>
                    <span className={`text-xs ${getAssignmentTone(assignment.status)}`}>
                      {assignment.status === 'active'
                        ? 'Aktif'
                        : assignment.status === 'completed'
                          ? 'Tamamlandı'
                          : 'Arşivlendi'}
                    </span>
                  </div>
                  {assignment.description && (
                    <p className="mt-1 text-gray-600 line-clamp-2">{assignment.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {assignment.due_date ? `Bitiş: ${formatShortDate(assignment.due_date)}` : 'Tarih yok'}
                    </span>
                    {assignment.subject && <span>{assignment.subject}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Paylaşılan sınavlar</p>
            <h3 className="text-lg font-semibold text-gray-900">Sınav taslakları</h3>
          </div>
        </div>
        {blueprints.length === 0 ? (
          <p className="text-sm text-gray-500">
            Kurumunuz henüz paylaşılmış bir sınav eklemedi. Sınav oluşturulduğunda burada görünecek.
          </p>
        ) : (
          <div className="space-y-4">
            {blueprints.map((blueprint) => {
              const blueprintHistory = groupedResults[blueprint.id] ?? [];
              const latestResult = getLatestResult(blueprintHistory);

              return (
                <div
                  key={blueprint.id}
                  className="rounded-2xl border border-gray-100 p-5 shadow-sm transition hover:border-blue-200"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                          <BookMarked className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{blueprint.name}</p>
                          <p className="text-xs text-gray-500">
                            {blueprint.exam_type} • {blueprint.question_count} soru
                            {blueprint.duration_minutes ? ` • ${blueprint.duration_minutes} dk` : ''}
                          </p>
                        </div>
                      </div>
                      {blueprint.description && (
                        <p className="mt-2 text-sm text-gray-600">{blueprint.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartExam(blueprint)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4" />
                      <span>Sınava başla</span>
                    </button>
                  </div>

                  {latestResult ? (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                      <p className="text-xs uppercase text-gray-500">Son gönderim</p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-gray-500">Skor</p>
                          <p className="text-lg font-semibold text-emerald-600">
                            %{latestResult.score ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Doğru</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {latestResult.correct_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Yanlış</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {latestResult.wrong_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tarih</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatDate(latestResult.created_at)}
                          </p>
                        </div>
                      </div>
                      {blueprintHistory.length > 1 && (
                        <details className="mt-3 text-xs text-gray-600">
                          <summary className="cursor-pointer font-semibold text-gray-700">
                            Sonuç geçmişi
                          </summary>
                          <ul className="mt-2 space-y-2 text-gray-600">
                            {blueprintHistory.slice(0, 5).map((historyItem) => (
                              <li
                                key={historyItem.id}
                                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-xs"
                              >
                                <span className="font-semibold text-gray-900">
                                  %{historyItem.score ?? 0}
                                </span>
                                <span>
                                  {historyItem.correct_count} doğru • {historyItem.wrong_count} yanlış • {historyItem.empty_count} boş
                                </span>
                                <span className="text-gray-500">{formatDate(historyItem.created_at)}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      Henüz bu sınavı çözmediniz. İlk denemeniz kaydedildiğinde sonuçlar burada görünecek.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );


  const renderExamView = () => {
    if (!activeBlueprint) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleReturnToOverview}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri dön
            </button>
            <p className="text-xs uppercase tracking-wide text-blue-500">Sınav aktif</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{activeBlueprint.name}</h3>
              <p className="text-sm text-gray-500">
                {activeBlueprint.question_count} soru
                {activeBlueprint.duration_minutes ? ` • ${activeBlueprint.duration_minutes} dakika` : ''}
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <span>
                  Süre:{' '}
                  {activeBlueprint.duration_minutes ? `${activeBlueprint.duration_minutes} dk` : 'Süre sınırı yok'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>
                  İlerleme: {answeredCount}/{examQuestions.length} ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {examError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{examError}</span>
          </div>
        )}

        {examLoading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-10 text-sm text-gray-500">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-blue-500" />
            Sorular yükleniyor...
          </div>
        ) : (
          <div className="space-y-4">
            {examQuestions.map((question, index) => {
              const entry = answerMap[question.id];
              const questionNumber = index + 1;
              return (
                <div key={question.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Soru {questionNumber}</p>
                      <p className="mt-1 font-semibold text-gray-900">{question.question_text}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {question.subject} • {question.topic}
                    </span>
                  </div>

                  {question.passage_text && (
                    <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
                      {question.passage_text}
                    </div>
                  )}

                  {question.question_type === 'multiple_choice' ? (
                    <div className="mt-4 space-y-2">
                      {question.choices.map((choice) => (
                        <label
                          key={choice.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                            entry?.choiceId === choice.id
                              ? 'border-blue-200 bg-blue-50 text-blue-900'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            checked={entry?.choiceId === choice.id}
                            onChange={() => handleSelectChoice(question.id, choice)}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {choice.label}. {choice.text}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="text-xs uppercase text-gray-500">Yanıtınız</label>
                      <textarea
                        value={entry?.text ?? ''}
                        onChange={(event) => handleTextAnswerChange(question.id, event.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-0"
                        rows={4}
                        placeholder="Yanıtınızı buraya yazın"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!examLoading && !!examQuestions.length && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {examQuestions.length} soruluk sınavı tamamladığınızda sonuçlar otomatik hesaplanır.
            </p>
            <button
              onClick={handleSubmitExam}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Sınavı tamamla
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSummaryView = () => {
    if (!examSummary || !activeBlueprint) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Sınav tamamlandı</h3>
          <p className="mt-2 text-sm text-gray-600">
            {activeBlueprint.name} sınavı için sonuçlarınız başarıyla kaydedildi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xs uppercase text-gray-500">Skor</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">%{examSummary.score}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xs uppercase text-gray-500">Doğru</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{examSummary.correct}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xs uppercase text-gray-500">Yanlış</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{examSummary.wrong}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xs uppercase text-gray-500">Boş</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{examSummary.empty}</p>
          </div>
        </div>

        <button
          onClick={handleReturnToOverview}
          className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Panele dön
        </button>
      </div>
    );
  };

  if (view === 'exam') {
    return renderExamView();
  }

  if (view === 'summary') {
    return renderSummaryView();
  }

  return renderOverview();
}
