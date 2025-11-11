
import { useMemo, useState, type ComponentType } from 'react';
import { Building2, Users, FileSpreadsheet, ClipboardList, ShieldCheck, LogOut, Mail, CheckCircle2, Layers, Copy } from 'lucide-react';
import { InstitutionSession } from '../lib/institutionApi';
import InstitutionQuestionBankPanel from './InstitutionQuestionBankPanel';
import InstitutionStudentApprovalPanel from './InstitutionStudentApprovalPanel';
import InstitutionEngagementPanel from './InstitutionEngagementPanel';
import InstitutionTeacherManagementPanel from './InstitutionTeacherManagementPanel';

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
  type PanelKey = 'overview' | 'question-bank' | 'teachers' | 'students' | 'engagement';
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
        key: 'question-bank',
        label: 'Soru Bankası',
        description: 'Sorular ve sınav taslakları',
        icon: ClipboardList,
        visible: canAccessQuestionBank,
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
        label: 'Öğrenciler',
        description: 'Başvurular ve kodlar',
        icon: Layers,
        visible: canManageInstitution,
      },
      {
        key: 'engagement',
        label: 'Etkileşim',
        description: 'Performans ve duyurular',
        icon: Mail,
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

  const quickActions = canManageInstitution
    ? [
        {
          key: 'question-bank',
          icon: ClipboardList,
          title: 'Soru Bankası',
          description: 'Kendi sorularınızı kaydedin, ders ve zorluk seviyesine göre etiketleyin.',
        },
        {
          key: 'exam-builder',
          icon: FileSpreadsheet,
          title: 'Sınav Oluştur',
          description: 'Test, yazılı veya deneme sınavları hazırlayın ve sınıflara atayın.',
        },
        {
          key: 'team',
          icon: Users,
          title: 'Ekip & Roller',
          description: 'Öğretmenleri kurumunuza ekleyin ve yetkilerini yönetin.',
        },
      ]
    : [
        {
          key: 'question-bank',
          icon: ClipboardList,
          title: 'Soru Bankası',
          description: 'Yeni sorular ekleyin, yayımlayın ve mevcutları düzenleyin.',
        },
        {
          key: 'exam-builder',
          icon: FileSpreadsheet,
          title: 'Sınav Taslakları',
          description: 'Size atanan sınavları hazırlayıp öğrencilere açın.',
        },
      ];

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
                        <p className="text-xs text-blue-800">{session.institution.contact_phone || 'Telefon bilgisi ekleyin'}</p>
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

              <section className="grid gap-6 lg:grid-cols-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.key}
                      type="button"
                      disabled={!isActive}
                      className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-disabled:bg-gray-200 group-disabled:text-gray-400">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-disabled:text-gray-500">{action.title}</p>
                        <p className="mt-1 text-xs text-gray-600 group-disabled:text-gray-400">{action.description}</p>
                      </div>
                      {!isActive && (
                        <span className="mt-auto inline-flex w-max items-center justify-center rounded-full bg-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                          Onay sonrasında açılacak
                        </span>
                      )}
                    </button>
                  );
                })}
              </section>

              {canManageInstitution && (
                <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">Kurum özetiniz</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Öğrenci</p>
                        <p className="mt-2 text-xl font-semibold text-gray-900">Yakında</p>
                        <p className="mt-1 text-xs text-gray-500">Öğrencileri sınıflara göre yönetin ve ilerlemelerini izleyin.</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Öğretmen</p>
                        <p className="mt-2 text-xl font-semibold text-gray-900">Yakında</p>
                        <p className="mt-1 text-xs text-gray-500">Yetki atayın, soru yazma görevleri oluşturun.</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Sınav</p>
                        <p className="mt-2 text-xl font-semibold text-gray-900">Yakında</p>
                        <p className="mt-1 text-xs text-gray-500">Deneme, quiz ve yazılı sınav sonuçlarını tek panelde takip edin.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-3 text-lg font-semibold text-gray-900">Yaklaşan modüller</h2>
                    <div className="space-y-4 text-sm text-gray-600">
                      <div className="flex items-start gap-3">
                        <Layers className="mt-0.5 h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-800">Soru bankası kategorileri</p>
                          <p className="text-xs text-gray-500">Ders, konu ve kazanım bazlı soru arşivi ile gelişmiş filtreleme.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-800">Velilere sonuç paylaşımı</p>
                          <p className="text-xs text-gray-500">Veli paneliyle sınav sonuçlarını güvenle iletin.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Building2 className="mt-0.5 h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-800">Kampüs içi duyurular</p>
                          <p className="text-xs text-gray-500">Kurum içi haber akışı ile öğretmen ve öğrencileri bilgilendirin.</p>
                        </div>
                      </div>
                    </div>
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

          {resolvedPanel === 'question-bank' &&
            (canAccessQuestionBank ? (
              <InstitutionQuestionBankPanel session={session} />
            ) : (
              renderPanelMessage('Soru bankasına erişim için kurum yönetici rolü gerekir.')
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
        </main>
      </div>
    </div>
  );

}
