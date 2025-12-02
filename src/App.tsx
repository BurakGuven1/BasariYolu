import React, { lazy, Suspense } from 'react';
import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpenCheck } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './contexts/AppProviders';
import { packages } from './data/packages';
import Navbar from './components/Navbar';
import { InstitutionSession } from './lib/institutionApi';
import { supabase } from './lib/supabase';
import { blogPosts } from './data/blogPosts';
import {
  applySeo,
  getBlogListingStructuredData,
  getBlogPostStructuredData,
  getOrganizationStructuredData,
} from './lib/seo';

import StudentDashboard from './components/StudentDashboard';

// Loading component for Suspense fallbacks
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-300">Yükleniyor...</p>
    </div>
  </div>
);

// Lazy load heavy/route-specific components
const PricingSection = lazy(() => import('./components/PricingSection'));
const TeacherSection = lazy(() => import('./components/TeacherSection'));
const SiteFooter = lazy(() => import('./components/SiteFooter'));
const LoginModal = lazy(() => import('./components/LoginModal'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const ExamTopicsSection = lazy(() => import('./components/ExamTopicsSection'));
const TeacherLogin = lazy(() => import('./components/TeacherLogin'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const HeroV2 = lazy(() => import('./components/HeroV2'));
const ProblemSection = lazy(() => import('./components/ProblemSection'));
const VisionSection = lazy(() => import('./components/VisionSection'));
const ProductShowcase = lazy(() => import('./components/ProductShowcase'));
const CTASection = lazy(() => import('./components/CTASection'));
const UpgradeModal = lazy(() => import('./components/UpgradeModal'));
const BlogList = lazy(() => import('./components/BlogList'));
const BlogDetail = lazy(() => import('./components/BlogDetail'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const QuestionBankPage = lazy(() => import('./pages/QuestionBankPage'));
const InstitutionRegisterModal = lazy(() => import('./components/InstitutionRegisterModal'));
const InstitutionLoginModal = lazy(() => import('./components/InstitutionLoginModal'));
const InstitutionDashboard = lazy(() => import('./components/InstitutionDashboard'));
const InstitutionStudentAccessModal = lazy(() => import('./components/InstitutionStudentAccessModal'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FeaturesShowcase = lazy(() => import('./components/FeaturesShowcase'));
const LiveStats = lazy(() => import('./components/LiveStats'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const INSTITUTION_MODAL_PATHS = ['/institution/login', '/institution/register'];

function App() {
  const { user, loading, login, logout } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<any>(null);
  const [showStudentParentLoginModal, setShowStudentParentLoginModal] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [showInstitutionStudentModal, setShowInstitutionStudentModal] = useState(false);
  const [hasClassViewerSession, setHasClassViewerSession] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isInstitutionLoginPath = location.pathname === '/institution/login';
  const isInstitutionRegisterPath = location.pathname === '/institution/register';
  const institutionModalReturnPathRef = React.useRef<string | null>(null);

  const isInstitutionUser = user?.userType === 'institution';
  const isTeacherUser = user?.userType === 'teacher';

  const openInstitutionAuthRoute = React.useCallback(
    (targetPath: string) => {
      const currentPath = window.location.pathname;
      if (
        !institutionModalReturnPathRef.current &&
        !INSTITUTION_MODAL_PATHS.includes(currentPath)
      ) {
        institutionModalReturnPathRef.current = currentPath;
      }
      navigate(targetPath);
    },
    [navigate],
  );

  const closeInstitutionModals = React.useCallback(() => {
    institutionModalReturnPathRef.current = null;

    // Kullanıcı varsa kendi rolüne uygun dashboard'a yönlendir
    // DashboardRoute zaten user.userType'a göre doğru yeri gösterecek
    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      // Kullanıcı yoksa ana sayfaya git
      navigate('/', { replace: true });
    }
  }, [navigate, user]);

  React.useEffect(() => {
    if (!INSTITUTION_MODAL_PATHS.includes(location.pathname)) {
      institutionModalReturnPathRef.current = null;
    }
  }, [location.pathname]);

  // Institution session is now managed by AuthContext

  React.useEffect(() => {
    const handleOpenInstitutionLogin = () => openInstitutionAuthRoute('/institution/login');
    const handleOpenInstitutionRegister = () => openInstitutionAuthRoute('/institution/register');

    window.addEventListener('openInstitutionLogin', handleOpenInstitutionLogin);
    window.addEventListener('openInstitutionRegister', handleOpenInstitutionRegister);

    return () => {
      window.removeEventListener('openInstitutionLogin', handleOpenInstitutionLogin);
      window.removeEventListener('openInstitutionRegister', handleOpenInstitutionRegister);
    };
  }, [openInstitutionAuthRoute]);

  React.useEffect(() => {
    const classViewerSession = localStorage.getItem('classViewerSession');
    setHasClassViewerSession(!!classViewerSession);
  }, []);

  // Remove legacy institution session refresh
  // Now handled by AuthContext
  React.useEffect(() => {
    const slugMatch = location.pathname.match(/^\/blog\/([^/]+)/);
    const slug = slugMatch?.[1];

    if (location.pathname === '/dashboard') {
      applySeo({
        title: 'BasariYolu | Ogrenci Paneli',
        description: 'BasariYolu ogrenci paneli ile calisma planlarini, ilerlemeni ve hedeflerini tek ekrandan takip et.',
        path: '/dashboard',
        type: 'website',
        noIndex: true,
      });
      return;
    }

    if (slug) {
      const selectedPost = blogPosts.find((post) => post.slug === slug);
      if (selectedPost) {
        applySeo({
          title: `${selectedPost.title} | BasariYolu Blog`,
          description: selectedPost.excerpt,
          path: `/blog/${selectedPost.slug}`,
          type: 'article',
          image: selectedPost.coverImage,
          keywords: selectedPost.tags,
          publishedTime: selectedPost.publishedAt,
          modifiedTime: selectedPost.updatedAt ?? selectedPost.publishedAt,
          structuredData: getBlogPostStructuredData(selectedPost),
        });
        return;
      }
    }

    if (location.pathname === '/blog') {
      applySeo({
        title: 'BasariYolu Blog | YKS ve LGS Hazirlik Ipuclari',
        description: 'Uzman kadromuzdan calisma planlari, sinav stratejileri ve motivasyon rehberleriyle YKS ve LGS hazirligini guclendir.',
        path: '/blog',
        type: 'blog',
        keywords: ['YKS blog', 'LGS blog', 'calisma teknikleri', 'sinav stratejileri', 'motivasyon'],
        structuredData: getBlogListingStructuredData(
          blogPosts.map(({ title, slug, excerpt }) => ({ title, slug, excerpt })),
        ),
      });
      return;
    }

    if (location.pathname === '/terms-of-service') {
      applySeo({
        title: 'BasariYolu Kullanim Sartlari',
        description: 'BasariYolu platformu kullanim sartlari ve hizmet kosullari hakkinda bilgi alin.',
        path: '/terms-of-service',
        type: 'article',
      });
      return;
    }

    if (location.pathname === '/privacy-policy') {
      applySeo({
        title: 'BasariYolu Gizlilik Politikasi',
        description: 'BasariYolu kullanici verilerinin guvenligi ve gizlilik politikasini okuyun.',
        path: '/privacy-policy',
        type: 'article',
      });
      return;
    }

    if (location.pathname === '/refund-policy') {
      applySeo({
        title: 'BasariYolu Iade Politikasi',
        description: 'BasariYolu uyeliklerinde iade surecleri ve kosullari.',
        path: '/refund-policy',
        type: 'article',
      });
      return;
    }

    if (location.pathname === '/institution') {
      applySeo({
        title: 'BasariYolu | Kurum Paneli',
        description: 'BasariYolu kurum paneli ile ogretmen ve siniflarini tek yerden yonet, soru bankasi olustur.',
        path: '/institution',
        type: 'website',
        noIndex: true,
      });
      return;
    }

    if (['/', '/institution/login', '/institution/register'].includes(location.pathname)) {
      applySeo({
        title: 'BasariYolu | Yapay Zeka Destekli Sinav Hazirlik Platformu',
        description: 'BasariYolu ile YKS ve LGS hazirliginda yapay zeka destekli calisma planlari ve uzman koclukla hedeflerine ulas.',
        path: '/',
        type: 'website',
        keywords: ['YKS', 'LGS', 'ders calisma plani', 'pomodoro timer', 'ogrenci koclugu'],
        structuredData: getOrganizationStructuredData(),
      });
      return;
    }

    applySeo({
      title: 'BaşarıYolu',
      description: 'Aradiginiz sayfa bulunamadı. BaşarıYolu ana sayfasına dönerek aradiginiz içeriği keşfedin.',
      path: location.pathname,
      type: 'website',
      noIndex: true,
    });
  }, [location.pathname]);

  React.useEffect(() => {
    const handleOpenTeacherLogin = () => setShowTeacherLoginModal(true);
    window.addEventListener('openTeacherLogin', handleOpenTeacherLogin);
    return () => window.removeEventListener('openTeacherLogin', handleOpenTeacherLogin);
  }, []);


  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = (loginUser?: any) => {

    if (loginUser) {
      const normalizedUserType =
        loginUser.userType ||
        loginUser.user_type ||
        loginUser?.user_metadata?.user_type ||
        loginUser?.profile?.user_type ||
        'student';

      const normalizedUser = {
        id: loginUser.id,
        email: loginUser.email ?? '',
        userType: normalizedUserType,
        profile: loginUser.user_metadata ?? loginUser.profile ?? {},
      };

      login(normalizedUser);
    }

    setTimeout(() => {
      navigate('/dashboard');
      setShowStudentParentLoginModal(false);
    }, 150);
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowStudentParentLoginModal(true);
    }
  };

  const handleSelectPackage = (packageId: string, billingCycle: 'monthly' | 'sixMonth' | 'yearly') => {
    const selectedPackage = packages.find(pkg => pkg.id === packageId);

    if (!selectedPackage) return;

    // Kullanıcı giriş yapmamışsa direkt iyzico linkine yönlendir
    if (!user) {
      const paymentLink = selectedPackage.paymentLinks?.[billingCycle];

      if (paymentLink && !paymentLink.startsWith('IYZICO_LINK_')) {
        // Gerçek iyzico linki varsa yönlendir
        window.open(paymentLink, '_blank');
      } else {
        // Link henüz ayarlanmamışsa modal göster
        alert('Ödeme sistemi yakında aktif olacak! Lütfen destek@basariyolum.com ile iletişime geçin.');
      }
      return;
    }

    // Kullanıcı giriş yapmışsa upgrade modalı göster
    setTargetUpgradePlan({
      id: selectedPackage.id,
      name: selectedPackage.name,
      monthlyPrice: selectedPackage.monthlyPrice.toString(),
      yearlyPrice: selectedPackage.yearlyPrice.toString(),
      billingCycle
    });
    setShowUpgradeModal(true);
  };

  const handleInstitutionLoginSuccess = async (session: InstitutionSession) => {
    if (!session || !session.institution) {
      await supabase.auth.signOut();
      alert('Kurum kaydi bulunamadi. Lutfen yeniden deneyin.');
      navigate('/', { replace: true });
      return;
    }

    if (!session.institution.is_active) {
      await supabase.auth.signOut();
      alert(
        'Kurum hesabiniz henuz aktif degil. Basvurunuz onaylandiginda kurumsal girisi kullanabilirsiniz.'
      );
      navigate('/', { replace: true });
      return;
    }

    // Use AuthContext to save institution session
    login({
      id: session.user.id,
      email: session.user.email || '',
      userType: 'institution',
      institutionSession: session,
    });

    institutionModalReturnPathRef.current = null;
    Promise.resolve().then(() => navigate('/institution', { replace: true }));
  };

  const handleInstitutionRegisterSuccess = (_session: InstitutionSession) => {
    institutionModalReturnPathRef.current = null;
    navigate('/', { replace: true });
    alert('Basvurunuz alindi. Onaylandiginda bilgilendirileceksiniz.');
  };

  const handleInstitutionLogout = async () => {
    console.log('🏛️ Institution logout initiated');

    // CRITICAL: Immediately clear institution data before calling logout
    // This prevents race condition where component tries to render during redirect
    localStorage.removeItem('institutionSession');

    // Call main logout with institution redirect
    await logout({ redirectTo: '/institution/login' });
  };

  const handleInstitutionRefresh = React.useCallback(async () => {
    // Refresh is now handled by AuthContext
    // Just trigger a refresh
    if (user?.userType === 'institution') {
      // AuthContext will handle this automatically
    }
  }, [user]);

  const handleNavigateToBlog = () => {
    navigate('/blog');
    window.scrollTo(0, 0);
  };

  const handleNavigateToBlogDetail = (slug: string) => {
    navigate(`/blog/${slug}`);
    window.scrollTo(0, 0);
  };

  const handleNavigateHome = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };

  const handleNavigateToQuestionBank = () => {
    navigate('/question-bank');
    window.scrollTo(0, 0);
  };

  const handleNavigateToTerms = () => {
    navigate('/terms-of-service');
    window.scrollTo(0, 0);
  };

  const handleNavigateToPrivacy = () => {
    navigate('/privacy-policy');
    window.scrollTo(0, 0);
  };

  const handleNavigateToRefund = () => {
    navigate('/refund-policy');
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    if (user && location.pathname === '/' && !isInstitutionUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, isInstitutionUser, navigate]);

  React.useEffect(() => {
    if (!loading && !user && location.pathname === '/dashboard') {
      navigate('/', { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const DashboardRoute = () => {
    if (!user) {
      return <Navigate to="/" replace />;
    }

    if (user.userType === 'student') {
      return <StudentDashboard authUser={user} />;
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {user.userType === 'teacher' && (
          <TeacherDashboard teacherUser={user.teacherData} onLogout={handleLogout} />
        )}
        {(user.userType === 'parent' || user.isParentLogin) && <ParentDashboard />}
      </Suspense>
    );
  };

  const InstitutionDashboardRoute = () => {
    if (!user || user.userType !== 'institution' || !user.institutionSession) {
      return <Navigate to="/institution/login" replace />;
    }

    return (
      <Suspense fallback={<LoadingSpinner />}>
        <InstitutionDashboard
          session={user.institutionSession}
          onLogout={handleInstitutionLogout}
          onRefresh={handleInstitutionRefresh}
        />
      </Suspense>
    );
  };

  const renderHomePage = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <HeroV2 onGetStarted={handleGetStarted} />
        <LiveStats />
        <ProblemSection />
        <VisionSection />
        <ProductShowcase />
        <Testimonials />
        <PricingSection onSelectPackage={handleSelectPackage} />
        <ExamTopicsSection
          user={user}
          hasClassViewerSession={hasClassViewerSession}
          onUpgrade={() => setShowStudentParentLoginModal(true)}
        />
        <TeacherSection />
        <CTASection onGetStarted={handleGetStarted} />
        <SiteFooter
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateToTerms={handleNavigateToTerms}
          onNavigateToPrivacy={handleNavigateToPrivacy}
          onNavigateToRefund={handleNavigateToRefund}
        />
      </div>
    </Suspense>
  );

  const HomePageContent = () => renderHomePage();
  const isQuestionBankAllowed = Boolean(user);


  const isBlogDetailPath = location.pathname.startsWith('/blog/') && location.pathname !== '/blog';
  const shouldShowNavbar =
    (
      location.pathname === '/' ||
      location.pathname === '/blog' ||
      location.pathname === '/question-bank' ||
      isBlogDetailPath ||
      location.pathname === '/terms-of-service' ||
      location.pathname === '/privacy-policy' ||
      location.pathname === '/refund-policy' ||
      isInstitutionLoginPath ||
      isInstitutionRegisterPath
    ) &&
    !isTeacherUser &&
    !isInstitutionUser;

  const routes = (
    <Routes>
      <Route path="/" element={<HomePageContent />} />
      <Route path="/institution/login" element={<HomePageContent />} />
      <Route path="/institution/register" element={<HomePageContent />} />
      <Route path="/blog" element={<Suspense fallback={<LoadingSpinner />}><BlogList onNavigateToDetail={handleNavigateToBlogDetail} /></Suspense>} />
      <Route path="/blog/:slug" element={<Suspense fallback={<LoadingSpinner />}><BlogDetailRoute /></Suspense>} />
      <Route path="/terms-of-service" element={<Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense>} />
      <Route path="/sartlar-ve-kosullar" element={<Navigate to="/terms-of-service" replace />} />
      <Route path="/privacy-policy" element={<Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense>} />
      <Route path="/gizlilik-politikasi" element={<Navigate to="/privacy-policy" replace />} />
      <Route path="/refund-policy" element={<Suspense fallback={<LoadingSpinner />}><RefundPolicy /></Suspense>} />
      <Route path="/iade-politikasi" element={<Navigate to="/refund-policy" replace />} />
      <Route path="/features" element={<Suspense fallback={<LoadingSpinner />}><FeaturesShowcase /></Suspense>} />
      <Route path="/ozellikler" element={<Navigate to="/features" replace />} />
      <Route
        path="/question-bank"
        element={isQuestionBankAllowed ? <Suspense fallback={<LoadingSpinner />}><QuestionBankPage /></Suspense> : <Navigate to="/" replace />}
      />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/institution" element={<InstitutionDashboardRoute />} />
      <Route path="/auth/callback" element={<Suspense fallback={<LoadingSpinner />}><AuthCallback /></Suspense>} />
      <Route path="/auth/confirm" element={<Suspense fallback={<LoadingSpinner />}><AuthCallback /></Suspense>} />
      <Route path="/auth/reset-password" element={<Suspense fallback={<LoadingSpinner />}><ResetPassword /></Suspense>} />
      <Route path="*" element={<Suspense fallback={<LoadingSpinner />}><NotFoundPage onNavigateHome={handleNavigateHome} /></Suspense>} />
    </Routes>
  );

  const institutionLoginModalOpen = isInstitutionLoginPath;
  const institutionRegisterModalOpen = isInstitutionRegisterPath;

  const appContent = (
    <>
      {shouldShowNavbar && (
        <Navbar
          user={user}
          onStudentParentLogin={() => setShowStudentParentLoginModal(true)}
          onTeacherLogin={() => setShowTeacherLoginModal(true)}
          onInstitutionLogin={() => openInstitutionAuthRoute('/institution/login')}
          onInstitutionStudentAccess={() => setShowInstitutionStudentModal(true)}
          onLogout={handleLogout}
          onMenuToggle={() => {}}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateHome={handleNavigateHome}
          onNavigateToQuestionBank={handleNavigateToQuestionBank}
        />
      )}

      {routes}

      <Suspense fallback={null}>
        <LoginModal
          isOpen={showStudentParentLoginModal}
          onClose={() => setShowStudentParentLoginModal(false)}
          onLogin={handleLogin}
        />

        <TeacherLogin
          isOpen={showTeacherLoginModal}
          onClose={() => setShowTeacherLoginModal(false)}
          onSuccess={(teacher) => {
            setShowTeacherLoginModal(false);
            // Use AuthContext login
            login({
              id: teacher.id,
              email: teacher.email || '',
              userType: 'teacher',
              teacherData: teacher,
            });
            navigate('/dashboard');
          }}
        />

        <InstitutionRegisterModal
          isOpen={institutionRegisterModalOpen}
          onClose={closeInstitutionModals}
          onSuccess={handleInstitutionRegisterSuccess}
          onSwitchToLogin={() => openInstitutionAuthRoute('/institution/login')}
        />

        <InstitutionLoginModal
          isOpen={institutionLoginModalOpen}
          onClose={closeInstitutionModals}
          onSuccess={handleInstitutionLoginSuccess}
          onSwitchToRegister={() => openInstitutionAuthRoute('/institution/register')}
        />

        <InstitutionStudentAccessModal
          open={showInstitutionStudentModal}
          onClose={() => setShowInstitutionStudentModal(false)}
        />

        {showUpgradeModal && targetUpgradePlan && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => {
              setShowUpgradeModal(false);
              setTargetUpgradePlan(null);
            }}
            targetPlanId={targetUpgradePlan.id}
            targetPlanName={targetUpgradePlan.name}
            targetPlanPrice={{
              monthly: targetUpgradePlan.monthlyPrice,
              yearly: targetUpgradePlan.yearlyPrice
            }}
            currentBillingCycle={targetUpgradePlan.billingCycle || 'monthly'}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}
      </Suspense>

      {isQuestionBankAllowed && location.pathname !== '/question-bank' && (
        <button
          onClick={handleNavigateToQuestionBank}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
        >
          <BookOpenCheck className="h-4 w-4" />
          Soru Bankası
        </button>
      )}
    </>
  );

  return (
    <ErrorBoundary>
      {appContent}
    </ErrorBoundary>
  );
  
}

function BlogDetailRoute() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (!slug) {
    return <Navigate to="/blog" replace />;
  }

  return <BlogDetail slug={slug} onNavigateBack={() => navigate('/blog')} />;
}

export default App;
