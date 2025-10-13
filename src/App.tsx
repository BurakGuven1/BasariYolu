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

function App() {
  const { user, loading, setParentUser, clearUser } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<any>(null);
  const [showStudentParentLoginModal, setShowStudentParentLoginModal] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [teacherUser, setTeacherUser] = useState<any>(null);
  const [hasClassViewerSession, setHasClassViewerSession] = useState(false);

  // Check for teacher session on load
  React.useEffect(() => {
    const teacherSession = localStorage.getItem('teacherSession');
    const classViewerSession = localStorage.getItem('classViewerSession');
    setHasClassViewerSession(!!classViewerSession);

    if (teacherSession) {
      const teacherData = JSON.parse(teacherSession);
      console.log('Teacher session found:', teacherData);
      setTeacherUser(teacherData);
      setCurrentView('dashboard');
    }
  }, []);

  // Listen for teacher login modal trigger
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
      // Kullanıcı giriş yapmışsa upgrade modal aç
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
      // Giriş yapmamışsa login modal aç
      setShowStudentParentLoginModal(true);
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (teacherUser) return <TeacherDashboard />;
    if (!user) {
      console.log('No user, redirecting home');
      setTimeout(() => setCurrentView('home'), 0);
      return null;
    }
    if (user.isParentLogin) return <ParentDashboard />;
    return <StudentDashboard />;
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-white">
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
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
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
              <h4 className="font-semibold mb-3">Destek</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Yardım Merkezi</li>
                <li>İletişim</li>
                <li>Canlı Destek</li>
                <li>Videolar</li>
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

  return (
    <ErrorBoundary>
      {(currentView === 'home' && !teacherUser) && (
        <Navbar 
          user={user} 
          onStudentParentLogin={() => setShowStudentParentLoginModal(true)}
          onTeacherLogin={() => setShowTeacherLoginModal(true)}
          onLogout={handleLogout}
          onMenuToggle={() => {}}
        />
      )}
      
      {(currentView === 'home' && !teacherUser) ? renderHomePage() : renderDashboard()}
      
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

      {/* Upgrade Modal */}
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
    </ErrorBoundary>
  );
}

export default App;