import { useEffect, useMemo, useState } from 'react';
import { Users, Trash2, Copy, RefreshCw, Loader2, Mail, CalendarClock, NotebookPen, CheckCircle2 } from 'lucide-react';
import {
  approveInstitutionTeacherRequest,
  createInstitutionTeacherTask,
  deleteInstitutionTeacherTask,
  listInstitutionTeacherInvites,
  listInstitutionTeacherRequests,
  listInstitutionTeacherTasks,
  listInstitutionTeachers,
  rejectInstitutionTeacherRequest,
  removeInstitutionTeacher,
  revokeInstitutionTeacherInvite,
  updateInstitutionTeacherTaskStatus,
  type InstitutionTeacherInvite,
  type InstitutionTeacherMember,
  type InstitutionTeacherRequest,
  type InstitutionTeacherTask,
  type InstitutionTeacherTaskStatus,
} from '../lib/institutionApi';

interface InstitutionTeacherManagementPanelProps {
  institutionId: string;
  userId: string;
}

const inviteLinkBase = typeof window !== 'undefined' ? window.location.origin : 'https://basariyolum.com';
const TASK_STATUS_LABELS: Record<InstitutionTeacherTaskStatus, string> = {
  pending: 'Bekliyor',
  in_progress: 'Devam ediyor',
  completed: 'Tamamlandı',
};

