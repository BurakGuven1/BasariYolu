import React, { useState, useEffect, useMemo, type ComponentType } from 'react';
import { Users, Plus, BookOpen, Settings, LogOut, Copy, Eye, EyeOff, CreditCard as Edit, Building2, School, RefreshCw, Calendar, BarChart3, Home } from 'lucide-react';
import { getTeacherClasses, createClass, getClassData } from '../lib/teacherApi';
import { PACKAGE_OPTIONS, calculateClassPrice } from '../types/teacher';
import ClassManagementPanel from './ClassManagementPanel';
import { sendAnnouncementNotification } from '../lib/notificationApi';
import { supabase } from '../lib/supabase';
import InstitutionQuestionBankPanel from './InstitutionQuestionBankPanel';
import InstitutionStudentExamPanel from './InstitutionStudentExamPanel';
import TeacherScheduleView from './TeacherScheduleView';
import {
  acceptInstitutionTeacherInvite,
  listTeacherInstitutionRequests,
  listTeacherInstitutionTasks,
  listTeacherInstitutions,
  updateInstitutionTeacherTaskStatus,
  type InstitutionSession,
  type InstitutionTeacherRequest,
  type InstitutionTeacherTask,
  type InstitutionTeacherTaskStatus,
  type TeacherInstitutionMembership,
} from '../lib/institutionApi';

interface TeacherDashboardProps {
  teacherUser?: any;
  onLogout?: () => Promise<void> | void;
}

export default function TeacherDashboard({ teacherUser, onLogout }: TeacherDashboardProps) {
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showManagement, setShowManagement] = useState(false);
  const [classDetails, setClassDetails] = useState<any>({});
  const [classFormData, setClassFormData] = useState({
    class_name: '',
    description: '',
    student_capacity: 30,
    package_type: '9_months' as 'monthly' | '3_months' | '9_months'
  });
  const [createLoading, setCreateLoading] = useState(false);

  type PanelKey = 'overview' | 'classes' | 'institutions';
  const [activePanel, setActivePanel] = useState<PanelKey>('overview');
  const [institutionMemberships, setInstitutionMemberships] = useState<TeacherInstitutionMembership[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [urlInviteProcessed, setUrlInviteProcessed] = useState(false);
  const [initialInviteCode, setInitialInviteCode] = useState<string | null>(null);
  const [institutionTasks, setInstitutionTasks] = useState<InstitutionTeacherTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [teacherRequests, setTeacherRequests] = useState<InstitutionTeacherRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    if (teacherUser) {
      setTeacher(teacherUser);
      loadClasses(teacherUser.id);
      loadTeacherInstitutions(teacherUser.id);
      loadTeacherRequests(teacherUser.id);
    } else {
      console.log('TeacherDashboard - no teacherUser provided');
      setLoading(false);
    }
  }, [teacherUser]);

  useEffect(() => {
    if (!teacher || urlInviteProcessed) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get('teacher_invite') || params.get('teacherInvite');
    if (code) {
      setInitialInviteCode(code);
      params.delete('teacher_invite');
      params.delete('teacherInvite');
      const query = params.toString();
      const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', next);
    }
    setUrlInviteProcessed(true);
  }, [teacher, urlInviteProcessed]);

useEffect(() => {
  if (!teacher || !initialInviteCode) {
    return;
  }
  joinInstitutionByCode(initialInviteCode);
  setInitialInviteCode(null);
}, [teacher, initialInviteCode]);

