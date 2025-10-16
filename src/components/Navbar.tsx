import { useState } from 'react';
import { User, Bell, Menu, X, Package, GraduationCap, Goal, Book } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  user?: any;
  onStudentParentLogin: () => void;
  onTeacherLogin: () => void;
  onLogout: () => void;
  onMenuToggle: () => void;
  onNavigateToBlog?: () => void; // ✅ Ekle
  onNavigateHome?: () => void; // ✅ Ekle
}

export default function Navbar({ 
  user, 
  onStudentParentLogin, 
  onTeacherLogin, 
  onLogout,
  onNavigateToBlog,
  onNavigateHome
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = '/';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    // ✅ Blog handling
    if (sectionId === 'blog') {
      if (onNavigateToBlog) {
        onNavigateToBlog();
      }
      setIsMobileMenuOpen(false);
      return;
    }

    // Home page sections
    if (onNavigateHome && window.location.pathname !== '/') {
      onNavigateHome();
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'pricing', label: 'Paketler', icon: Package },
    { id: 'exam-topics', label: 'TYT-AYT Çıkmış Konular', icon: Goal },
    { id: 'teacher', label: 'Öğretmenler', icon: GraduationCap },
    { id: 'blog', label: 'Blog', icon: Book },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center">
            <Logo 
              size="medium" 
              showText={true}
              onClick={handleLogoClick}
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold flex items-center space-x-1"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user && user.id ? (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  className="text-gray-600 dark:text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                  aria-label="Bildirimler"
                >
                  <Bell className="h-6 w-6" />
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {user.name || user.email || 'Kullanıcı'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition-colors hover:border-red-500 hover:text-red-600 dark:hover:text-red-400"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={onStudentParentLogin}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Öğrenci/Veli Girişi
                </button>
                <button
                  onClick={onTeacherLogin}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  Öğretmen/Sınıf Girişi
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full text-left px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors font-bold flex items-center space-x-2"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}

              {user && user.id ? (
                <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 mt-2 space-y-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">
                      {user.name || user.email || 'Kullanıcı'}
                    </span>
                  </div>

                  <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                    <Bell className="h-5 w-5" />
                    <span className="font-bold">Bildirimler</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-bold"
                  >
                    Çıkış Yap
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 mt-2 space-y-2">
                  <button
                    onClick={() => {
                      onStudentParentLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold"
                  >
                    Öğrenci/Veli Girişi
                  </button>
                  <button
                    onClick={() => {
                      onTeacherLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-bold"
                  >
                    Öğretmen/Sınıf Girişi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}