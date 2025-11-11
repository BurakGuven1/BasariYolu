import React from 'react';
import { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { packages } from './data/packages';
import Navbar from './components/Navbar';
import PricingSection from './components/PricingSection';
import TeacherSection from './components/TeacherSection';
import LoginModal from './components/LoginModal';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import ExamTopicsSection from './components/ExamTopicsSection';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import HeroV2 from './components/HeroV2';
import ProblemSection from './components/ProblemSection';
import VisionSection from './components/VisionSection';
import ProductShowcase from './components/ProductShowcase';
import SocialProof from './components/SocialProof';
import CTASection from './components/CTASection';
import UpgradeModal from './components/UpgradeModal';
import BlogList from './components/BlogList';
import BlogDetail from './components/BlogDetail';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import InstitutionRegisterModal from './components/InstitutionRegisterModal';
import InstitutionLoginModal from './components/InstitutionLoginModal';
import InstitutionDashboard from './components/InstitutionDashboard';
import InstitutionStudentAccessModal from './components/InstitutionStudentAccessModal';
import { InstitutionSession, refreshInstitutionSession } from './lib/institutionApi';
import { supabase } from './lib/supabase';
import { blogPosts } from './data/blogPosts';
import {
  applySeo,
  getBlogListingStructuredData,
  getBlogPostStructuredData,
  getOrganizationStructuredData,
} from './lib/seo';

import { PomodoroProvider } from './contexts/PomodoroContext';
import NotFoundPage from './pages/NotFoundPage';
import FeaturesShowcase from './components/FeaturesShowcase';

function App() {
  const { user, loading, setParentUser, clearUser } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<any>(null);
  const [showStudentParentLoginModal, setShowStudentParentLoginModal] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [institutionSession, setInstitutionSession] = useState<InstitutionSession | null>(null);
  const [showInstitutionRegisterModal, setShowInstitutionRegisterModal] = useState(false);
  const [showInstitutionLoginModal, setShowInstitutionLoginModal] = useState(false);
  const [showInstitutionStudentModal, setShowInstitutionStudentModal] = useState(false);

  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'blog' | 'blog-detail' | 'terms' | 'privacy' | 'refund' | 'not-found' | 'institution-login' | 'institution-register' | 'institution-dashboard' | 'features'>('home');
  
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string>('');
  const [teacherUser, setTeacherUser] = useState<any>(null);
  const [hasClassViewerSession, setHasClassViewerSession] = useState(false);

  const isInstitutionUser =
    Boolean(institutionSession) || user?.profile?.user_type === 'institution_owner';

  React.useEffect(() => {
    const storedInstitution = localStorage.getItem('institutionSession');
    if (storedInstitution) {
      try {
        const parsedSession: InstitutionSession = JSON.parse(storedInstitution);
        setInstitutionSession(parsedSession);
      } catch {
        localStorage.removeItem('institutionSession');
      }
    }
  }, []);

  React.useEffect(() => {
    const handleOpenInstitutionLogin = () => setShowInstitutionLoginModal(true);
    const handleOpenInstitutionRegister = () => setShowInstitutionRegisterModal(true);

    window.addEventListener('openInstitutionLogin', handleOpenInstitutionLogin);
    window.addEventListener('openInstitutionRegister', handleOpenInstitutionRegister);

    return () => {
      window.removeEventListener('openInstitutionLogin', handleOpenInstitutionLogin);
      window.removeEventListener('openInstitutionRegister', handleOpenInstitutionRegister);
    };
  }, []);

  React.useEffect(() => {
    const teacherSession = localStorage.getItem('teacherSession');
    const classViewerSession = localStorage.getItem('classViewerSession');
    setHasClassViewerSession(!!classViewerSession);

    if (teacherSession) {
      const teacherData = JSON.parse(teacherSession);
      setTeacherUser(teacherData);
      setCurrentView('dashboard');
      return;
    }

    const path = window.location.pathname;
    if (path.startsWith('/blog/')) {
      const slug = path.replace('/blog/', '');
      setSelectedBlogSlug(slug);
      setCurrentView('blog-detail');
    } else if (path === '/blog') {
      setCurrentView('blog');
    } else if (path === '/terms-of-service' || path === '/sartlar-ve-kosullar') {
      setCurrentView('terms');
    } else if (path === '/privacy-policy' || path === '/gizlilik-politikasi') {
      setCurrentView('privacy');
    } else if (path === '/refund-policy' || path === '/iade-politikasi') {
      setCurrentView('refund');
    } else if (path === '/institution/register') {
      setCurrentView('institution-register');
      setShowInstitutionRegisterModal(true);
    } else if (path === '/institution/login') {
      setCurrentView('institution-login');
      setShowInstitutionLoginModal(true);
    } else if (path === '/institution') {
      const storedInstitution = localStorage.getItem('institutionSession');
      if (storedInstitution) {
        setCurrentView('institution-dashboard');
      } else {
        setCurrentView('institution-login');
        setShowInstitutionLoginModal(true);
      }
    } else if (path === '/features' || path === '/ozellikler') {
      setCurrentView('features');
    } else if (path === '/' || path === '') {
      setCurrentView('home');
    } else {
      setCurrentView('not-found');
    }
  }, []);

  React.useEffect(() => {
    if (institutionSession) {
      localStorage.setItem('institutionSession', JSON.stringify(institutionSession));
    }
  }, [institutionSession]);

  React.useEffect(() => {
    if (institutionSession) {
      if (
        currentView === 'institution-login' ||
        currentView === 'institution-register' ||
        currentView === 'home'
      ) {
        setCurrentView('institution-dashboard');
      }
    }
  }, [institutionSession, currentView]);

  React.useEffect(() => {
    if (!institutionSession && currentView === 'institution-dashboard') {
      setCurrentView('home');
    }
  }, [institutionSession, currentView]);

  React.useEffect(() => {
    const selectedPost = selectedBlogSlug
      ? blogPosts.find((post) => post.slug === selectedBlogSlug)
      : undefined;

    switch (currentView) {
      case 'dashboard':
        applySeo({
          title: 'BasariYolu | Ogrenci Paneli',
          description: 'BasariYolu ogrenci paneli ile calisma planlarini, ilerlemeni ve hedeflerini tek ekrandan takip et.',
          path: '/dashboard',
          type: 'website',
          noIndex: true,
        });
        break;
      case 'blog-detail':
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
        }
        break;
      case 'blog':
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
        break;
      case 'terms':
        applySeo({
          title: 'BasariYolu Kullanim Sartlari',
          description: 'BasariYolu platformu kullanim sartlari ve hizmet kosullari hakkinda bilgi alin.',
          path: '/terms-of-service',
          type: 'article',
        });
        break;
      case 'privacy':
        applySeo({
          title: 'BasariYolu Gizlilik Politikasi',
          description: 'BasariYolu kullanici verilerinin guvenligi ve gizlilik politikasini okuyun.',
          path: '/privacy-policy',
          type: 'article',
        });
        break;
      case 'refund':
        applySeo({
          title: 'BasariYolu Iade Politikasi',
          description: 'BasariYolu uyeliklerinde iade surecleri ve kosullari.',
          path: '/refund-policy',
          type: 'article',
        });
        break;
      case 'institution-dashboard':
        applySeo({
          title: 'BasariYolu | Kurum Paneli',
          description: 'BasariYolu kurum paneli ile ogretmen ve siniflarini tek yerden yonet, soru bankasi olustur.',
          path: '/institution',
          type: 'website',
          noIndex: true,
        });
        break;
      case 'not-found':
        applySeo({
          title: 'BasariYolu | Sayfa Bulunamadi',
          description: 'Aradiginiz sayfa bulunamadi. BasariYolu ana sayfasina donerek aradiginiz icerigi kesfedin.',
          path: window.location.pathname,
          type: 'website',
          noIndex: true,
        });
        break;
      default:
        applySeo({
          title: 'BasariYolu | Yapay Zeka Destekli Sinav Hazirlik Platformu',
          description: 'BasariYolu ile YKS ve LGS hazirliginda yapay zeka destekli calisma planlari ve uzman koclukla hedeflerine ulas.',
          path: '/',
          type: 'website',
          keywords: ['YKS', 'LGS', 'ders calisma plani', 'pomodoro timer', 'ogrenci koclugu'],
          structuredData: getOrganizationStructuredData(),
        });
    }
  }, [currentView, selectedBlogSlug]);

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      
      if (path.startsWith('/blog/') && path !== '/blog/') {
        const slug = path.replace('/blog/', '');
        setSelectedBlogSlug(slug);
        setCurrentView('blog-detail');
      } else if (path === '/blog') {
        setCurrentView('blog');
      } else if (path === '/terms-of-service' || path === '/sartlar-ve-kosullar') {
        setCurrentView('terms');
      } else if (path === '/privacy-policy' || path === '/gizlilik-politikasi') {
        setCurrentView('privacy');
      } else if (path === '/refund-policy' || path === '/iade-politikasi') {
        setCurrentView('refund');
      } else if (path === '/institution/register') {
        setCurrentView('institution-register');
        setShowInstitutionRegisterModal(true);
      } else if (path === '/institution/login') {
        setCurrentView('institution-login');
        setShowInstitutionLoginModal(true);
      } else if (path === '/institution') {
        const storedInstitution = localStorage.getItem('institutionSession');
        if (storedInstitution) {
          setCurrentView('institution-dashboard');
        } else {
          setCurrentView('institution-login');
          setShowInstitutionLoginModal(true);
        }
      } else if (path === '/') {
        setCurrentView('home');
      } else {
        setCurrentView('not-found');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    const handleGlobalError = () => {
      setCurrentView('not-found');
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  React.useEffect(() => {
    const handleOpenTeacherLogin = () => setShowTeacherLoginModal(true);
    window.addEventListener('openTeacherLogin', handleOpenTeacherLogin);
    return () => window.removeEventListener('openTeacherLogin', handleOpenTeacherLogin);
  }, []);

  const handleLogout = async () => {
    try {
      
      localStorage.removeItem('teacherSession');
      localStorage.removeItem('classViewerSession');
      localStorage.removeItem('institutionSession');
      setTeacherUser(null);
      setInstitutionSession(null);

      await clearUser();
      setCurrentView('home');
    } catch (err) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const handleLogin = (loginUser?: any) => {
    console.log('handleLogin called');

    if (loginUser && loginUser.isParentLogin) {
      setParentUser(loginUser);
    }

    setTimeout(() => {
      setCurrentView('dashboard');
      setShowStudentParentLoginModal(false);
    }, 300);
  };

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      setShowStudentParentLoginModal(true);
    }
  };

  const handleSelectPackage = (packageId: string, billingCycle: 'monthly' | 'yearly') => {
    if (user) {
      const selectedPackage = packages.find(pkg => pkg.id === packageId);
      if (selectedPackage) {
        setTargetUpgradePlan({
          id: selectedPackage.id,
          name: selectedPackage.name,
          monthlyPrice: selectedPackage.monthlyPrice.toString(),
          yearlyPrice: selectedPackage.yearlyPrice.toString(),
          billingCycle
        });
        setShowUpgradeModal(true);
      }
    } else {
      setShowStudentParentLoginModal(true);
    }
  };

  const handleInstitutionLoginSuccess = async (session: InstitutionSession) => {
    if (!session || !session.institution) {
      localStorage.removeItem('institutionSession');
      await supabase.auth.signOut();
      alert('Kurum kaydi bulunamadi. Lutfen yeniden deneyin.');
      setShowInstitutionLoginModal(false);
      setCurrentView('home');
      return;
    }

    if (!session.institution.is_active) {
      localStorage.removeItem('institutionSession');
      await supabase.auth.signOut();
      setInstitutionSession(null);
      setCurrentView('home');
      alert(
        'Kurum hesabiniz henuz aktif degil. Basvurunuz onaylandiginda kurumsal girisi kullanabilirsiniz.'
      );
      setShowInstitutionLoginModal(false);
      return;
    }

    setInstitutionSession(session);
    localStorage.setItem('institutionSession', JSON.stringify(session));
    setShowInstitutionLoginModal(false);
    setShowInstitutionRegisterModal(false);
    if (window.location.pathname !== '/institution') {
      window.history.pushState({}, '', '/institution');
    }
    setCurrentView('institution-dashboard');
  };

  const handleInstitutionRegisterSuccess = (_session: InstitutionSession) => {
    setShowInstitutionRegisterModal(false);
    setShowInstitutionLoginModal(false);
    localStorage.removeItem('institutionSession');
    setInstitutionSession(null);
    setCurrentView('home');
    alert('Basvurunuz alindi. Onaylandiginda bilgilendirileceksiniz.');
  };

  const handleInstitutionLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Institution logout error', err);
    } finally {
      localStorage.removeItem('institutionSession');
      setInstitutionSession(null);
      setShowInstitutionLoginModal(false);
      setShowInstitutionRegisterModal(false);
      if (window.location.pathname.startsWith('/institution')) {
        window.history.pushState({}, '', '/');
      }
      setCurrentView('home');
    }
  };

  const handleInstitutionRefresh = React.useCallback(async () => {
    try {
      const latest = await refreshInstitutionSession();
      if (latest) {
        setInstitutionSession(latest);
        localStorage.setItem('institutionSession', JSON.stringify(latest));
      }
    } catch (err) {
      console.error('Institution session refresh error', err);
    }
  }, []);

  const handleNavigateToBlog = () => {
    setCurrentView('blog');
    window.history.pushState({}, '', '/blog');
    window.scrollTo(0, 0);
  };

  const handleNavigateToFeatures = () => {
    setCurrentView('features');
    window.history.pushState({}, '', '/features');
    window.scrollTo(0, 0);
  };

  const handleNavigateToBlogDetail = (slug: string) => {
    setSelectedBlogSlug(slug);
    setCurrentView('blog-detail');
    window.history.pushState({}, '', `/blog/${slug}`);
    window.scrollTo(0, 0);
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  React.useEffect(() => {
    if (user && currentView === 'home' && !isInstitutionUser) {
      setCurrentView('dashboard');
    }
  }, [user, currentView, isInstitutionUser]);

  React.useEffect(() => {
    if (!loading && !teacherUser && !user && currentView === 'dashboard') {
      setCurrentView('home');
    }
  }, [loading, user, teacherUser, currentView]);

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

  const renderDashboard = () => {
    if (teacherUser) return <TeacherDashboard teacherUser={teacherUser} onLogout={handleLogout} />;
    
    if (!user) {
      console.log('No user, redirecting home');
      setTimeout(() => setCurrentView('home'), 0);
      return null;
    }
    
    if (user.isParentLogin) return <ParentDashboard />;
    return <StudentDashboard />;
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroV2 onGetStarted={handleGetStarted} />
      <ProblemSection />
      <VisionSection />
      <ProductShowcase />
      <SocialProof />
      <PricingSection onSelectPackage={handleSelectPackage} />
      <ExamTopicsSection 
        user={user} 
        hasClassViewerSession={hasClassViewerSession}
        onUpgrade={() => setShowStudentParentLoginModal(true)}
      />
      <TeacherSection />
      <CTASection onGetStarted={handleGetStarted} />
      
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">BaşarıYolu</h3>
              <p className="text-gray-400 text-sm">
                Türkiye'nin en kapsamlı öğrenci takip platformu.
                Yapay zeka desteğiyle akademik başarınızı artırın.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Özellikler</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Deneme Takibi</li>
                <li>AI Analiz</li>
                <li>Veli Paneli</li>
                <li>Ödev Sistemi</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">İçerik</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={handleNavigateToBlog} className="hover:text-white">
                    Blog
                  </button>
                </li>
                <li>Çalışma Teknikleri</li>
                <li>Sınav Stratejileri</li>
                <li>Motivasyon</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Yasal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={handleNavigateToTerms} className="hover:text-white">
                    KullanÄ±m ÅartlarÄ±
                  </button>
                </li>
                <li>
                  <button onClick={handleNavigateToPrivacy} className="hover:text-white">
                    Gizlilik PolitikasÄ±
                  </button>
                </li>
                <li>
                  <button onClick={handleNavigateToRefund} className="hover:text-white">
                    İptal ve İade
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} BaşarıYolu. Tüm hakları saklıdır.</p>
            <p className="mt-2 text-xs">
              <button onClick={handleNavigateToTerms} className="hover:text-white mx-2">
                Kullanım Şartları
              </button>
              |
              <button onClick={handleNavigateToPrivacy} className="hover:text-white mx-2">
                Gizlilik
              </button>
              |
              <button onClick={handleNavigateToRefund} className="hover:text-white mx-2">
                İade Politikası
              </button>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );

  const handleNavigateToTerms = () => {
    setCurrentView('terms');
    window.history.pushState({}, '', '/terms-of-service');
    window.scrollTo(0, 0);
  };

  const handleNavigateToPrivacy = () => {
    setCurrentView('privacy');
    window.history.pushState({}, '', '/privacy-policy');
    window.scrollTo(0, 0);
  };

  const handleNavigateToRefund = () => {
    setCurrentView('refund');
    window.history.pushState({}, '', '/refund-policy');
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return renderDashboard();
    } else if (currentView === 'features') {
      return <FeaturesShowcase />;
    } else if (currentView === 'blog') {
      return <BlogList onNavigateToDetail={handleNavigateToBlogDetail} />;
    } else if (currentView === 'blog-detail') {
      return <BlogDetail slug={selectedBlogSlug} onNavigateBack={handleNavigateToBlog} />;
    } else if (currentView === 'terms') {
      return <TermsOfService />;
    } else if (currentView === 'privacy') {
      return <PrivacyPolicy />;
    } else if (currentView === 'refund') {
      return <RefundPolicy />;
    } else if (currentView === 'institution-dashboard') {
      if (!institutionSession) {
        return (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <p className="text-sm text-gray-500 dark:text-gray-300">Kurum oturumu bulunamadı.</p>
          </div>
        );
      }
      return (
        <InstitutionDashboard
          session={institutionSession}
          onLogout={handleInstitutionLogout}
          onRefresh={handleInstitutionRefresh}
        />
      );
    } else if (currentView === 'not-found') {
      return <NotFoundPage onNavigateHome={handleNavigateHome} />;
    } else {
      return renderHomePage();
    }
  };

  const shouldShowNavbar =
    (currentView === 'home' ||
      currentView === 'features' ||
      currentView === 'blog' ||
      currentView === 'blog-detail' ||
      currentView === 'terms' ||
      currentView === 'privacy' ||
      currentView === 'refund') &&
    !teacherUser &&
    !institutionSession;

  const appContent = (
    <>
      {shouldShowNavbar && (
        <Navbar
          user={user}
          onStudentParentLogin={() => setShowStudentParentLoginModal(true)}
          onTeacherLogin={() => setShowTeacherLoginModal(true)}
          onInstitutionLogin={() => {
            setShowInstitutionLoginModal(true);
            window.history.pushState({}, '', '/institution/login');
          }}
          onInstitutionStudentAccess={() => setShowInstitutionStudentModal(true)}
          onLogout={handleLogout}
          onMenuToggle={() => {}}
          onNavigateToBlog={handleNavigateToBlog}
          onNavigateHome={handleNavigateHome}
          onNavigateToFeatures={handleNavigateToFeatures}
        />
      )}

      {renderContent()}

      <LoginModal
        isOpen={showStudentParentLoginModal}
        onClose={() => setShowStudentParentLoginModal(false)}
        onLogin={handleLogin}
        setUserState={setParentUser}
      />

      <TeacherLogin
        isOpen={showTeacherLoginModal}
        onClose={() => setShowTeacherLoginModal(false)}
        onSuccess={(teacher) => {
          setShowTeacherLoginModal(false);
          setTeacherUser(teacher);
          setCurrentView('dashboard');
          console.log('Teacher login success, setting view to dashboard');
        }}
      />

      <InstitutionRegisterModal
        isOpen={showInstitutionRegisterModal}
        onClose={() => setShowInstitutionRegisterModal(false)}
        onSuccess={handleInstitutionRegisterSuccess}
        onSwitchToLogin={() => {
          setShowInstitutionRegisterModal(false);
          setShowInstitutionLoginModal(true);
          window.history.pushState({}, '', '/institution/login');
        }}
      />

      <InstitutionLoginModal
        isOpen={showInstitutionLoginModal}
        onClose={() => setShowInstitutionLoginModal(false)}
        onSuccess={handleInstitutionLoginSuccess}
        onSwitchToRegister={() => {
          setShowInstitutionLoginModal(false);
          setShowInstitutionRegisterModal(true);
          window.history.pushState({}, '', '/institution/register');
        }}
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
    </>
  );

  return (
    <ErrorBoundary>
      {currentView === 'institution-dashboard' ? (
        appContent
      ) : (
        <PomodoroProvider studentId={user?.id}>
          {appContent}
        </PomodoroProvider>
      )}
    </ErrorBoundary>
  );
}

export default App;