useEffect(() => {
  if (teacher && selectedMembershipId) {
    const membership = institutionMemberships.find((item) => item.id === selectedMembershipId);
    loadTeacherTasks(membership);
  } else {
    setInstitutionTasks([]);
  }
}, [teacher, selectedMembershipId, institutionMemberships]);

  const loadClasses = async (teacherId: string) => {
    try {
      const { data } = await getTeacherClasses(teacherId);
      const classesData = data || [];
      setClasses(classesData);
      
      // Load detailed data for each class
      const detailsPromises = classesData.map(async (cls: any) => {
        const { data: details } = await getClassData(cls.id);
        return { [cls.id]: details };
      });
      
      const detailsArray = await Promise.all(detailsPromises);
      const detailsObj = detailsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setClassDetails(detailsObj);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinInstitutionByCode = async (rawCode: string) => {
    if (!teacher) return;
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized) {
      setJoinError('Lütfen geçerli bir kurum kodu girin.');
      return;
    }

  setJoinLoading(true);
  setJoinError(null);
  setJoinMessage(null);
  try {
    await acceptInstitutionTeacherInvite(normalized);
    setJoinMessage('Başvurunuz alındı. Kurum onayı sonrası erişiminiz açılacak.');
    setJoinCode('');
    await loadTeacherRequests(teacher.id);
  } catch (error: any) {
      console.error('joinInstitutionByCode error:', error);
      setJoinError(error?.message ?? 'Kurum kodu doğrulanamadı.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleJoinSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    joinInstitutionByCode(joinCode);
  };

  const loadTeacherInstitutions = async (teacherId: string) => {
    setInstitutionsLoading(true);
    setInstitutionError(null);
    try {
      const memberships = await listTeacherInstitutions(teacherId);
      setInstitutionMemberships(memberships);
      setSelectedMembershipId((prev) => {
        if (prev && memberships.some((membership) => membership.id === prev)) {
          return prev;
        }
        return memberships[0]?.id ?? null;
      });
    } catch (error: any) {
      console.error('Error loading institutions:', error);
      setInstitutionError(error?.message ?? 'Kurum bilgileri alınamadı.');
    } finally {
      setInstitutionsLoading(false);
    }
  };

  const loadTeacherRequests = async (teacherId: string) => {
    setRequestsLoading(true);
    setRequestError(null);
    try {
      const rows = await listTeacherInstitutionRequests(teacherId);
      setTeacherRequests(rows);
      if (rows.some((request) => request.status === 'approved')) {
        await loadTeacherInstitutions(teacherId);
      }
    } catch (error: any) {
      console.error('Error loading teacher requests:', error);
      setRequestError(error?.message ?? 'Başvurular alınamadı.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadTeacherTasks = async (membership?: TeacherInstitutionMembership, overrideTeacherId?: string) => {
    const targetMembership = membership ?? selectedMembership;
    if (!teacher || !targetMembership) {
      setInstitutionTasks([]);
      return;
    }
    const teacherId = overrideTeacherId ?? teacher.id;
    setTasksLoading(true);
    setTaskError(null);
    try {
      const tasks = await listTeacherInstitutionTasks(targetMembership.institution.id, teacherId);
      setInstitutionTasks(tasks);
    } catch (error: any) {
      console.error('Error loading teacher tasks:', error);
      setTaskError(error?.message ?? 'Görevler yüklenemedi.');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (onLogout) {
      await onLogout();
      return;
    }

    localStorage.removeItem('teacherSession');
    window.location.href = '/';
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    
    // Check if teacher already has 2 classes
    if (classes.filter(cls => cls.status !== 'completed').length >= 2) {
      alert('Maksimum 2 aktif sınıf oluşturabilirsiniz');
      return;
    }

    setCreateLoading(true);
    try {
      await createClass({
        teacher_id: teacher.id,
        ...classFormData
      });
      
      alert('Sınıf başarıyla oluşturuldu!');
      setShowCreateClass(false);
      setClassFormData({
        class_name: '',
        description: '',
        student_capacity: 30,
        package_type: '9_months'
      });
      
      // Reload classes
      await loadClasses(teacher.id);
    } catch (error: any) {
      alert('Sınıf oluşturma hatası: ' + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      alert('Tarayıcı panoya erişimi desteklemiyor.');
      return;
    }
    navigator.clipboard.writeText(code);
    alert('Davet kodu kopyalandı!');
  };

  const handleTeacherTaskStatusChange = async (taskId: string, status: InstitutionTeacherTaskStatus) => {
    try {
      const updated = await updateInstitutionTeacherTaskStatus(taskId, status);
      setInstitutionTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (error: any) {
      console.error('Teacher task status update error:', error);
      alert(error?.message ?? 'Görev güncellenemedi.');
    }
  };

  const handleAnnouncementCreated = async (announcementId: string) => {
    const result = await sendAnnouncementNotification(announcementId);
    if (!result.success) {
      console.error('Failed to send announcement notification:', result.error);
      alert('Duyuru bildirimi gönderilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    }
  };
  
  const handleManageClass = (classData: any) => {
    // Pass the detailed class data with assignments, announcements, and exams
    const detailedClassData = {
      ...classData,
      ...classDetails[classData.id]
    };
    setSelectedClass(detailedClassData);
    setShowManagement(true);
  };

  // Panel configuration
  type PanelItem = {
    key: PanelKey;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    visible: boolean;
  };

  const showInstitutionTab = institutionMemberships.length > 0;

  const panelItems = useMemo<PanelItem[]>(
    () => [
      {
        key: 'overview',
        label: 'Genel Bakış',
        description: 'İstatistikler ve hızlı erişim',
        icon: Home,
        visible: true,
      },
      {
        key: 'classes',
        label: 'Sınıflarım',
        description: 'Kendi sınıflarınız ve öğrencileriniz',
        icon: BookOpen,
        visible: true,
      },
      {
        key: 'institutions',
        label: 'Kurumlarım',
        description: 'Bağlı olduğunuz kurumlar',
        icon: Building2,
        visible: showInstitutionTab,
      },
    ],
    [showInstitutionTab],
  );

  const visiblePanels = panelItems.filter((item) => item.visible);
  const resolvedPanel = visiblePanels.some((item) => item.key === activePanel)
    ? activePanel
    : visiblePanels[0]?.key ?? 'overview';
  const currentPanelMeta = visiblePanels.find((item) => item.key === resolvedPanel);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'pending_payment': return 'Ödeme Bekliyor';
      case 'payment_failed': return 'Ödeme Başarısız';
      case 'suspended': return 'Askıya Alındı';
      case 'completed': return 'Tamamlandı';
      default: return status;
    }
  };

  const selectedMembership = useMemo(
    () => institutionMemberships.find((membership) => membership.id === selectedMembershipId),
    [institutionMemberships, selectedMembershipId],
  );
  const teacherEmail = teacher?.email || teacher?.email_address || null;
  const derivedInstitutionSession: InstitutionSession | null = useMemo(() => {
    if (!selectedMembership || !selectedMembership.institution) {
      return null;
    }
    const institution = selectedMembership.institution;
    return {
      membershipId: selectedMembership.id,
      role: selectedMembership.role,
      institution: {
        id: institution.id,
        name: institution.name,
        logo_url: institution.logo_url,
        contact_email: institution.contact_email,
        contact_phone: institution.contact_phone,
        status: institution.status,
        is_active: institution.is_active,
        created_at: institution.created_at,
        student_invite_code: institution.student_invite_code ?? null,
        teacher_invite_code: institution.teacher_invite_code ?? null,
        student_quota: institution.student_quota ?? null,
        approved_student_count: institution.approved_student_count ?? null,
      },
      user: {
        id: teacher?.id ?? selectedMembership.user_id,
        email: teacherEmail,
      },
    };
  }, [selectedMembership, teacher?.id, teacherEmail]);
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  if (!loading && resolvedPanel === 'institutions') {
    if (institutionsLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Kurum verileri yükleniyor...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kurumlarım</h1>
              <p className="text-gray-600">
                Bağlı olduğunuz kurumların soru bankası ve sınav taslaklarını buradan yönetebilirsiniz.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActivePanel('classes')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-white"
              >
                Sınıflarıma dön
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Çıkış Yap</span>
              </button>
            </div>
          </div>

          {institutionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {institutionError}
            </div>
          )}

          {joinMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {joinMessage}
            </div>
          )}
          {joinError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {joinError}
            </div>
          )}

          {!showInstitutionTab && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Henüz bir kuruma bağlı değilsiniz</h2>
              <p className="text-sm text-gray-500">
                Kurum yöneticinizden davet aldıktan sonra bu alanda kurum panelleri görünecek.
              </p>
            </div>
          )}

          {showInstitutionTab && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {institutionMemberships.map((membership) => (
                  <button
                    key={membership.id}
                    type="button"
                    onClick={() => setSelectedMembershipId(membership.id)}
                    className={`flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition ${
                      selectedMembershipId === membership.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        {membership.institution.logo_url ? (
                          <img
                            src={membership.institution.logo_url}
                            alt={membership.institution.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <School className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{membership.institution.name}</p>
                        <p className="text-xs text-gray-500">
                          Rolünüz: {membership.role === 'teacher' ? 'Öğretmen' : membership.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          membership.institution.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {membership.institution.is_active ? 'Aktif' : 'Onay bekliyor'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {derivedInstitutionSession ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Seçili kurum</h2>
                    <p className="text-sm text-gray-500">
                      {derivedInstitutionSession.institution.name} ·{' '}
                      {derivedInstitutionSession.institution.contact_email || 'E-posta yok'}
                    </p>
                  </div>
                  <InstitutionQuestionBankPanel session={derivedInstitutionSession} />
                  <InstitutionStudentExamPanel
                    institutionId={derivedInstitutionSession.institution.id}
                    institutionName={derivedInstitutionSession.institution.name}
                    teacherUserId={teacher?.id ?? selectedMembership?.user_id ?? null}
                  />
                  <TeacherScheduleView
                    teacherId={teacher?.id ?? selectedMembership?.user_id ?? null}
                    institutionId={derivedInstitutionSession.institution.id}
                  />
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Görevlerim</p>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {derivedInstitutionSession.institution.name} · Kurumsal görevler
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => loadTeacherTasks(selectedMembership)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Yenile
                      </button>
                    </div>
                    {taskError && (
                      <p className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {taskError}
                      </p>
                    )}
                    {tasksLoading ? (
                      <p className="text-sm text-gray-500">Görevler yükleniyor...</p>
                    ) : institutionTasks.length === 0 ? (
                      <p className="text-sm text-gray-500">Bu kurum tarafından size atanmış görev bulunmuyor.</p>
                    ) : (
                      <div className="space-y-3">
                        {institutionTasks.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-900">{task.title}</p>
                                <p className="text-xs text-gray-500">
                                  {task.due_date
                                    ? `Bitiş: ${new Date(task.due_date).toLocaleDateString('tr-TR')}`
                                    : 'Bitiş tarihi yok'}
                                </p>
                              </div>
                              <select
                                value={task.status}
                                onChange={(event) =>
                                  handleTeacherTaskStatusChange(task.id, event.target.value as InstitutionTeacherTaskStatus)
                                }
                                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
                              >
                                <option value="pending">Bekliyor</option>
                                <option value="in_progress">Devam ediyor</option>
                                <option value="completed">Tamamlandı</option>
                              </select>
                            </div>
                            {task.description && (
                              <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                  Lütfen bir kurum seçin.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  
  if (showManagement && selectedClass) {
    return (
      <ClassManagementPanel
        classData={selectedClass}
        onBack={() => {
          setShowManagement(false);
          setSelectedClass(null);
        }}
        onRefresh={() => {
          loadClasses(teacher.id);
        }}
        onAnnouncementCreated={handleAnnouncementCreated}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-gray-100 bg-white/95 p-6 shadow-sm lg:flex">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Öğretmen</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">{teacher?.full_name || 'Panel'}</h2>
          {teacher?.school_name && (
            <p className="mt-2 text-xs text-gray-500">{teacher.school_name}</p>
          )}
        </div>
        <nav className="mt-8 space-y-2">
          {visiblePanels.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === resolvedPanel;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePanel(item.key)}
                className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  isActive ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4" />
                <div>
                  <p>{item.label}</p>
                  <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto pt-8">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Öğretmen Paneli</p>
              <h1 className="text-2xl font-semibold text-gray-900">{currentPanelMeta?.label ?? 'Panel'}</h1>
              <p className="text-sm text-gray-500">{currentPanelMeta?.description ?? ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100 lg:hidden"
              >
                <LogOut className="h-4 w-4" />
                Çıkış
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {visiblePanels.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === resolvedPanel;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePanel(item.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                    isActive ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-8">
          {resolvedPanel === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Toplam Sınıf</p>
                      <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Toplam Öğrenci</p>
                      <p className="text-2xl font-bold text-green-600">
                        {classes.reduce((sum, cls) => sum + (cls.current_students || 0), 0)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Aktif Sınıf</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {classes.filter(cls => cls.status === 'active').length}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Kurumlar</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {institutionMemberships.length}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {resolvedPanel === 'classes' && (
            <div className="space-y-6">
              {showInstitutionTab && (
                <div className="mb-8 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">Kurumsal görevleriniz var</p>
                    <p className="text-xs text-blue-700">
                      {institutionMemberships.length} kurumda öğretmen yetkisine sahipsiniz. Kurum panellerine geçerek soru
                      bankası ve sınav taslaklarını yönetebilirsiniz.
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePanel('institutions')}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Building2 className="h-4 w-4" />
                    Kurumlarım
                  </button>
                </div>
              )}

              <div className="mb-8 rounded-xl border border-purple-200 bg-white p-4 shadow-sm space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-purple-800">Kurum kodu ile katıl</h3>
                  <p className="text-sm text-purple-600">Kodla başvuru yaptığınızda kurum onayı sonrası erişiminiz açılır.</p>
                </div>
                <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleJoinSubmit}>
                  <label className="flex-1 text-sm font-medium text-gray-700">
                    Kurum kodu
                    <input
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="Örn. KRM12345"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-purple-400 focus:outline-none"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={joinLoading || !joinCode.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-purple-300"
                  >
                    {joinLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                    Koda katıl
                  </button>
                </form>
                {joinMessage && <p className="text-xs text-emerald-600">{joinMessage}</p>}
                {joinError && <p className="text-xs text-red-600">{joinError}</p>}
                {requestError && <p className="text-xs text-red-600">{requestError}</p>}
                {requestsLoading ? (
                  <p className="text-sm text-gray-500">Başvurularınız yükleniyor...</p>
                ) : teacherRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz kurum başvurunuz bulunmuyor.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {teacherRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{request.institution?.name ?? 'Kurum'}</p>
                          <p className="text-xs text-gray-500">
                            Başvuru: {new Date(request.created_at).toLocaleDateString('tr-TR')}
                          </p>
                          {request.status === 'rejected' && request.rejection_reason && (
                            <p className="text-xs text-red-600">Neden: {request.rejection_reason}</p>
                          )}
                        </div>
                        <span
                          className={`mt-1 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                            request.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : request.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {request.status === 'approved'
                            ? 'Onaylandı'
                            : request.status === 'pending'
                              ? 'Onay bekliyor'
                              : 'Reddedildi'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Classes */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
                  <h3 className="text-lg font-semibold">Sınıflarım</h3>
                  <button
                    onClick={() => setShowCreateClass(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Sınıf</span>
              </button>
            </div>
  
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz sınıf oluşturmadınız</h3>
                <p className="text-gray-600 mb-6">İlk sınıfınızı oluşturun ve öğrencilerinizi davet edin.</p>
                <button
                  onClick={() => setShowCreateClass(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  İlk Sınıfı Oluştur
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  (() => {
                    const details = classDetails[cls.id];
                    const assignments = details?.class_assignments || [];
                    const announcements = details?.class_announcements || [];
                    const exams = details?.class_exams || [];
                    
                    return (
                  <div key={cls.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{cls.class_name}</h4>
                        {cls.description && (
                          <p className="text-gray-600 text-sm mt-1">{cls.description}</p>
                        )}
                      </div>
                      
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(cls.status)}`}>
                        {getStatusText(cls.status)}
                      </span>
                    </div>
  
                    <div className="space-y-2 mb-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between text-sm">
                        <span>Öğrenci:</span>
                        <span className="font-medium">{cls.current_students || 0}/{cls.student_capacity}</span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between text-sm">
                        <span>Paket:</span>
                        <span className="font-medium">
                          {PACKAGE_OPTIONS.find(p => p.type === cls.package_type)?.name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between text-sm">
                        <span>Aylık Tutar:</span>
                        <span className="font-medium text-green-600">
                          {calculateClassPrice(cls.current_students || 0, cls.package_type).monthlyPrice.toLocaleString()}₺
                        </span>
                      </div>
                    </div>
  
                    {/* Class Content Summary */}
                    <div className="border-t pt-3 mb-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">{assignments.length}</div>
                          <div className="text-gray-600">Ödev</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-purple-600">{announcements.length}</div>
                          <div className="text-gray-600">Duyuru</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">{exams.length}</div>
                          <div className="text-gray-600">Sınav</div>
                        </div>
                      </div>
                    </div>
  
                    {/* Class Content Details */}
                    {(assignments.length > 0 || announcements.length > 0 || exams.length > 0) && (
                      <div className="border-t pt-3 mb-3 max-h-40 overflow-y-auto">
                        <div className="text-xs text-gray-600 mb-2">İçerikler:</div>
                        <div className="space-y-1">
                          {assignments.slice(0, 3).map((assignment: any) => (
                            <div key={assignment.id} className="text-xs bg-blue-50 p-2 rounded flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                              <div>
                                <div className="font-medium text-blue-800">📝 {assignment.title}</div>
                                <div className="text-blue-600">{assignment.subject} - {new Date(assignment.due_date).toLocaleDateString('tr-TR')}</div>
                              </div>
                            </div>
                          ))}
                          {announcements.slice(0, 2).map((announcement: any) => (
                            <div key={announcement.id} className="text-xs bg-purple-50 p-2 rounded">
                              <div className="font-medium text-purple-800">📢 {announcement.title}</div>
                              <div className="text-purple-600">{announcement.content.substring(0, 40)}...</div>
                            </div>
                          ))}
                          {exams.slice(0, 2).map((exam: any) => (
                            <div key={exam.id} className="text-xs bg-orange-50 p-2 rounded">
                              <div className="font-medium text-orange-800">🏆 {exam.exam_name}</div>
                              <div className="text-orange-600">{exam.exam_type} - {new Date(exam.exam_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Recent Activity */}
                    {(assignments.length > 0 || announcements.length > 0 || exams.length > 0) && (
                      <div className="border-t pt-3 mb-3">
                        <div className="text-xs text-gray-600 mb-2">Son Aktiviteler:</div>
                        <div className="space-y-1">
                          {assignments.slice(0, 2).map((assignment: any) => (
                            <div key={assignment.id} className="text-xs bg-blue-50 p-2 rounded">
                              <div className="font-medium text-blue-800">📝 {assignment.title}</div>
                              <div className="text-blue-600">Son teslim: {new Date(assignment.due_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                          ))}
                          {announcements.slice(0, 1).map((announcement: any) => (
                            <div key={announcement.id} className="text-xs bg-purple-50 p-2 rounded">
                              <div className="font-medium text-purple-800">📢 {announcement.title}</div>
                              <div className="text-purple-600">{announcement.content.substring(0, 50)}...</div>
                            </div>
                          ))}
                          {exams.slice(0, 1).map((exam: any) => (
                            <div key={exam.id} className="text-xs bg-orange-50 p-2 rounded">
                              <div className="font-medium text-orange-800">🏆 {exam.exam_name}</div>
                              <div className="text-orange-600">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
  
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Davet Kodu:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowInviteCode(showInviteCode === cls.id ? null : cls.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {showInviteCode === cls.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => copyInviteCode(cls.invite_code)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {showInviteCode === cls.id && (
                        <div className="mb-3 p-2 bg-gray-100 rounded font-mono text-sm text-center">
                          {cls.invite_code}
                        </div>
                      )}
                      <div className="border-t pt-4 mt-4">
                        <button
                          onClick={() => handleManageClass(cls)}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Sınıfı Yönet</span>
                        </button>
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
            </div>
          )}

          {resolvedPanel === 'institutions' && (
            <div>Kurumlar panel içeriği (mevcut kod buraya taşınacak)</div>
          )}
        </main>
      </div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Yeni Sınıf Oluştur</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sınıf Adı *
                </label>
                <input
                  type="text"
                  value={classFormData.class_name}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, class_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Örn: 12-A TYT Hazırlık"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={classFormData.description}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Sınıf hakkında kısa açıklama"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğrenci Kapasitesi: {classFormData.student_capacity}
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={classFormData.student_capacity}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, student_capacity: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between text-xs text-gray-500 mt-1">
                  <span>5 öğrenci</span>
                  <span>40 öğrenci</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paket Seçimi
                </label>
                <select
                  value={classFormData.package_type}
                  onChange={(e) => setClassFormData(prev => ({ ...prev, package_type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {PACKAGE_OPTIONS.map((pkg) => (
                    <option key={pkg.type} value={pkg.type}>
                      {pkg.name} - {pkg.price_per_student}₺/öğrenci/ay
                      {pkg.discount_percent > 0 && ` (%${pkg.discount_percent} indirim)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between mb-2">
                    <span className="font-medium text-blue-800">Sınıf Limiti:</span>
                    <span className="text-blue-700">
                      {classes.filter(cls => cls.status !== 'completed').length}/2 aktif sınıf
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <span>Aylık Toplam:</span>
                    <span className="font-semibold">
                      {calculateClassPrice(classFormData.student_capacity, classFormData.package_type).monthlyPrice.toLocaleString()}₺
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <span>Toplam Tutar:</span>
                    <span className="font-semibold text-green-600">
                      {calculateClassPrice(classFormData.student_capacity, classFormData.package_type).totalPrice.toLocaleString()}₺
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createLoading || classes.filter(cls => cls.status !== 'completed').length >= 2}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createLoading ? 'Oluşturuluyor...' : 
                   classes.filter(cls => cls.status !== 'completed').length >= 2 ? 'Limit Doldu' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
