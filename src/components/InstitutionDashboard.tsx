
import { Building2, Users, FileSpreadsheet, ClipboardList, ShieldCheck, LogOut, Mail, CheckCircle2, Layers } from 'lucide-react';
import { InstitutionSession } from '../lib/institutionApi';
import InstitutionQuestionBankPanel from './InstitutionQuestionBankPanel';
import InstitutionStudentApprovalPanel from './InstitutionStudentApprovalPanel';

interface InstitutionDashboardProps {
  session: InstitutionSession;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function InstitutionDashboard({ session, onLogout, onRefresh }: InstitutionDashboardProps) {
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

  const quickActions = [
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              {session.institution.logo_url ? (
                <img
                  src={session.institution.logo_url}
                  alt="Kurum Logosu"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <Building2 className="h-6 w-6 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{session.institution.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rolünüz: {roleLabel}</p>
            </div>
            <span className={`ml-3 rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
              {status.label}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <LogOut className="h-4 w-4" />
            Çıkış
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Hesap durumu</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{statusMessage}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{statusHint}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/15">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                  <Mail className="h-4 w-4" />
                  İletişim
                </p>
                <p className="mt-2 text-sm text-blue-900 dark:text-blue-100">
                  {session.institution.contact_email || 'E-posta ekleyin'}
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  {session.institution.contact_phone || 'Telefon bilgisi ekleyin'}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-900/15">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Aktiflik
                </p>
                <p className="mt-2 text-sm text-green-900 dark:text-green-100">
                  {isActive ? 'Tüm kurum özellikleri açık.' : 'Onay bekleniyor.'}
                </p>
                <p className="text-xs text-green-800 dark:text-green-200">
                  {isActive
                    ? 'Soru bankası, sınav yönetimi ve ekip davetleri hazır.'
                    : 'Onaylandığında tüm modüller aktif olacak.'}
                </p>
              </div>
            </div>

            {!isActive && session.institution.status !== 'rejected' && (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-xs text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Durumu güncellediğinizde onay sonrası hemen erişim sağlanır.</span>
                </div>
                <button
                  onClick={onRefresh}
                  className="rounded-md border border-yellow-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide hover:bg-yellow-100 dark:border-yellow-600 dark:hover:bg-yellow-800"
                >
                  Durumu yenile
                </button>
              </div>
            )}

            {session.institution.status === 'rejected' && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Başvurunuz şu anda pasif. Eksik belgeleri tamamlamak için destek ekibimizle iletişime geçin.</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Sonraki adımlar
            </h2>
            <ol className="mt-4 space-y-4 text-sm text-gray-600 dark:text-gray-300">
              {onboardingSteps.map((step) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                      step.done
                        ? 'bg-green-600 text-white'
                        : 'border border-gray-300 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                    }`}
                  >
                    {step.done ? '✓' : ''}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{step.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-300">
              <p>
                İhtiyacınız olduğunda destek ekibimiz{' '}
                <a
                  href={`mailto:${session.institution.contact_email || 'destek@basariyolum.com'}`}
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  destek@basariyolum.com
                </a>{' '}
                üzerinden yardımcı olur.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                disabled={!isActive}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-disabled:bg-gray-200 group-disabled:text-gray-400 dark:bg-blue-900/20 dark:text-blue-300 dark:group-disabled:bg-gray-800 dark:group-disabled:text-gray-500">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-disabled:text-gray-500 dark:text-white">
                    {action.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 group-disabled:text-gray-400 dark:text-gray-300">
                    {action.description}
                  </p>
                </div>
                {!isActive && (
                  <span className="mt-auto inline-flex w-max items-center justify-center rounded-full bg-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    Onay sonrası açılacak
                  </span>
                )}
              </button>
            );
          })}
        </section>

        {session.institution.student_invite_code && (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5 shadow-sm dark:border-indigo-800/40 dark:bg-indigo-900/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  Öğrenci davet kodu
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-indigo-900 dark:text-white">
                  {session.institution.student_invite_code}
                </p>
                <p className="mt-2 text-xs text-indigo-800 dark:text-indigo-200">
                  Öğrenciler bu kodu “Kurum/Öğrenci” girişinden ad-soyad, telefon, e-posta ve şifre ile birlikte girerek
                  kayıt başvurusu yapar. Onaylanana kadar sisteme erişemezler.
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
                  className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-indigo-600 shadow hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
                >
                  Kodu kopyala
                </button>
                <p className="text-xs text-indigo-800 dark:text-indigo-200">
                  Onaylı öğrenci: {session.institution.approved_student_count ?? 0}
                  {session.institution.student_quota && session.institution.student_quota > 0
                    ? ` / ${session.institution.student_quota}`
                    : ' (sınırsız paket)'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-xs text-indigo-900 dark:text-indigo-100 sm:grid-cols-2">
              <div className="rounded-xl border border-white/70 bg-white/80 p-3 dark:border-indigo-800/60 dark:bg-indigo-900/30">
                <p className="font-semibold">Başvuru süreci</p>
                <p className="mt-1">
                  Kodla gelen öğrenciler “Öğrenci Onay” paneline düşer. Kota dolduysa öğrenciler otomatik olarak bilgilendirilir
                  ve kontenjan artırımı için destek kanalına yönlendirilir.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-3 dark:border-indigo-800/60 dark:bg-indigo-900/30">
                <p className="font-semibold">Öğrenci paneli</p>
                <p className="mt-1">
                  Onay sonrası öğrenciler kurum sınav taslaklarını ve ileride duyuru/ödev akışını “Kurum/Öğrenci” girişinden
                  görebilir.
                </p>
              </div>
            </div>
          </section>
        )}

        {isActive && <InstitutionQuestionBankPanel session={session} />}

        {['owner', 'manager'].includes(session.role) && (
          <InstitutionStudentApprovalPanel institutionId={session.institution.id} />
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              Kurum özetiniz
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Öğrenci</p>
                <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Yakında</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Öğrencileri sınıflara göre yönetin ve ilerlemelerini izleyin.
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Öğretmen</p>
                <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Yakında</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Yetki atayın, soru yazma görevleri oluşturun.
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sınav</p>
                <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Yakında</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Deneme, quiz ve yazılı sınav sonuçlarını tek panelde takip edin.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Yaklaşan modüller</h2>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-5 w-5 text-blue-500 dark:text-blue-300" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Soru bankası kategorileri</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ders, konu ve kazanım bazlı soru arşivi ile gelişmiş filtreleme.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-500 dark:text-blue-300" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Velilere sonuç paylaşımı</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Veli paneliyle sınav sonuçlarını güvenle iletin.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-blue-500 dark:text-blue-300" />
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">Kampus içi duyurular</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Kurum içi haber akışı ile öğretmen ve öğrencileri bilgilendirin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
