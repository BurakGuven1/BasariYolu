import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Download, Loader2, Megaphone, NotebookPen, PieChart, RefreshCw, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import {
  createInstitutionAnnouncement,
  createInstitutionAssignment,
  deleteInstitutionAnnouncement,
  deleteInstitutionAssignment,
  fetchInstitutionStudentPerformance,
  InstitutionAnnouncementInput,
  InstitutionAnnouncementRecord,
  InstitutionAssignmentInput,
  InstitutionAssignmentRecord,
  InstitutionStudentPerformance,
  listInstitutionAnnouncements,
  listInstitutionAssignments,
  updateInstitutionAnnouncement,
  updateInstitutionAssignment,
} from '../lib/institutionApi';

interface InstitutionEngagementPanelProps {
  institutionId: string;
  userId: string;
}

type EngagementTab = 'performance' | 'announcements' | 'assignments';

const ANNOUNCEMENT_TYPES: Array<{ value: NonNullable<InstitutionAnnouncementInput['type']>; label: string }> = [
  { value: 'info', label: 'Bilgilendirme' },
  { value: 'success', label: 'Başarı' },
  { value: 'warning', label: 'Uyarı' },
  { value: 'urgent', label: 'Acil' },
];

const AUDIENCES: Array<{ value: NonNullable<InstitutionAnnouncementInput['audience']>; label: string }> = [
  { value: 'students', label: 'Öğrenciler' },
  { value: 'teachers', label: 'Öğretmenler' },
  { value: 'all', label: 'Tüm kurum' },
];

const ASSIGNMENT_STATUSES: Array<{ value: InstitutionAssignmentRecord['status']; label: string }> = [
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'archived', label: 'Arşiv' },
];

