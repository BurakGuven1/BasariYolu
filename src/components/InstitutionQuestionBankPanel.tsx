import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Edit3, CheckCircle2, Circle, FilePlus, Upload, Image as ImageIcon, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import type { InstitutionSession } from '../lib/institutionApi';
import type {
  InstitutionExamBlueprint,
  InstitutionQuestion,
  InstitutionQuestionChoice,
  InstitutionQuestionDifficulty,
  InstitutionQuestionSummary,
} from '../lib/institutionQuestionApi';
import {
  createInstitutionExamBlueprint,
  createInstitutionQuestion,
  deleteInstitutionExamBlueprint,
  deleteInstitutionQuestion,
  fetchInstitutionQuestionSummary,
  listInstitutionExamBlueprints,
  listInstitutionQuestions,
  toggleInstitutionQuestionPublish,
  updateInstitutionExamBlueprint,
  updateInstitutionQuestion,
} from '../lib/institutionQuestionApi';
import InstitutionPDFQuestionUpload from './InstitutionPDFQuestionUpload';

const SUBJECTS = ['Turkce', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'Ingilizce', 'Din Kulturu'];
const PAGE_SIZE = 20;

interface QuestionFormState {
  id?: string;
  type: 'multiple_choice' | 'written';
  subject: string;
  topic: string;
  difficulty: InstitutionQuestionDifficulty;
  passageText: string;
  questionPrompt: string;
  text: string;
  choices: InstitutionQuestionChoice[];
  answerKey: string;
  explanation: string;
  tags: string;
  published: boolean;
  page_number?: number | null;
  page_image_url?: string | null;
}

