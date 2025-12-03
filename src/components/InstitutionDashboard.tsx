
import { useMemo, useState, type ComponentType } from 'react';
import { Building2, Users, FileSpreadsheet, ClipboardList, ShieldCheck, LogOut, Mail, CheckCircle2, Layers, Copy, Download, BarChart3, Calendar, Award, Upload, Phone, Check, X, UserCheck } from 'lucide-react';
import { InstitutionSession } from '../lib/institutionApi';
import InstitutionQuestionBankPanel from './InstitutionQuestionBankPanel';
import InstitutionStudentApprovalPanel from './InstitutionStudentApprovalPanel';
import InstitutionStudentListPanel from './InstitutionStudentListPanel';
import InstitutionEngagementPanel from './InstitutionEngagementPanel';
import InstitutionTeacherManagementPanel from './InstitutionTeacherManagementPanel';
import InstitutionAnalyticsPanel from './InstitutionAnalyticsPanel';
import InstitutionScheduleManagement from './InstitutionScheduleManagement';
import ClassPerformancePanel from './ClassPerformancePanel';
import InstitutionExternalExamPanel from './InstitutionExternalExamPanel';
import InstitutionParentsPanel from './InstitutionParentsPanel';
import InstitutionClassManagementPanel from './InstitutionClassManagementPanel';
import { exportStudentsToExcel, exportExamResultsToExcel } from '../lib/institutionExportUtils';
import { exportParentsToExcel } from '../lib/parentContactApi';