const toDateTimeLocalValue = (value?: string | null) => {
  const date = value ? new Date(value) : new Date();
  const pad = (input: number) => `${input}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
};

const toDateOnlyValue = (value?: string | null) => {
  if (!value) {
    const today = new Date();
    const pad = (input: number) => `${input}`.padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  }
  const date = new Date(value);
  const pad = (input: number) => `${input}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const defaultAnnouncementForm: InstitutionAnnouncementInput = {
  title: '',
  content: '',
  type: 'info',
  audience: 'students',
  publish_at: new Date().toISOString(),
};

const defaultAssignmentForm: InstitutionAssignmentInput = {
  title: '',
  description: '',
  subject: '',
  due_date: '',
  resources: [],
  status: 'active',
};

export default function InstitutionEngagementPanel({ institutionId, userId }: InstitutionEngagementPanelProps) {
  const [activeTab, setActiveTab] = useState<EngagementTab>('performance');
  const [announcements, setAnnouncements] = useState<InstitutionAnnouncementRecord[]>([]);
  const [assignments, setAssignments] = useState<InstitutionAssignmentRecord[]>([]);
  const [students, setStudents] = useState<InstitutionStudentPerformance[]>([]);
  const [announcementForm, setAnnouncementForm] = useState<InstitutionAnnouncementInput>(defaultAnnouncementForm);
  const [assignmentForm, setAssignmentForm] = useState<InstitutionAssignmentInput>(defaultAssignmentForm);
  const [announcementEditingId, setAnnouncementEditingId] = useState<string | null>(null);
  const [assignmentEditingId, setAssignmentEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [announcementRows, assignmentRows, performanceRows] = await Promise.all([
        listInstitutionAnnouncements(institutionId),
        listInstitutionAssignments(institutionId),
        fetchInstitutionStudentPerformance(institutionId),
      ]);
      setAnnouncements(announcementRows);
      setAssignments(assignmentRows);
      setStudents(performanceRows);
    } catch (err: any) {
      console.error('[InstitutionEngagementPanel] loadData', err);
      setError(err?.message ?? 'Veriler alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const performanceSummary = useMemo(() => {
    if (!students.length) {
      return { total: 0, avgScore: 0 };
    }
    const total = students.length;
    const avg = students.reduce((sum, student) => sum + student.averageScore, 0) / total;
    return {
      total,
      avgScore: Number(avg.toFixed(1)),
    };
  }, [students]);

  const formatDisplayDate = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('tr-TR', options ?? { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return value;
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      ...defaultAnnouncementForm,
      publish_at: new Date().toISOString(),
    });
    setAnnouncementEditingId(null);
  };

  const resetAssignmentForm = () => {
    setAssignmentForm(defaultAssignmentForm);
    setAssignmentEditingId(null);
  };

  const handleAnnouncementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      if (announcementEditingId) {
        await updateInstitutionAnnouncement(announcementEditingId, announcementForm);
        showMessage('Duyuru güncellendi.');
      } else {
        await createInstitutionAnnouncement(institutionId, userId, announcementForm);
        showMessage('Duyuru oluşturuldu.');
      }
      resetAnnouncementForm();
      await loadData();
    } catch (err: any) {
      console.error('[InstitutionEngagementPanel] announcementSubmit', err);
      setError(err?.message ?? 'Duyuru kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      const payload: InstitutionAssignmentInput = {
        ...assignmentForm,
        resources: (assignmentForm.resources ?? []).map((item) => ({
          label: item.label?.trim() ?? '',
          url: item.url?.trim() ?? '',
        })),
      };

      if (assignmentEditingId) {
        await updateInstitutionAssignment(assignmentEditingId, payload);
        showMessage('Ödev güncellendi.');
      } else {
        await createInstitutionAssignment(institutionId, userId, payload);
        showMessage('Ödev oluşturuldu.');
      }
      resetAssignmentForm();
      await loadData();
    } catch (err: any) {
      console.error('[InstitutionEngagementPanel] assignmentSubmit', err);
      setError(err?.message ?? 'Ödev kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementEdit = (record: InstitutionAnnouncementRecord) => {
    setActiveTab('announcements');
    setAnnouncementEditingId(record.id);
    setAnnouncementForm({
      title: record.title,
      content: record.content,
      type: record.type,
      audience: record.audience,
      publish_at: record.publish_at,
    });
  };

  const handleAssignmentEdit = (record: InstitutionAssignmentRecord) => {
    setActiveTab('assignments');
    setAssignmentEditingId(record.id);
    setAssignmentForm({
      title: record.title,
      description: record.description ?? '',
      subject: record.subject ?? '',
      due_date: record.due_date ?? '',
      resources: Array.isArray(record.resources) ? record.resources : [],
      status: record.status,
    });
  };

  const handleAnnouncementDelete = async (announcementId: string) => {
    if (!window.confirm('Duyuruyu silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      setLoading(true);
      await deleteInstitutionAnnouncement(announcementId);
      showMessage('Duyuru silindi.');
      await loadData();
    } catch (err: any) {
      console.error('[InstitutionEngagementPanel] announcementDelete', err);
      setError(err?.message ?? 'Duyuru silinemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentDelete = async (assignmentId: string) => {
    if (!window.confirm('Ödevi silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      setLoading(true);
      await deleteInstitutionAssignment(assignmentId);
      showMessage('Ödev silindi.');
      await loadData();
    } catch (err: any) {
      console.error('[InstitutionEngagementPanel] assignmentDelete', err);
      setError(err?.message ?? 'Ödev silinemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportStudentPdf = async (student: InstitutionStudentPerformance) => {
    setPdfGenerating(student.profile_id);
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Kurum Performans Raporu', 14, 20);
      doc.setFontSize(12);
      doc.text(`Öğrenci: ${student.full_name ?? 'Bilinmiyor'}`, 14, 32);
      doc.text(`E-posta: ${student.email ?? '-'}`, 14, 40);
      doc.text(`Telefon: ${student.phone ?? '-'}`, 14, 48);
      doc.text(
        `Katılım: ${student.joined_at ? new Date(student.joined_at).toLocaleDateString('tr-TR') : '-'}`,
        14,
        56,
      );
      doc.text(`Gözlenen sınav sayısı: ${student.examsTaken}`, 14, 64);
      doc.text(`Ortalama skor: %${student.averageScore}`, 14, 72);

      if (student.lastExam) {
        doc.text(
          `Son sınav: ${student.lastExam.name ?? '-'} (%${student.lastExam.score ?? 0}, ${
            student.lastExam.date ? new Date(student.lastExam.date).toLocaleDateString('tr-TR') : '-'
          })`,
          14,
          80,
        );
      }

      doc.text('Son sonuçlar', 14, 92);
      let y = 102;
      student.recentResults.forEach((result) => {
        doc.text(
          `• ${result.name ?? 'Bilinmeyen'} - %${result.score ?? 0} (${new Date(result.created_at).toLocaleDateString(
            'tr-TR',
          )})`,
          16,
          y,
        );
        y += 8;
      });

      doc.save(`kurum-raporu-${student.full_name ?? student.profile_id}.pdf`);
    } finally {
      setPdfGenerating(null);
    }
  };

  const handleResourceChange = (index: number, field: 'label' | 'url', value: string) => {
    setAssignmentForm((prev) => {
      const nextResources = [...(prev.resources ?? [])];
      nextResources[index] = { ...nextResources[index], [field]: value };
      return { ...prev, resources: nextResources };
    });
  };

  const addResourceRow = () => {
    setAssignmentForm((prev) => ({
      ...prev,
      resources: [...(prev.resources ?? []), { label: '', url: '' }],
    }));
  };

  const removeResourceRow = (index: number) => {
    setAssignmentForm((prev) => {
      const nextResources = [...(prev.resources ?? [])];
      nextResources.splice(index, 1);
      return { ...prev, resources: nextResources };
    });
  };

  const tabs: Array<{ key: EngagementTab; label: string; icon: LucideIcon }> = [
    { key: 'performance', label: 'Öğrenci performansı', icon: PieChart },
    { key: 'announcements', label: 'Duyurular', icon: Megaphone },
    { key: 'assignments', label: 'Ödevler', icon: NotebookPen },
  ];

  const renderPerformanceTab = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Öğrenci performansı</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Analiz ve raporlar</h3>
        </div>
        <div className="flex gap-4">
          <div className="rounded-xl border border-gray-200 px-4 py-2 text-center dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Aktif öğrenci</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{performanceSummary.total}</p>
          </div>
          <div className="rounded-xl border border-gray-200 px-4 py-2 text-center dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Ortalama skor</p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">%{performanceSummary.avgScore}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Öğrenci
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Sınav sayısı
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Ortalama
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Son sınav
              </th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {students.map((student) => (
              <tr key={student.profile_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{student.full_name ?? 'İsimsiz öğrenci'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{student.email ?? 'E-posta yok'}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{student.examsTaken}</td>
                <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  %{student.averageScore}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {student.lastExam ? (
                    <>
                      {student.lastExam.name ?? 'Sınav'}
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        (%{student.lastExam.score ?? 0},{' '}
                        {student.lastExam.date ? new Date(student.lastExam.date).toLocaleDateString('tr-TR') : '-'})
                      </span>
                    </>
                  ) : (
                    'Veri yok'
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleExportStudentPdf(student)}
                    disabled={pdfGenerating === student.profile_id}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                  >
                    {pdfGenerating === student.profile_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    PDF indir
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-300">
                  Henüz kurumunuza bağlı öğrenci performans verisi bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAnnouncementsTab = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Kurumsal duyurular</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">İletişim merkezi</h3>
        </div>
        <button
          type="button"
          onClick={resetAnnouncementForm}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
        >
          <RefreshCw className="h-4 w-4" />
          Yeni duyuru
        </button>
      </div>

      <form
        onSubmit={handleAnnouncementSubmit}
        className="mb-8 grid gap-4 rounded-2xl border border-dashed border-gray-200 p-4 dark:border-gray-700 md:grid-cols-2"
      >
        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Başlık
          <input
            value={announcementForm.title}
            onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Yayın tarihi
          <input
            type="datetime-local"
            value={toDateTimeLocalValue(announcementForm.publish_at)}
            onChange={(event) =>
              setAnnouncementForm((prev) => ({ ...prev, publish_at: new Date(event.target.value).toISOString() }))
            }
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Hedef kitle
          <select
            value={announcementForm.audience}
            onChange={(event) =>
              setAnnouncementForm((prev) => ({ ...prev, audience: event.target.value as typeof prev.audience }))
            }
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {AUDIENCES.map((audience) => (
              <option key={audience.value} value={audience.value}>
                {audience.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Ton
          <select
            value={announcementForm.type}
            onChange={(event) =>
              setAnnouncementForm((prev) => ({ ...prev, type: event.target.value as typeof prev.type }))
            }
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {ANNOUNCEMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2 flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Mesaj
          <textarea
            value={announcementForm.content}
            onChange={(event) => setAnnouncementForm((prev) => ({ ...prev, content: event.target.value }))}
            required
            className="mt-1 min-h-[120px] rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {announcementEditingId ? 'Duyuruyu güncelle' : 'Duyuru paylaş'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{announcement.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDisplayDate(announcement.publish_at, { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                  {AUDIENCES.find((aud) => aud.value === announcement.audience)?.label ?? 'Tüm kurum'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>{ANNOUNCEMENT_TYPES.find((type) => type.value === announcement.type)?.label ?? 'Bilgi'}</span>
                <button
                  type="button"
                  onClick={() => handleAnnouncementEdit(announcement)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleAnnouncementDelete(announcement.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-red-600 hover:border-red-500 dark:border-gray-700 dark:text-red-300"
                >
                  Sil
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">{announcement.content}</p>
          </div>
        ))}

        {announcements.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-300">Henüz bir duyuru paylaşılmadı.</p>
        )}
      </div>
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Ödev & çalışmalar</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Kurumsal çalışma planı</h3>
        </div>
        <button
          type="button"
          onClick={resetAssignmentForm}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
        >
          <RefreshCw className="h-4 w-4" />
          Yeni ödev
        </button>
      </div>

      <form
        onSubmit={handleAssignmentSubmit}
        className="mb-8 grid gap-4 rounded-2xl border border-dashed border-gray-200 p-4 dark:border-gray-700 md:grid-cols-2"
      >
        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Başlık
          <input
            value={assignmentForm.title}
            onChange={(event) => setAssignmentForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Bitiş tarihi
          <input
            type="date"
            value={assignmentForm.due_date ? toDateOnlyValue(assignmentForm.due_date) : ''}
            onChange={(event) => setAssignmentForm((prev) => ({ ...prev, due_date: event.target.value }))}
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Ders/Konu
          <input
            value={assignmentForm.subject ?? ''}
            onChange={(event) => setAssignmentForm((prev) => ({ ...prev, subject: event.target.value }))}
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Durum
          <select
            value={assignmentForm.status}
            onChange={(event) =>
              setAssignmentForm((prev) => ({ ...prev, status: event.target.value as typeof prev.status }))
            }
            className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {ASSIGNMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="md:col-span-2 flex flex-col text-sm text-gray-700 dark:text-gray-200">
          Açıklama
          <textarea
            value={assignmentForm.description ?? ''}
            onChange={(event) => setAssignmentForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 min-h-[120px] rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </label>

        <div className="md:col-span-2 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Kaynak bağlantıları</p>
          {(assignmentForm.resources ?? []).map((resource, index) => (
            <div key={`resource-${index}`} className="grid gap-3 sm:grid-cols-[1.5fr,1.5fr,auto]">
              <input
                value={resource.label ?? ''}
                onChange={(event) => handleResourceChange(index, 'label', event.target.value)}
                placeholder="Kaynak adı"
                className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <input
                value={resource.url ?? ''}
                onChange={(event) => handleResourceChange(index, 'url', event.target.value)}
                placeholder="https://..."
                className="rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => removeResourceRow(index)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-red-600 hover:border-red-400 dark:border-gray-700 dark:text-red-300"
              >
                Kaldır
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addResourceRow}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
          >
            Kaynak ekle
          </button>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {assignmentEditingId ? 'Ödevi güncelle' : 'Ödevi paylaş'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{assignment.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {assignment.subject || 'Genel'} ·{' '}
                  {assignment.due_date ? formatDisplayDate(assignment.due_date, { dateStyle: 'medium' }) : 'Tarih yok'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                <span>{ASSIGNMENT_STATUSES.find((status) => status.value === assignment.status)?.label ?? 'Aktif'}</span>
                <button
                  type="button"
                  onClick={() => handleAssignmentEdit(assignment)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignmentDelete(assignment.id)}
                  className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-red-600 hover:border-red-500 dark:border-gray-700 dark:text-red-300"
                >
                  Sil
                </button>
              </div>
            </div>
            {assignment.description && (
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">{assignment.description}</p>
            )}
            {Array.isArray(assignment.resources) && assignment.resources.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-blue-600 dark:text-blue-300">
                {assignment.resources.map((resource, index) => (
                  <li key={`${assignment.id}-resource-${index}`}>
                    {resource.url ? (
                      <a href={resource.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {resource.label || resource.url}
                      </a>
                    ) : (
                      resource.label
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {assignments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-300">Henüz bir ödev paylaşılmadı.</p>
        )}
      </div>
    </div>
  );

  return (
    <section className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Kurum etkileşimi</p>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Performans, duyuru ve ödevler</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Öğrencilerinizin sınav verilerini görün, yeni duyuru veya ödev yayınlayın.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Verileri yenile
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      )}

      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'announcements' && renderAnnouncementsTab()}
      {activeTab === 'assignments' && renderAssignmentsTab()}
    </section>
  );
}