interface BlueprintFormState {
  id?: string;
  name: string;
  examType: string;
  description: string;
  durationMinutes: number | '';
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

const defaultChoices = (): InstitutionQuestionChoice[] => [
  { id: 'A', label: 'A', text: '', isCorrect: true },
  { id: 'B', label: 'B', text: '', isCorrect: false },
  { id: 'C', label: 'C', text: '', isCorrect: false },
  { id: 'D', label: 'D', text: '', isCorrect: false },
];

const emptyQuestionForm = (subject: string, topic = ''): QuestionFormState => ({
  type: 'multiple_choice',
  subject,
  topic,
  difficulty: 'medium',
  passageText: '',
  questionPrompt: '',
  text: '',
  choices: defaultChoices(),
  answerKey: '',
  explanation: '',
  tags: '',
  published: false,
});

const emptyBlueprintForm = (): BlueprintFormState => ({
  name: '',
  examType: 'Ozel',
  description: '',
  durationMinutes: 40,
});

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ open, title, onClose, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 sm:py-10">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl sm:rounded-3xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            Kapat
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

interface InstitutionQuestionBankPanelProps {
  session: InstitutionSession;
}

export default function InstitutionQuestionBankPanel({ session }: InstitutionQuestionBankPanelProps) {
  const { institution, user } = session;

  const [summary, setSummary] = useState<InstitutionQuestionSummary>({
    totalQuestions: 0,
    publishedQuestions: 0,
    draftQuestions: 0,
    subjects: [],
  });
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [questions, setQuestions] = useState<InstitutionQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [search, setSearch] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(emptyQuestionForm(SUBJECTS[0]));
  const [questionMode, setQuestionMode] = useState<'create' | 'edit'>('create');

  const [blueprints, setBlueprints] = useState<InstitutionExamBlueprint[]>([]);
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [blueprintForm, setBlueprintForm] = useState<BlueprintFormState>(emptyBlueprintForm());
  const [blueprintMode, setBlueprintMode] = useState<'create' | 'edit'>('create');

  const [pdfUploadModalOpen, setPdfUploadModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<Feedback>(null);

  const publishValue = useMemo(() => {
    if (statusFilter === 'published') return true;
    if (statusFilter === 'draft') return false;
    return undefined;
  }, [statusFilter]);

  const subjectOptions = useMemo(() => {
    const dynamic = summary.subjects.map((item) => item.subject);
    return ['all', ...new Set([...SUBJECTS, ...dynamic])];
  }, [summary.subjects]);

  const topicOptions = useMemo(() => {
    if (subjectFilter === 'all') return ['all'];
    const entry = summary.subjects.find((item) => item.subject === subjectFilter);
    if (!entry) return ['all'];
    const topics = entry.topics?.map((topic: any) => (typeof topic === 'string' ? topic : topic?.name ?? ''));
    return ['all', ...new Set(topics?.filter(Boolean) ?? [])];
  }, [subjectFilter, summary.subjects]);

  const totalPages = useMemo(() => (questionCount ? Math.ceil(questionCount / PAGE_SIZE) : 1), [questionCount]);

  useEffect(() => {
    const loadSummary = async () => {
      setSummaryLoading(true);
      try {
        const data = await fetchInstitutionQuestionSummary(institution.id);
        setSummary(data);
      } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', message: 'Soru ozeti yuklenemedi.' });
      } finally {
        setSummaryLoading(false);
      }
    };

    const loadBlueprints = async () => {
      try {
        const data = await listInstitutionExamBlueprints(institution.id);
        setBlueprints(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadSummary();
    loadBlueprints();
  }, [institution.id]);

  useEffect(() => {
    const loadQuestions = async () => {
      setQuestionLoading(true);
      try {
        const { data, count } = await listInstitutionQuestions({
          institutionId: institution.id,
          subject: subjectFilter,
          topic: topicFilter,
          search,
          isPublished: publishValue,
          page,
          pageSize: PAGE_SIZE,
        });
        setQuestions(data);
        setQuestionCount(count);
      } catch (error) {
        console.error(error);
        setFeedback({ type: 'error', message: 'Sorular yuklenemedi.' });
      } finally {
        setQuestionLoading(false);
      }
    };

    loadQuestions();
  }, [institution.id, subjectFilter, topicFilter, publishValue, search, page]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const openEditQuestion = (question: InstitutionQuestion) => {
    setQuestionForm({
      id: question.id,
      type: question.question_type,
      subject: question.subject,
      topic: question.topic,
      difficulty: question.difficulty,
      passageText: question.passage_text ?? '',
      questionPrompt: question.question_prompt ?? question.question_text ?? '',
      text: question.question_text,
      choices: question.choices.length ? question.choices : defaultChoices(),
      answerKey: question.answer_key ?? '',
      explanation: question.explanation ?? '',
      tags: (question.tags ?? []).join(', '),
      published: question.is_published,
      page_number: question.page_number ?? null,
      page_image_url: question.page_image_url ?? null,
    });
    setQuestionMode('edit');
    setQuestionModalOpen(true);
  };

  const validateQuestion = () => {
    if (!questionForm.text.trim()) {
      setFeedback({ type: 'error', message: 'Soru metni bos olamaz.' });
      return false;
    }
    if (!questionForm.topic.trim()) {
      setFeedback({ type: 'error', message: 'Konu girin.' });
      return false;
    }
    if (questionForm.type === 'multiple_choice') {
      if (!questionForm.choices.every((choice) => choice.text.trim())) {
        setFeedback({ type: 'error', message: 'Tum secenek metinlerini girin.' });
        return false;
      }
      if (!questionForm.choices.some((choice) => choice.isCorrect)) {
        setFeedback({ type: 'error', message: 'Dogru secenegi isaretleyin.' });
        return false;
      }
    } else if (!questionForm.answerKey.trim()) {
      setFeedback({ type: 'error', message: 'Cevap anahtari ekleyin.' });
      return false;
    }
    return true;
  };

  const handleQuestionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateQuestion()) return;

    const tags = questionForm.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      if (questionMode === 'create') {
        await createInstitutionQuestion({
          institutionId: institution.id,
          createdBy: user.id,
          questionType: questionForm.type,
          subject: questionForm.subject,
          topic: questionForm.topic,
          difficulty: questionForm.difficulty,
          passageText: questionForm.passageText,
          questionPrompt: questionForm.questionPrompt || questionForm.text,
          questionText: questionForm.text,
          choices: questionForm.type === 'multiple_choice' ? questionForm.choices : [],
          answerKey: questionForm.type === 'written' ? questionForm.answerKey : null,
          explanation: questionForm.explanation || null,
          tags,
          isPublished: questionForm.published,
        });
        setFeedback({ type: 'success', message: 'Soru kaydedildi.' });
      } else if (questionForm.id) {
        await updateInstitutionQuestion({
          questionId: questionForm.id,
          questionType: questionForm.type,
          subject: questionForm.subject,
          topic: questionForm.topic,
          difficulty: questionForm.difficulty,
          passageText: questionForm.passageText,
          questionPrompt: questionForm.questionPrompt || questionForm.text,
          questionText: questionForm.text,
          choices: questionForm.type === 'multiple_choice' ? questionForm.choices : [],
          answerKey: questionForm.type === 'written' ? questionForm.answerKey : null,
          explanation: questionForm.explanation || null,
          tags,
          isPublished: questionForm.published,
        });
        setFeedback({ type: 'success', message: 'Soru guncellendi.' });
      }
      setQuestionModalOpen(false);
      const refreshed = await fetchInstitutionQuestionSummary(institution.id);
      setSummary(refreshed);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Soru kaydedilirken hata olustu.' });
    }
  };

  const handleDeleteQuestion = async (question: InstitutionQuestion) => {
    if (!window.confirm('Bu soruyu silmek istediginize emin misiniz?')) return;
    try {
      await deleteInstitutionQuestion(question.id);
      setFeedback({ type: 'success', message: 'Soru silindi.' });
      setSelectedIds((prev) => prev.filter((id) => id !== question.id));
      const refreshed = await fetchInstitutionQuestionSummary(institution.id);
      setSummary(refreshed);
      setPage(1);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Soru silinemedi.' });
    }
  };

  const handleTogglePublish = async (question: InstitutionQuestion) => {
    try {
      await toggleInstitutionQuestionPublish(question.id, !question.is_published);
      setFeedback({
        type: 'success',
        message: !question.is_published ? 'Soru yayinlandi.' : 'Soru taslak olarak isaretlendi.',
      });
      const refreshed = await fetchInstitutionQuestionSummary(institution.id);
      setSummary(refreshed);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Yayin durumu guncellenemedi.' });
    }
  };

  const toggleSelection = (questionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    );
  };

  const selectCurrentPage = () => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      questions.forEach((question) => set.add(question.id));
      return Array.from(set);
    });
  };

  const openCreateBlueprint = () => {
    if (!selectedIds.length) {
      setFeedback({ type: 'error', message: 'Taslak icin soru secin.' });
      return;
    }
    setBlueprintForm(emptyBlueprintForm());
    setBlueprintMode('create');
    setBlueprintModalOpen(true);
  };

  const openEditBlueprint = (blueprint: InstitutionExamBlueprint) => {
    setBlueprintForm({
      id: blueprint.id,
      name: blueprint.name,
      examType: blueprint.exam_type,
      description: blueprint.description ?? '',
      durationMinutes: blueprint.duration_minutes ?? '',
    });
    setSelectedIds(blueprint.question_ids ?? []);
    setBlueprintMode('edit');
    setBlueprintModalOpen(true);
  };

  const handleBlueprintSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!blueprintForm.name.trim()) {
      setFeedback({ type: 'error', message: 'Taslak adi bos olamaz.' });
      return;
    }
    if (!selectedIds.length) {
      setFeedback({ type: 'error', message: 'Taslaga soru ekleyin.' });
      return;
    }
    try {
      if (blueprintMode === 'create') {
        await createInstitutionExamBlueprint({
          institutionId: institution.id,
          createdBy: user.id,
          name: blueprintForm.name.trim(),
          examType: blueprintForm.examType.trim() || 'Ozel',
          description: blueprintForm.description.trim() || undefined,
          durationMinutes:
            typeof blueprintForm.durationMinutes === 'number' ? blueprintForm.durationMinutes : null,
          questionIds: selectedIds,
        });
        setFeedback({ type: 'success', message: 'Taslak olusturuldu.' });
      } else if (blueprintForm.id) {
        await updateInstitutionExamBlueprint({
          blueprintId: blueprintForm.id,
          name: blueprintForm.name.trim(),
          examType: blueprintForm.examType.trim() || 'Ozel',
          description: blueprintForm.description.trim() || undefined,
          durationMinutes:
            typeof blueprintForm.durationMinutes === 'number' ? blueprintForm.durationMinutes : null,
          questionIds: selectedIds,
        });
        setFeedback({ type: 'success', message: 'Taslak guncellendi.' });
      }
      const refreshed = await listInstitutionExamBlueprints(institution.id);
      setBlueprints(refreshed);
      setBlueprintModalOpen(false);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Taslak kaydedilemedi.' });
    }
  };

  const handleDeleteBlueprint = async (blueprint: InstitutionExamBlueprint) => {
    if (!window.confirm('Bu taslagi silmek istediginize emin misiniz?')) return;
    try {
      await deleteInstitutionExamBlueprint(blueprint.id);
      setFeedback({ type: 'success', message: 'Taslak silindi.' });
      const refreshed = await listInstitutionExamBlueprints(institution.id);
      setBlueprints(refreshed);
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Taslak silinemedi.' });
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleExportToPDF = async () => {
    if (selectedIds.length === 0) {
      setFeedback({ type: 'error', message: 'Lütfen en az bir soru seçin.' });
      return;
    }

    try {
      const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPos = margin;

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Soru Bankası', margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${institution.name} - ${new Date().toLocaleDateString('tr-TR')}`, margin, yPos);
      yPos += 10;

      // Questions
      for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];

        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }

        // Question number and metadata
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Soru ${i + 1}`, margin, yPos);
        yPos += 6;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Ders: ${q.subject} | Konu: ${q.topic || '-'} | Zorluk: ${q.difficulty}`, margin, yPos);
        yPos += 8;

        // Passage text if exists
        if (q.passage_text) {
          pdf.setFontSize(9);
          const passageLines = pdf.splitTextToSize(`Metin: ${q.passage_text}`, contentWidth);
          pdf.text(passageLines, margin, yPos);
          yPos += passageLines.length * 5 + 4;
        }

        // Question prompt
        if (q.question_prompt) {
          pdf.setFontSize(9);
          const promptLines = pdf.splitTextToSize(q.question_prompt, contentWidth);
          pdf.text(promptLines, margin, yPos);
          yPos += promptLines.length * 5 + 4;
        }

        // Question image if exists
        if (q.page_image_url) {
          try {
            // Check if we need a new page for image
            if (yPos > pageHeight - 100) {
              pdf.addPage();
              yPos = margin;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = q.page_image_url!;
            });

            const imgWidth = Math.min(contentWidth, 80);
            const imgHeight = (img.height / img.width) * imgWidth;

            pdf.addImage(img, 'PNG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 6;
          } catch (err) {
            console.error('Image load error:', err);
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('[Görsel yüklenemedi]', margin, yPos);
            yPos += 6;
            pdf.setTextColor(0, 0, 0);
          }
        }

        // Question text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        const questionLines = pdf.splitTextToSize(q.question_text, contentWidth);
        pdf.text(questionLines, margin, yPos);
        yPos += questionLines.length * 5 + 6;

        // Choices for multiple choice
        if (q.question_type === 'multiple_choice' && q.choices && q.choices.length > 0) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);

          for (const choice of q.choices) {
            const choiceText = `${choice.label}) ${choice.text}`;
            const choiceLines = pdf.splitTextToSize(choiceText, contentWidth - 5);
            pdf.text(choiceLines, margin + 5, yPos);
            yPos += choiceLines.length * 5 + 2;
          }
          yPos += 4;
        }

        // Answer key
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Cevap: ${q.answer_key || '-'}`, margin, yPos);
        yPos += 8;

        // Explanation if exists
        if (q.explanation) {
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(8);
          const expLines = pdf.splitTextToSize(`Açıklama: ${q.explanation}`, contentWidth);
          pdf.text(expLines, margin, yPos);
          yPos += expLines.length * 4 + 6;
        }

        // Separator
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      }

      // Save PDF
      const filename = `sorular_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      setFeedback({ type: 'success', message: `${selectedQuestions.length} soru PDF olarak indirildi.` });
    } catch (error) {
      console.error('PDF export error:', error);
      setFeedback({ type: 'error', message: 'PDF oluşturulurken hata oluştu.' });
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Soru bankasi</h2>
          <p className="text-sm text-gray-500">
            PDF'den sorularinizi yukleyip ders ve konulara gore duzenleyin, sinav taslaklarina donusturun.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleExportToPDF}
              className="inline-flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <FileDown className="h-4 w-4" />
              PDF İndir ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setPdfUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Upload className="h-4 w-4" />
            PDF'den Yükle
          </button>
          <button
            type="button"
            onClick={openCreateBlueprint}
            className="inline-flex items-center gap-2 rounded border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:border-blue-300 hover:text-blue-700"
          >
            <FilePlus className="h-4 w-4" />
            Taslak kaydet
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Toplam soru</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {summaryLoading ? '...' : summary.totalQuestions}
          </p>
        </div>
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Yayinda</p>
          <p className="mt-1 text-2xl font-semibold text-green-600">
            {summaryLoading ? '...' : summary.publishedQuestions}
          </p>
        </div>
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500">Taslak</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {summaryLoading ? '...' : summary.draftQuestions}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(event) => {
              setSubjectFilter(event.target.value);
              setTopicFilter('all');
              setPage(1);
            }}
            className="rounded border border-gray-200 px-2 py-1 text-sm"
          >
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'Tum dersler' : subject}
              </option>
            ))}
          </select>
          <select
            value={topicFilter}
            onChange={(event) => {
              setTopicFilter(event.target.value);
              setPage(1);
            }}
            className="rounded border border-gray-200 px-2 py-1 text-sm"
          >
            {topicOptions.map((topic) => (
              <option key={topic} value={topic}>
                {topic === 'all' ? 'Tum konular' : topic}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="rounded border border-gray-200 px-2 py-1 text-sm"
          >
            <option value="all">Tum durumlar</option>
            <option value="published">Yayinda</option>
            <option value="draft">Taslak</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border border-gray-200 px-2 py-1">
            <Search className="mr-2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Soru ara"
              className="w-40 text-sm outline-none"
            />
          </div>
          <button
            type="button"
            onClick={selectCurrentPage}
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800"
          >
            Sayfadaki hepsini sec
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="rounded border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800"
          >
            Secimi temizle
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-xs uppercase text-gray-500">
              <th className="px-4 py-2 text-left">Sec</th>
              <th className="px-4 py-2 text-left">Soru</th>
              <th className="px-4 py-2 text-left">Ders / Konu</th>
              <th className="px-4 py-2 text-left">Tip</th>
              <th className="px-4 py-2 text-left">Zorluk</th>
              <th className="px-4 py-2 text-left">Durum</th>
              <th className="px-4 py-2 text-right">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {questionLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Sorular yukleniyor...
                </td>
              </tr>
            ) : questions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Kayit bulunamadi. Filtreleri degistirin veya PDF'den soru yukleyin.
                </td>
              </tr>
            ) : (
              questions.map((question) => (
                <tr key={question.id} className="text-gray-700">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(question.id)}
                      onChange={() => toggleSelection(question.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {question.page_image_url ? (
                        <div className="flex-shrink-0">
                          <img
                            src={question.page_image_url ?? undefined}
                            alt={`Soru ${question.question_number || ''} görseli`}
                            className="h-16 w-16 rounded border border-gray-200 object-cover cursor-pointer hover:ring-2 hover:ring-blue-400"
                            onClick={() => window.open(question.page_image_url ?? undefined, '_blank')}
                            title="Görseli büyüt"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {question.question_prompt || question.question_text}
                        </p>
                        {question.passage_text && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {question.passage_text}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          {question.page_number && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <ImageIcon className="h-3 w-3" />
                              Sayfa {question.page_number}
                            </span>
                          )}
                          {question.tags?.length ? (
                            <p className="text-xs text-gray-500">#{question.tags.join(' #')}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{question.subject}</p>
                    <p className="text-xs text-gray-500">{question.topic}</p>
                  </td>
                  <td className="px-4 py-3">
                    {question.question_type === 'multiple_choice' ? 'Coktan secmeli' : 'Yazili'}
                  </td>
                  <td className="px-4 py-3">
                    {question.difficulty === 'easy'
                      ? 'Kolay'
                      : question.difficulty === 'medium'
                      ? 'Orta'
                      : 'Zor'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(question)}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs"
                    >
                      {question.is_published ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> Yayinda
                        </>
                      ) : (
                        <>
                          <Circle className="h-4 w-4 text-gray-400" /> Taslak
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditQuestion(question)}
                        className="rounded border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(question)}
                        className="rounded border border-red-200 p-2 text-red-500 hover:border-red-300 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          <span>
            Toplam {questionCount} kayit - Sayfa {page} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded border border-gray-200 px-3 py-1 disabled:opacity-50"
            >
              Onceki
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded border border-gray-200 px-3 py-1 disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      <section className="rounded border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Sinav taslaklari</h3>
          <span className="text-xs text-gray-500">{blueprints.length} kayit</span>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          Taslaklar, kurumunuzun paylasmak istedigi sinavlari once hazirlayip saklayabileceginiz alanlardir. Ogretmenler
          istedigi anda bu taslaklari siniflara atayabilir.
        </p>
        {blueprints.length === 0 ? (
          <p className="text-sm text-gray-500">
            Henuz taslak olusturmadiniz. Sorulari secip taslak kaydedebilirsiniz.
          </p>
        ) : (
          <ul className="space-y-3 text-sm text-gray-700">
            {blueprints.map((blueprint) => (
              <li
                key={blueprint.id}
                className="flex flex-col gap-2 rounded border border-gray-200 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{blueprint.name}</p>
                    <p className="text-xs text-gray-500">
                      {blueprint.exam_type} - {blueprint.question_count} soru
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIds(blueprint.question_ids ?? []);
                        setFeedback({ type: 'success', message: 'Sorular secili listeye eklendi.' });
                      }}
                      className="rounded border border-gray-200 px-3 py-1 text-xs hover:border-gray-300"
                    >
                      Sorulari sec
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditBlueprint(blueprint)}
                      className="rounded border border-gray-200 px-3 py-1 text-xs hover:border-gray-300"
                    >
                      Duzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlueprint(blueprint)}
                      className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:border-red-300"
                    >
                      Sil
                    </button>
                  </div>
                </div>
                {blueprint.description && (
                  <p className="text-xs text-gray-500">{blueprint.description}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-40 rounded border px-4 py-2 text-sm shadow ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <Modal
        open={questionModalOpen}
        title={questionMode === 'create' ? 'Yeni soru' : 'Soruyu duzenle'}
        onClose={() => setQuestionModalOpen(false)}
      >
        <form className="space-y-3" onSubmit={handleQuestionSubmit}>
          {/* Soru Görseli Önizlemesi */}
          {questionForm.page_image_url && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Soru Görseli {questionForm.page_number && `(Sayfa ${questionForm.page_number})`}
                  </p>
                  <img
                    src={questionForm.page_image_url ?? undefined}
                    alt="Soru görseli"
                    className="w-full rounded border border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-400"
                    onClick={() => window.open(questionForm.page_image_url ?? undefined, '_blank')}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Görseli büyütmek için tıklayın
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Ders
              <select
                value={questionForm.subject}
                onChange={(event) =>
                  setQuestionForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                className="rounded border border-gray-200 px-2 py-1"
              >
                {subjectOptions
                  .filter((subject) => subject !== 'all')
                  .map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Konu
              <input
                value={questionForm.topic}
                onChange={(event) =>
                  setQuestionForm((prev) => ({ ...prev, topic: event.target.value }))
                }
                className="rounded border border-gray-200 px-2 py-1"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Soru tipi
              <select
                value={questionForm.type}
                onChange={(event) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    type: event.target.value as QuestionFormState['type'],
                  }))
                }
                className="rounded border border-gray-200 px-2 py-1"
              >
                <option value="multiple_choice">Coktan secmeli</option>
                <option value="written">Yazili</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Zorluk
              <select
                value={questionForm.difficulty}
                onChange={(event) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    difficulty: event.target.value as InstitutionQuestionDifficulty,
                  }))
                }
                className="rounded border border-gray-200 px-2 py-1"
              >
                <option value="easy">Kolay</option>
                <option value="medium">Orta</option>
                <option value="hard">Zor</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Metin / Paragraf (opsiyonel)
            <textarea
              value={questionForm.passageText}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, passageText: event.target.value }))
              }
              rows={4}
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
              placeholder="Öğrencinin okuyacağı metni buraya yazın."
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Soru başlığı
            <input
              type="text"
              value={questionForm.questionPrompt}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, questionPrompt: event.target.value }))
              }
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
              placeholder="Soru cümlesini yazın"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Soru metni
            <textarea
              value={questionForm.text}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, text: event.target.value }))
              }
              rows={4}
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
              placeholder="Soruya ait detaylı açıklama veya seçenek öncesi metin"
            />
          </label>

          {questionForm.type === 'multiple_choice' ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">Secenekler</p>
              {questionForm.choices.map((choice, index) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={choice.isCorrect}
                    onChange={() =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        choices: prev.choices.map((c, idx) => ({ ...c, isCorrect: idx === index })),
                      }))
                    }
                  />
                  <input
                    value={choice.text}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        choices: prev.choices.map((c, idx) =>
                          idx === index ? { ...c, text: event.target.value } : c,
                        ),
                      }))
                    }
                    placeholder={`Secenek ${choice.label}`}
                    className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <label className="flex flex-col gap-1 text-sm">
              Cevap anahtari
              <textarea
                value={questionForm.answerKey}
                onChange={(event) =>
                  setQuestionForm((prev) => ({ ...prev, answerKey: event.target.value }))
                }
                rows={3}
                className="rounded border border-gray-200 px-2 py-1"
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            Aciklama (opsiyonel)
            <textarea
              value={questionForm.explanation}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, explanation: event.target.value }))
              }
              rows={3}
              className="rounded border border-gray-200 px-2 py-1"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Etiketler (virgulle ayirin)
            <input
              value={questionForm.tags}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, tags: event.target.value }))
              }
              className="rounded border border-gray-200 px-2 py-1"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={questionForm.published}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, published: event.target.checked }))
              }
            />
            Bu soru hemen sinavlarda kullanilabilsin
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuestionModalOpen(false)}
              className="rounded border border-gray-200 px-4 py-1 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Vazgec
            </button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-1 text-sm font-medium text-white hover:bg-blue-700">
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={blueprintModalOpen}
        title={blueprintMode === 'create' ? 'Yeni sinav taslagi' : 'Taslagi duzenle'}
        onClose={() => setBlueprintModalOpen(false)}
      >
        <form className="space-y-3" onSubmit={handleBlueprintSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Taslak adi
            <input
              value={blueprintForm.name}
              onChange={(event) =>
                setBlueprintForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded border border-gray-200 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sinav tipi
            <input
              value={blueprintForm.examType}
              onChange={(event) =>
                setBlueprintForm((prev) => ({ ...prev, examType: event.target.value }))
              }
              className="rounded border border-gray-200 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Sure (dakika)
            <input
              type="number"
              min={0}
              value={blueprintForm.durationMinutes}
              onChange={(event) =>
                setBlueprintForm((prev) => ({
                  ...prev,
                  durationMinutes: event.target.value ? Number(event.target.value) : '',
                }))
              }
              className="rounded border border-gray-200 px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Aciklama
            <textarea
              value={blueprintForm.description}
              onChange={(event) =>
                setBlueprintForm((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="rounded border border-gray-200 px-2 py-1"
            />
          </label>

          <p className="text-xs text-gray-500">
            Taslaga dahil edilecek soru sayisi: <strong>{selectedIds.length}</strong>
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBlueprintModalOpen(false)}
              className="rounded border border-gray-200 px-4 py-1 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-800"
            >
              Vazgec
            </button>
            <button type="submit" className="rounded bg-blue-600 px-4 py-1 text-sm font-medium text-white hover:bg-blue-700">
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={pdfUploadModalOpen}
        title="PDF'den Soru Yükle"
        onClose={() => setPdfUploadModalOpen(false)}
      >
        <InstitutionPDFQuestionUpload
          institutionId={institution.id}
          onSuccess={(insertedCount) => {
            setFeedback({
              type: 'success',
              message: `${insertedCount} soru başarıyla eklendi!`,
            });
            setPdfUploadModalOpen(false);
            // Trigger re-fetch by changing page or filter
            setPage(1);
          }}
          onClose={() => setPdfUploadModalOpen(false)}
        />
      </Modal>
    </section>
  );
}