interface InstitutionDashboardProps {
  session: InstitutionSession;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function InstitutionDashboard({ session, onLogout, onRefresh }: InstitutionDashboardProps) {
  const [teacherCodeCopyMessage, setTeacherCodeCopyMessage] = useState<string | null>(null);
  const isActive = session.institution.is_active;
  const statusKey = isActive ? 'approved' : session.institution.status;
  const statusBadges: Record<
    string,
    {
      label: string;
      tone: string;
    }
  > = {
    pending: { label: 'Onay Bekliyor', tone: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Aktif', tone: 'bg-green-100 text-green-800' },
    rejected: { label: 'Reddedildi', tone: 'bg-red-100 text-red-700' },
  };
  const roleLabels: Record<string, string> = {
    owner: 'Kurucu Yönetici',
    manager: 'Yönetici',
    teacher: 'Öğretmen',
    staff: 'Personel',
  };

  const status = statusBadges[statusKey] ?? statusBadges.pending;
  const roleLabel = roleLabels[session.role] ?? session.role;
  const isTeacherRole = session.role === 'teacher';
  const canManageInstitution = ['owner', 'manager'].includes(session.role);
  const canAccessQuestionBank = canManageInstitution || isTeacherRole;
  type PanelKey = 'overview' | 'analytics' | 'performance' | 'external-exams' | 'question-bank' | 'schedule' | 'teachers' | 'students' | 'student-list' | 'engagement' | 'parents' | 'class-management';
  const [activePanel, setActivePanel] = useState<PanelKey>('overview');

  type PanelItem = {
    key: PanelKey;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    visible: boolean;
  };

  const panelItems = useMemo<PanelItem[]>(
    () => [
      {
        key: 'overview',
        label: 'Genel Bakış',
        description: 'Durum, davetler ve hızlı özet',
        icon: Building2,
        visible: true,
      },
      {
        key: 'analytics',
        label: 'Analitik Dashboard',
        description: 'Performans metrikleri ve analizler',
        icon: BarChart3,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'performance',
        label: 'Performans Raporları',
        description: 'Öğrenci ve sınıf performans analizi',
        icon: Award,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'external-exams',
        label: 'Fiziksel Sınav Sonuçları',
        description: 'Yayınevi denemeleri ve harici sınavlar',
        icon: Upload,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'question-bank',
        label: 'Soru Bankası',
        description: 'Sorular ve sınav taslakları',
        icon: ClipboardList,
        visible: canAccessQuestionBank,
      },
      {
        key: 'schedule',
        label: 'Ders Programı',
        description: 'Haftalık ders programı ve zaman çizelgesi',
        icon: Calendar,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'teachers',
        label: 'Öğretmenler',
        description: 'Üyeler ve roller',
        icon: Users,
        visible: canManageInstitution,
      },
      {
        key: 'students',
        label: 'Öğrenci Başvuruları',
        description: 'Başvuru onayları ve davet kodları',
        icon: Layers,
        visible: canManageInstitution,
      },
      {
        key: 'student-list',
        label: 'Öğrenci Listesi',
        description: 'Onaylı öğrenciler ve performans analizi',
        icon: Users,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'engagement',
        label: 'Etkileşim',
        description: 'Performans ve duyurular',
        icon: Mail,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'parents',
        label: 'Veli Yönetimi',
        description: 'Veli listesi ve iletişim bilgileri',
        icon: UserCheck,
        visible: canManageInstitution && isActive,
      },
      {
        key: 'class-management',
        label: 'Sınıf Öğrencileri',
        description: 'Öğrencileri sınıflara atama ve yönetim',
        icon: Users,
        visible: canManageInstitution && isActive,
      },
    ],
    [canAccessQuestionBank, canManageInstitution, isActive],
  );

  const visiblePanels = panelItems.filter((item) => item.visible);
  const resolvedPanel = visiblePanels.some((item) => item.key === activePanel)
    ? activePanel
    : visiblePanels[0]?.key ?? 'overview';
  const currentPanelMeta = visiblePanels.find((item) => item.key === resolvedPanel);

  const renderPanelMessage = (message: string) => (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
      {message}
    </div>
  );

  const handleCopyTeacherInviteCode = async () => {
    if (!session.institution.teacher_invite_code) {
      return;
    }
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      await navigator.clipboard.writeText(session.institution.teacher_invite_code);
      setTeacherCodeCopyMessage('Öğretmen davet kodu kopyalandı.');
    } catch {
      setTeacherCodeCopyMessage('Kod kopyalanamadı, lütfen tekrar deneyin.');
    } finally {
      setTimeout(() => setTeacherCodeCopyMessage(null), 2500);
    }
  };

  // Export handlers
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Phone editing
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(session.institution.contact_phone || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSaving, setPhoneSaving] = useState(false);

  const handleExportStudents = async () => {
    setExportLoading('students');
    setExportError(null);
    setExportSuccess(null);
    try {
      const result = await exportStudentsToExcel(session.institution.id, 'approved');
      setExportSuccess(`✓ ${result.filename} başarıyla indirildi!`);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Öğrenci listesi dışa aktarılırken bir hata oluştu.');
    } finally {
      setExportLoading(null);
      setTimeout(() => {
        setExportError(null);
        setExportSuccess(null);
      }, 5000);
    }
  };

  const handleExportExamResults = async () => {
    setExportLoading('exams');
    setExportError(null);
    setExportSuccess(null);
    try {
      const result = await exportExamResultsToExcel(session.institution.id);
      setExportSuccess(`✓ ${result.filename} başarıyla indirildi!`);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Sınav sonuçları dışa aktarılırken bir hata oluştu.');
    } finally {
      setExportLoading(null);
      setTimeout(() => {
        setExportError(null);
        setExportSuccess(null);
      }, 5000);
    }
  };

  const handleExportParents = async () => {
    setExportLoading('parents');
    setExportError(null);
    setExportSuccess(null);
    try {
      const result = await exportParentsToExcel(session.institution.id);
      setExportSuccess(`✓ ${result.filename} başarıyla indirildi!`);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Veli listesi dışa aktarılırken bir hata oluştu.');
    } finally {
      setExportLoading(null);
      setTimeout(() => {
        setExportError(null);
        setExportSuccess(null);
      }, 5000);
    }
  };

  const handleSavePhone = async () => {
    if (!phoneValue.trim()) {
      setPhoneError('Telefon numarası boş olamaz.');
      return;
    }

    setPhoneSaving(true);
    setPhoneError(null);

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase
        .from('institutions')
        .update({ contact_phone: phoneValue.trim() })
        .eq('id', session.institution.id);

      if (error) throw error;

      session.institution.contact_phone = phoneValue.trim();
      setEditingPhone(false);
    } catch (error) {
      console.error('Phone update error:', error);
      setPhoneError('Telefon numarası güncellenemedi.');
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleCancelPhoneEdit = () => {
    setPhoneValue(session.institution.contact_phone || '');
    setEditingPhone(false);
    setPhoneError(null);
  };

  let statusMessage = '';
  let statusHint = '';

  if (isActive) {
    statusMessage = 'Kurumunuz aktif durumda.';
    statusHint = 'Soru bankası oluşturabilir, sınav planlayabilir ve ekip üyelerinizi davet edebilirsiniz.';
  } else if (session.institution.status === 'rejected') {
    statusMessage = 'Başvurunuz için ek bilgi gerekli.';
    statusHint = 'Destek ekibimizle iletişime geçerek eksikleri tamamlayabilir ve yeniden değerlendirme isteyebilirsiniz.';
  } else {
    statusMessage = 'Başvurunuz inceleniyor.';
    statusHint = 'Onay sonrası tüm kurum özellikleri otomatik açılacak. Durumu aşağıdaki düğmeden yenileyebilirsiniz.';
  }

  const onboardingSteps = [
    {
      title: 'Başvurunuz alındı',
      description: 'Kurum bilgileri kaydedildi ve profiliniz oluşturuldu.',
      done: true,
    },
    {
      title: 'Yönetici incelemesi',
      description: 'Ekibimiz bilgilerinizi doğruluyor.',
      done: session.institution.status === 'approved' || isActive,
    },
    {
      title: 'Kurum özellikleri açıldı',
      description: 'Soru bankası ve sınav modülleri kullanımınıza sunuldu.',
      done: isActive,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-72 flex-col border-r border-gray-100 bg-white/95 p-6 shadow-sm lg:flex">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Rolünüz: {roleLabel}</p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">{session.institution.name}</h2>
          <span className={`mt-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
            {status.label}
          </span>
          <p className="mt-2 text-xs text-gray-500">{statusMessage}</p>
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
                  isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
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
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Kurum paneli</p>
              <h1 className="text-2xl font-semibold text-gray-900">{currentPanelMeta?.label ?? 'Panel'}</h1>
              <p className="text-sm text-gray-500">{currentPanelMeta?.description ?? ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-100"
              >
                <ShieldCheck className="h-4 w-4" />
                Durumu yenile
              </button>
              <button
                onClick={onLogout}
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
                    isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
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
              {!isTeacherRole && (
                <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-lg font-semibold text-gray-900">Hesap durumu</h2>
                    <p className="text-sm text-gray-600">{statusMessage}</p>
                    <p className="mt-2 text-xs text-gray-500">{statusHint}</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-blue-50 p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                          <Mail className="h-4 w-4" />
                          İletişim
                        </p>
                        <p className="mt-2 text-sm text-blue-900">{session.institution.contact_email || 'E-posta ekleyin'}</p>

                        {editingPhone ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-blue-600" />
                              <input
                                type="tel"
                                value={phoneValue}
                                onChange={(e) => setPhoneValue(e.target.value)}
                                placeholder="5XX XXX XX XX"
                                className="flex-1 rounded border border-blue-300 px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none"
                                disabled={phoneSaving}
                              />
                            </div>
                            {phoneError && (
                              <p className="text-xs text-red-600">{phoneError}</p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={handleSavePhone}
                                disabled={phoneSaving}
                                className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                <Check className="h-3 w-3" />
                                Kaydet
                              </button>
                              <button
                                onClick={handleCancelPhoneEdit}
                                disabled={phoneSaving}
                                className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                                İptal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingPhone(true)}
                            className="mt-1 flex items-center gap-1 text-xs text-blue-800 hover:text-blue-900 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {session.institution.contact_phone || 'Telefon bilgisi ekleyin'}
                          </button>
                        )}
                      </div>

                      <div className="rounded-xl bg-green-50 p-4">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Aktiflik
                        </p>
                        <p className="mt-2 text-sm text-green-900">{isActive ? 'Tüm kurum özellikleri açık.' : 'Onay bekleniyor.'}</p>
                        <p className="text-xs text-green-800">
                          {isActive
                            ? 'Soru bankası, sınav yönetimi ve ekip davetleri hazır.'
                            : 'Onaylandığında tüm modüller aktif olacak.'}
                        </p>
                      </div>
                    </div>

                    {!isActive && session.institution.status !== 'rejected' && (
                      <div className="mt-6 flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Durumu güncellediğinizde onay sonrası hemen erişim sağlanır.</span>
                        </div>
                        <button
                          onClick={onRefresh}
                          className="rounded-md border border-yellow-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide hover:bg-yellow-100"
                        >
                          Durumu yenile
                        </button>
                      </div>
                    )}

                    {session.institution.status === 'rejected' && (
                      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Başvurunuz şu anda pasif. Eksik belgeleri tamamlamak için destek ekibimizle iletişime geçin.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-2 text-lg font-semibold text-gray-900">Sonraki adımlar</h2>
                    <ol className="mt-4 space-y-4 text-sm text-gray-600">
                      {onboardingSteps.map((step) => (
                        <li key={step.title} className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                              step.done ? 'bg-green-600 text-white' : 'border border-gray-300 bg-white text-gray-500'
                            }`}
                          >
                            {step.done ? '✓' : ''}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">{step.title}</p>
                            <p className="text-xs text-gray-500">{step.description}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">
                      <p>
                        İhtiyacınız olduğunda destek ekibimiz{' '}
                        <a
                          href={`mailto:${session.institution.contact_email || 'destek@basariyolum.com'}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          destek@basariyolum.com
                        </a>{' '}
                        üzerinden yardımcı olur.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {isTeacherRole && (
                <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-sm text-blue-900">
                  <h2 className="text-lg font-semibold text-blue-900">Öğretmen paneline hoş geldiniz</h2>
                  <p className="mt-2">
                    Bu alanda kurumunuz için soru bankası oluşturabilir, sınav taslaklarını düzenleyebilir ve size atanan görevleri
                    takip edebilirsiniz. Yalnızca kurum yöneticilerinin görebildiği finans, öğrenci ve öğretmen yönetimi bölümleri size
                    gösterilmez.
                  </p>
                </section>
              )}

              {canManageInstitution && (
                <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2">
                      <FileSpreadsheet className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Raporlar</h2>
                      <p className="text-sm text-gray-600">Verilerinizi Excel formatında dışa aktarın</p>
                    </div>
                  </div>

                  {exportSuccess && (
                    <div className="mb-4 rounded-lg bg-green-100 border border-green-300 px-4 py-3 text-sm text-green-800">
                      {exportSuccess}
                    </div>
                  )}

                  {exportError && (
                    <div className="mb-4 rounded-lg bg-red-100 border border-red-300 px-4 py-3 text-sm text-red-800">
                      {exportError}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={handleExportStudents}
                      disabled={exportLoading === 'students'}
                      className="group flex flex-col items-start gap-3 rounded-xl border-2 border-emerald-200 bg-white p-4 text-left transition-all hover:border-emerald-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="rounded-lg bg-blue-100 p-2">
                          <Users className="h-5 w-5 text-blue-700" />
                        </div>
                        <Download className="h-5 w-5 text-gray-400 transition-transform group-hover:scale-110 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Öğrenci Listesi</p>
                        <p className="mt-1 text-xs text-gray-600">
                          {exportLoading === 'students' ? 'İndiriliyor...' : 'Onaylı öğrencilerin listesini Excel olarak indirin'}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={handleExportParents}
                      disabled={exportLoading === 'parents'}
                      className="group flex flex-col items-start gap-3 rounded-xl border-2 border-emerald-200 bg-white p-4 text-left transition-all hover:border-emerald-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="rounded-lg bg-purple-100 p-2">
                          <Phone className="h-5 w-5 text-purple-700" />
                        </div>
                        <Download className="h-5 w-5 text-gray-400 transition-transform group-hover:scale-110 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Veli Listesi</p>
                        <p className="mt-1 text-xs text-gray-600">
                          {exportLoading === 'parents' ? 'İndiriliyor...' : 'Tüm veli iletişim bilgilerini Excel olarak indirin'}
                        </p>
                      </div>
                    </button>
                  </div>
                </section>
              )}

              {canManageInstitution && session.institution.teacher_invite_code && (
                <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-blue-500">Öğretmen davet kodu</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{session.institution.teacher_invite_code}</p>
                      <p className="mt-2 text-sm text-gray-500">Bu kodu paylaşarak öğretmenlerinizi panele davet edebilirsiniz.</p>
                      {teacherCodeCopyMessage && (
                        <p className="mt-2 text-xs text-blue-600">{teacherCodeCopyMessage}</p>
                      )}
                    </div>
                    <button
                      onClick={handleCopyTeacherInviteCode}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                    >
                      <Copy className="h-4 w-4" />
                      Kodu kopyala
                    </button>
                  </div>
                </section>
              )}

              {canManageInstitution && session.institution.student_invite_code && (
                <section className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Öğrenci davet kodu</p>
                      <p className="mt-1 font-mono text-2xl font-bold text-gray-900">{session.institution.student_invite_code}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        Öğrenciler bu kodu Kurum/Öğrenci girişinden ad-soyad, telefon, e-posta ve şifre ile birlikte girerek kayıt
                        başvurusu yapar.
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              await navigator.clipboard.writeText(session.institution.student_invite_code || '');
                              alert('Davet kodu panoya kopyalandı.');
                            } else {
                              throw new Error('Clipboard API not available');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Kopyalama sırasında bir hata oluştu.');
                          }
                        }}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700"
                      >
                        Kodu kopyala
                      </button>
                      <p className="text-xs text-indigo-800">
                        Onaylı öğrenci: {session.institution.approved_student_count ?? 0}
                        {session.institution.student_quota && session.institution.student_quota > 0
                          ? ` / ${session.institution.student_quota}`
                          : ' (sınırsız paket)'}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {resolvedPanel === 'analytics' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionAnalyticsPanel institutionId={session.institution.id} />
              ) : (
                renderPanelMessage('Kurum onayı tamamlandığında analitik dashboard aktifleştirilecek.')
              )
            ) : (
              renderPanelMessage('Analitik dashboard yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'question-bank' &&
            (canAccessQuestionBank ? (
              <InstitutionQuestionBankPanel session={session} />
            ) : (
              renderPanelMessage('Soru bankasına erişim için kurum yönetici rolü gerekir.')
            ))}

          {resolvedPanel === 'schedule' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionScheduleManagement institutionId={session.institution.id} />
              ) : (
                renderPanelMessage('Ders programı yalnızca aktif kurumlar için kullanılabilir.')
              )
            ) : (
              renderPanelMessage('Ders programı yönetimi yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'teachers' &&
            (canManageInstitution ? (
              <InstitutionTeacherManagementPanel institutionId={session.institution.id} userId={session.user.id} />
            ) : (
              renderPanelMessage('Öğretmen yönetimi yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'students' &&
            (canManageInstitution ? (
              <InstitutionStudentApprovalPanel institutionId={session.institution.id} />
            ) : (
              renderPanelMessage('Öğrenci başvurularını yalnızca kurum yöneticileri görüntüleyebilir.')
            ))}

          {resolvedPanel === 'student-list' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionStudentListPanel institutionId={session.institution.id} />
              ) : (
                renderPanelMessage('Öğrenci listesi yalnızca aktif kurumlar için kullanılabilir.')
              )
            ) : (
              renderPanelMessage('Öğrenci listesi yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'performance' &&
            (canManageInstitution ? (
              isActive ? (
                <ClassPerformancePanel institutionId={session.institution.id} />
              ) : (
                renderPanelMessage('Kurum onayı tamamlandığında performans raporları aktifleştirilecek.')
              )
            ) : (
              renderPanelMessage('Performans raporları yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'external-exams' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionExternalExamPanel institutionId={session.institution.id} userId={session.user.id} />
              ) : (
                renderPanelMessage('Kurum onayı tamamlandığında harici sınav yüklemesi aktifleştirilecek.')
              )
            ) : (
              renderPanelMessage('Harici sınav yüklemesi yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'engagement' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionEngagementPanel institutionId={session.institution.id} userId={session.user.id} />
              ) : (
                renderPanelMessage('Kurum onayı tamamlandığında etkileşim verileri aktifleştirilecek.')
              )
            ) : (
              renderPanelMessage('Bu ekran yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'parents' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionParentsPanel institutionId={session.institution.id} />
              ) : (
                renderPanelMessage('Kurum onayı tamamlandığında veli yönetimi aktifleştirilecek.')
              )
            ) : (
              renderPanelMessage('Bu ekran yalnızca kurum yöneticilerine açıktır.')
            ))}

          {resolvedPanel === 'class-management' &&
            (canManageInstitution ? (
              isActive ? (
                <InstitutionClassManagementPanel institutionId={session.institution.id} />
              ) : (
                renderPanelMessage('Kurum onayı tamamlandığında sınıf yönetimi aktifleştirilecek.')
              )
            ) : (
              renderPanelMessage('Bu ekran yalnızca kurum yöneticilerine açıktır.')
            ))}
        </main>
      </div>
    </div>
  );

}