export default function InstitutionTeacherManagementPanel({
  institutionId,
  userId,
}: InstitutionTeacherManagementPanelProps) {
  const [teachers, setTeachers] = useState<InstitutionTeacherMember[]>([]);
  const [invites, setInvites] = useState<InstitutionTeacherInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<InstitutionTeacherTask[]>([]);
  const [requests, setRequests] = useState<InstitutionTeacherRequest[]>([]);
  const [taskForm, setTaskForm] = useState<{ teacherUserId: string; title: string; description: string; dueDate: string }>(
    { teacherUserId: '', title: '', description: '', dueDate: '' },
  );
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      teacherCount: teachers.length,
      pendingInvites: invites.filter((invite) => invite.status === 'pending').length,
    }),
    [teachers, invites],
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teacherRows, inviteRows, taskRows, requestRows] = await Promise.all([
        listInstitutionTeachers(institutionId),
        listInstitutionTeacherInvites(institutionId),
        listInstitutionTeacherTasks(institutionId),
        listInstitutionTeacherRequests(institutionId),
      ]);
      setTeachers(teacherRows);
      setInvites(inviteRows);
      setTasks(taskRows);
      setRequests(requestRows);
      if (!taskForm.teacherUserId && teacherRows.length) {
        setTaskForm((prev) => ({ ...prev, teacherUserId: teacherRows[0].user_id }));
      }
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] load error', err);
      setError(err?.message ?? 'Öğretmen verileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [institutionId]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        label: teacher.profile?.full_name || teacher.profile?.email || 'İsimsiz öğretmen',
        value: teacher.user_id,
      })),
    [teachers],
  );

  const teacherNameMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((teacher) => {
      map.set(teacher.user_id, teacher.profile?.full_name || teacher.profile?.email || 'Öğretmen');
    });
    return map;
  }, [teachers]);

  const pendingRequests = useMemo(() => requests.filter((request) => request.status === 'pending'), [requests]);
  const resolvedRequests = useMemo(() => requests.filter((request) => request.status !== 'pending'), [requests]);

  const handleRemoveTeacher = async (memberId: string) => {
    if (!window.confirm('Öğretmeni kurmdan kaldırmak istediğinize emin misiniz?')) {
      return;
    }
    try {
      await removeInstitutionTeacher(memberId);
      setTeachers((prev) => prev.filter((teacher) => teacher.id !== memberId));
      showMessage('Öğretmen kurumdan kaldırıldı.');
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] remove error', err);
      setError(err?.message ?? 'Öğretmen silinemedi.');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!window.confirm('Davet kodunu iptal etmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await revokeInstitutionTeacherInvite(inviteId);
      setInvites((prev) => prev.filter((invite) => invite.id !== inviteId));
      showMessage('Davet iptal edildi.');
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] revoke error', err);
      setError(err?.message ?? 'Davet iptal edilemedi.');
    }
  };

  const handleCopyInvite = async (invite: InstitutionTeacherInvite) => {
    const inviteUrl = `${inviteLinkBase}/ogretmen/davet?code=${invite.invite_code}`;
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard');
      }
      await navigator.clipboard.writeText(inviteUrl);
      showMessage('Davet bağlantısı panoya kopyalandı.');
    } catch {
      setError('Kopyalama başarısız oldu.');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setRequestActionId(requestId);
    try {
      await approveInstitutionTeacherRequest(requestId);
      showMessage('Öğretmen başvurusu onaylandı.');
      await loadData();
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] approve request error', err);
      setError(err?.message ?? 'Başvuru onaylanamadı.');
    } finally {
      setRequestActionId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = window.prompt('Reddetme nedeni (opsiyonel):') ?? undefined;
    setRequestActionId(requestId);
    try {
      await rejectInstitutionTeacherRequest(requestId, reason);
      showMessage('Başvuru reddedildi.');
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? { ...request, status: 'rejected', rejection_reason: reason ?? 'Reddedildi' }
            : request,
        ),
      );
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] reject request error', err);
      setError(err?.message ?? 'Başvuru reddedilemedi.');
    } finally {
      setRequestActionId(null);
    }
  };

  const handleTaskSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskForm.teacherUserId) {
      setError('Lütfen görev atamak için bir öğretmen seçin.');
      return;
    }
    if (!taskForm.title.trim()) {
      setError('Görev başlığını boş bırakmayın.');
      return;
    }
    setTaskSubmitting(true);
    setError(null);
    try {
      const task = await createInstitutionTeacherTask(institutionId, userId, {
        teacherUserId: taskForm.teacherUserId,
        title: taskForm.title,
        description: taskForm.description,
        dueDate: taskForm.dueDate || undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setTaskForm((prev) => ({ ...prev, title: '', description: '', dueDate: '' }));
      showMessage('Görev öğretmene atandı.');
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] task create error', err);
      setError(err?.message ?? 'Görev atanamadı.');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: InstitutionTeacherTaskStatus) => {
    try {
      const updated = await updateInstitutionTeacherTaskStatus(taskId, status);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      showMessage('Görev durumu güncellendi.');
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] task status error', err);
      setError(err?.message ?? 'Görev güncellenemedi.');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm('Görevi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteInstitutionTeacherTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      showMessage('Görev silindi.');
    } catch (err: any) {
      console.error('[InstitutionTeacherManagementPanel] task delete error', err);
      setError(err?.message ?? 'Görev silinemedi.');
    }
  };

  return (
    <section className="space-y-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Öğretmen yönetimi</p>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Kuruma bağlı öğretmenler</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Öğretmen davetlerini yönetin, mevcut kadroyu görüntüleyin ve gerekirse erişimi kaldırın.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Yenile
        </button>
      </header>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Aktif öğretmen</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {stats.teacherCount}
            <Users className="h-5 w-5 text-gray-400" />
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400">Bekleyen davet</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {stats.pendingInvites}
            <Mail className="h-5 w-5 text-gray-400" />
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Öğretmen başvuruları</p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Onay bekleyen öğretmenler</h3>
          </div>
          <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Bekleyen {pendingRequests.length} · Toplam {requests.length}
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            Bekleyen öğretmen başvurusu bulunmuyor.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{request.full_name || 'İsimsiz öğretmen'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{request.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Başvuru: {new Date(request.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveRequest(request.id)}
                      disabled={requestActionId === request.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200"
                    >
                      {requestActionId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={requestActionId === request.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-300 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {resolvedRequests.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <p className="mb-3 text-xs uppercase text-gray-500 dark:text-gray-400">Sonuçlanan başvurular</p>
            <div className="space-y-2">
              {resolvedRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {request.full_name || request.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {request.status === 'approved'
                        ? `Onaylandı: ${request.approved_at ? new Date(request.approved_at).toLocaleDateString('tr-TR') : '-'}`
                        : `Reddedildi${request.rejection_reason ? ` · ${request.rejection_reason}` : ''}`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      request.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
                    }`}
                  >
                    {request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Öğretmen görevleri</h3>
          <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Toplam {tasks.length}
          </span>
        </div>

        <div className="rounded-2xl border border-dashed border-gray-200 p-4 dark:border-gray-700">
          {teacherOptions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Görev atamak için önce öğretmen ekleyin veya davet gönderin.
            </p>
          ) : (
            <form className="grid gap-4 md:grid-cols-[1.2fr,1fr] lg:grid-cols-[1fr,1fr,0.6fr]" onSubmit={handleTaskSubmit}>
              <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
                Öğretmen
                <select
                  value={taskForm.teacherUserId}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      teacherUserId: event.target.value,
                    }))
                  }
                  className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  {teacherOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
                Görev başlığı
                <input
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Örn. Matematik deneme seti hazırla"
                />
              </label>
              <label className="flex flex-col text-sm text-gray-700 dark:text-gray-200">
                Bitiş tarihi
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </label>
              <label className="md:col-span-3 flex flex-col text-sm text-gray-700 dark:text-gray-200">
                Açıklama
                <textarea
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="mt-1 min-h-[80px] rounded-lg border border-gray-200 px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Detaylar, beklenen çıktı, paylaşılacak kaynaklar..."
                />
              </label>
              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                >
                  {taskSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <NotebookPen className="h-4 w-4" />}
                  Görevi ata
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {teacherNameMap.get(task.teacher_user_id) ?? 'Öğretmen'} ·{' '}
                    {task.due_date ? `Bitiş: ${new Date(task.due_date).toLocaleDateString('tr-TR')}` : 'Tarih belirtilmedi'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(event) =>
                      handleTaskStatusChange(task.id, event.target.value as InstitutionTeacherTaskStatus)
                    }
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleTaskDelete(task.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-400 dark:border-gray-700 dark:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Sil
                  </button>
                </div>
              </div>
              {task.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{task.description}</p>}
            </div>
          ))}
          {!tasks.length && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
              Henüz görev atanmadı.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aktif öğretmenler</h3>
          <span className="text-xs uppercase text-gray-500 dark:text-gray-400">Toplam {teachers.length}</span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/40">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">İsim</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">E-posta</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">Telefon</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {teacher.profile?.full_name ?? 'İsimsiz öğretmen'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{teacher.profile?.email ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{teacher.profile?.phone ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveTeacher(teacher.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-400 dark:border-gray-700 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Kaldır
                    </button>
                  </td>
                </tr>
              ))}
              {!teachers.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">
                    Henüz bağlı öğretmen yok. Davet göndererek ekleyebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Davetler</h3>
          <span className="text-xs uppercase text-gray-500 dark:text-gray-400">Toplam {invites.length}</span>
        </div>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{invite.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{invite.full_name ?? 'İsim belirtilmedi'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyInvite(invite)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 dark:border-gray-700 dark:text-gray-200"
                  >
                    <Copy className="h-4 w-4" />
                    Davet linki
                  </button>
                  {invite.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-400 dark:border-gray-700 dark:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      İptal et
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1">
                  Kod:
                  <code className="rounded bg-white px-2 py-0.5 text-xs text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                    {invite.invite_code}
                  </code>
                </span>
                {invite.expires_at && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {`Son geçerlilik: ${new Date(invite.expires_at).toLocaleDateString('tr-TR')}`}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    invite.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : invite.status === 'pending'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {invite.status === 'accepted'
                    ? 'Kabul edildi'
                    : invite.status === 'pending'
                      ? 'Bekliyor'
                      : 'İptal'}
                </span>
              </div>
            </div>
          ))}
          {!invites.length && (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
              Şu anda aktif davet bulunmuyor.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
