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
import { PomodoroProvider } from './contexts/PomodoroContext';

function App() {
  const { user, loading, setParentUser, clearUser } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<any>(null);
  const [showStudentParentLoginModal, setShowStudentParentLoginModal] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'blog' | 'blog-detail'>('home');
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string>('');
  const [teacherUser, setTeacherUser] = useState<any>(null);
  const [hasClassViewerSession, setHasClassViewerSession] = useState(false);

  React.useEffect(() => {
    const teacherSession = localStorage.getItem('teacherSession');
    const classViewerSession = localStorage.getItem('classViewerSession');
    setHasClassViewerSession(!!classViewerSession);

    if (teacherSession) {
      const teacherData = JSON.parse(teacherSession);
      console.log('Teacher session found:', teacherData);
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
    }
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      console.log('⬅️ Browser back/forward to:', path);
      
      if (path.startsWith('/blog/') && path !== '/blog/') {
        const slug = path.replace('/blog/', '');
        setSelectedBlogSlug(slug);
        setCurrentView('blog-detail');
      } else if (path === '/blog') {
        setCurrentView('blog');
      } else if (path === '/') {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    const handleOpenTeacherLogin = () => setShowTeacherLoginModal(true);
    window.addEventListener('openTeacherLogin', handleOpenTeacherLogin);
    return () => window.removeEventListener('openTeacherLogin', handleOpenTeacherLogin);
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🔴 App handleLogout');
      
      localStorage.removeItem('teacherSession');
      localStorage.removeItem('classViewerSession');
      setTeacherUser(null);
      
      await clearUser();
      
      console.log('✅ Logout tamamlandı');
    } catch (err) {
      console.error('❌ Logout failed:', err);
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

  const handleNavigateToBlog = () => {
    setCurrentView('blog');
    window.history.pushState({}, '', '/blog');
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
    if (user && currentView === 'home') {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

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

  // ✅ Provider'ı BURADA KULLANMA - renderDashboard içinde kullanıyorduk, YANLIŞ!
  const renderDashboard = () => {
    if (teacherUser) return <TeacherDashboard />;
    
    if (!user) {
      console.log('No user, redirecting home');
      setTimeout(() => setCurrentView('home'), 0);
      return null;
    }
    
    if (user.isParentLogin) return <ParentDashboard />;
    
    // ✅ Provider'sız döndür, zaten dışarıda sarmalandı
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
              <h4 className="font-semibold mb-3">İletişim</h4>
              <p className="text-sm text-gray-400">
                info@basariyolu.com<br />
                0850 123 45 67<br />
                7/24 Canlı Destek
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} BaşarıYolu. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return renderDashboard();
    } else if (currentView === 'blog') {
      return <BlogList onNavigateToDetail={handleNavigateToBlogDetail} />;
    } else if (currentView === 'blog-detail') {
      return <BlogDetail slug={selectedBlogSlug} onNavigateBack={handleNavigateToBlog} />;
    } else {
      return renderHomePage();
    }
  };

  // ✅ BURADA PROVIDER İLE SARMALAMA - SADECE BİR KEZ MOUNT OLACAK
  return (
    <ErrorBoundary>
      <PomodoroProvider studentId={user?.id}>
        {(currentView === 'home' || currentView === 'blog' || currentView === 'blog-detail') && !teacherUser && (
          <Navbar 
            user={user} 
            onStudentParentLogin={() => setShowStudentParentLoginModal(true)}
            onTeacherLogin={() => setShowTeacherLoginModal(true)}
            onLogout={handleLogout}
            onMenuToggle={() => {}}
            onNavigateToBlog={handleNavigateToBlog}
            onNavigateHome={handleNavigateHome}
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
      </PomodoroProvider>
    </ErrorBoundary>
  );
}

export default App;