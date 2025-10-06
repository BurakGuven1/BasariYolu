import React from 'react';
import { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { packages } from './data/packages';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import PricingSection from './components/PricingSection';
import TeacherSection from './components/TeacherSection';
import LoginModal from './components/LoginModal';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import ExamTopicsSection from './components/ExamTopicsSection';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import ClassDashboard from './components/ClassDashboard';

function App() {
  const { user, loading, setParentUser, clearUser } = useAuth();
  const [showStudentParentLoginModal, setShowStudentParentLoginModal] = useState(false);
  const [showTeacherLoginModal, setShowTeacherLoginModal] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [teacherUser, setTeacherUser] = useState<any>(null);
  const [hasClassViewerSession, setHasClassViewerSession] = useState(false);

  // Check for teacher session on load
  React.useEffect(() => {
    const teacherSession = localStorage.getItem('teacherSession');
    const classViewerSession = localStorage.getItem('classViewerSession');
    
    // Update class viewer session state
    setHasClassViewerSession(!!classViewerSession);
    
    if (teacherSession) {
      const teacherData = JSON.parse(teacherSession);
      console.log('Teacher session found:', teacherData);
      setTeacherUser(teacherData);
      setCurrentView('dashboard'); // This should trigger dashboard view
    } else if (classViewerSession) {
      const classData = JSON.parse(classViewerSession);
      console.log('Class viewer session found:', classData);
      // Handle class viewer session - could redirect to class view
      // For now, we'll stay on home page but with access to premium features
    }
  }, []);

  // Listen for teacher login modal trigger
  React.useEffect(() => {
    const handleOpenTeacherLogin = () => {
      setShowTeacherLoginModal(true);
    };
    
    window.addEventListener('openTeacherLogin', handleOpenTeacherLogin);
    return () => window.removeEventListener('openTeacherLogin', handleOpenTeacherLogin);
  }, []);

  const handleLogin = (loginUser?: any) => {
    console.log('handleLogin called');
    
    // If a user object is passed (parent login), set it
    if (loginUser && loginUser.isParentLogin) {
      setParentUser(loginUser);
    }
    
    setCurrentView('dashboard');
    setShowStudentParentLoginModal(false);
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
      const price = billingCycle === 'monthly' ? selectedPackage?.monthlyPrice : selectedPackage?.yearlyPrice;
      alert(`${selectedPackage?.name} (${billingCycle === 'monthly' ? 'Aylık' : 'Yıllık'}) - ${price}₺ seçildi! Ödeme sayfasına yönlendiriliyorsunuz...`);
    } else {
      setShowStudentParentLoginModal(true);
    }
  };

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
    // If teacher is logged in, show teacher dashboard
    if (teacherUser) {
      console.log('Rendering teacher dashboard for:', teacherUser);
      return <TeacherDashboard />;
    }
    
    if (!user) {
      console.log('No user in renderDashboard, redirecting to home');
      setCurrentView('home');
      return null;
    }
    
    console.log('Rendering dashboard for user:', user.id);
    
    // Check if this is a parent login
    if (user.isParentLogin) {
      return <ParentDashboard />;
    }
    
    return <StudentDashboard />;
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-white">
      <Hero onGetStarted={handleGetStarted} />
      <Features />
      <PricingSection onSelectPackage={handleSelectPackage} />
      <ExamTopicsSection 
        user={user} 
        hasClassViewerSession={hasClassViewerSession}
        onUpgrade={() => setShowStudentParentLoginModal(true)}
      />
      <TeacherSection />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">EduTracker</h3>
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
                info@edutracker.com<br />
                0850 123 45 67<br />
                7/24 Canlı Destek
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 EduTracker. Tüm hakları saklıdır.</p>
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
          onMenuToggle={() => {}}
        />
      )}
      
      {(currentView === 'home' && !teacherUser) ? renderHomePage() : renderDashboard()}
      
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
          setTeacherUser(teacher);
          setCurrentView('dashboard');
          console.log('Teacher login success, setting view to dashboard');
        }}
      />
    </ErrorBoundary>
  );
}

export default App;