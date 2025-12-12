import { useState } from 'react';
import { User, Menu, X, Package, GraduationCap, Goal, Book, Sparkles, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

interface NavbarProps {
  user?: any;
  onStudentParentLogin: () => void;
  onTeacherLogin: () => void;
  onInstitutionLogin?: () => void;
  onInstitutionStudentAccess?: () => void;
  onLogout: () => void;
  onMenuToggle: () => void;
  onNavigateToBlog?: () => void;
  onNavigateHome?: () => void;
  onNavigateToQuestionBank?: () => void;
}

const ACTION_BASE = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-95';

export default function Navbar({
  onStudentParentLogin,
  onTeacherLogin,
  onInstitutionLogin,
  onInstitutionStudentAccess,
  onMenuToggle,
  onNavigateToBlog,
  onNavigateHome,
  onNavigateToQuestionBank
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    if (onNavigateHome) {
      onNavigateHome();
      return;
    }

    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = '/';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      onMenuToggle?.();
      return next;
    });
  };

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'question-bank') {
      onNavigateToQuestionBank?.();
      setIsMobileMenuOpen(false);
      return;
    }

    if (sectionId === 'blog') {
      onNavigateToBlog?.();
      setIsMobileMenuOpen(false);
      return;
    }

    if (onNavigateHome && window.location.pathname !== '/') {
      onNavigateHome();
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }

    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'features', label: 'Özellikler', icon: Sparkles, isRoute: true },
    { id: 'coaching', label: 'Koçluk', icon: Award, isRoute: true },
    { id: 'pricing', label: 'Paketler', icon: Package },
    { id: 'exam-topics', label: 'ÖSYM-MEB Çıkmış Konular', icon: Goal },
    { id: 'blog', label: 'Blog', icon: Book },
  ];


  const renderDesktopActions = () => {
    return (
      <div className="flex items-center gap-2.5">
        <button
          onClick={onStudentParentLogin}
          className={`${ACTION_BASE} border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100`}
        >
          Öğrenci/Veli
        </button>
        <button
          onClick={onTeacherLogin}
          className={`${ACTION_BASE} border-emerald-200 bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-100`}
        >
          Öğretmen
        </button>
        {onInstitutionLogin && (
          <button
            onClick={onInstitutionLogin}
            className={`${ACTION_BASE} border-indigo-200 bg-indigo-50 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-100`}
          >
            Kurum
          </button>
        )}
        {onInstitutionStudentAccess && (
          <button
            onClick={onInstitutionStudentAccess}
            className={`${ACTION_BASE} border-purple-200 bg-purple-50 text-purple-600 hover:border-purple-300 hover:bg-purple-100`}
          >
            Kurum/Öğrenci
          </button>
        )}
      </div>
    );
  };

  const renderMobileActions = () => {
    return (
      <div className="mt-4 space-y-2.5 border-t border-gray-200 pt-4 dark:border-gray-700">
        <button
          onClick={() => {
            onStudentParentLogin();
            setIsMobileMenuOpen(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98]"
        >
          <User className="h-5 w-5" />
          Öğrenci/Veli Girişi
        </button>
        
        <button
          onClick={() => {
            onTeacherLogin();
            setIsMobileMenuOpen(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 transition-all hover:border-emerald-300 hover:bg-emerald-100 active:scale-[0.98]"
        >
          <GraduationCap className="h-5 w-5" />
          Öğretmen Girişi
        </button>
        
        {onInstitutionLogin && (
          <button
            onClick={() => {
              onInstitutionLogin();
              setIsMobileMenuOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition-all hover:border-indigo-300 hover:bg-indigo-100 active:scale-[0.98]"
          >
            Kurum Girişi
          </button>
        )}
        
        {onInstitutionStudentAccess && (
          <button
            onClick={() => {
              onInstitutionStudentAccess();
              setIsMobileMenuOpen(false);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-600 transition-all hover:border-purple-300 hover:bg-purple-100 active:scale-[0.98]"
          >
            Kurum/Öğrenci Girişi
          </button>
        )}
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex h-16 sm:h-18 md:h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo size="medium" showText={false} onClick={handleLogoClick} />
          <button
            onClick={handleLogoClick}
            className="text-lg sm:text-xl font-bold text-gray-900 transition-colors hover:text-blue-600 dark:text-white"
          >
            BaşarıYolu
          </button>
        </div>

        {/* Desktop Navigation - Hidden on mobile/tablet */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
          {navItems.map((item) => {
            const content = (
              <>
                <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="relative">
                  {item.label}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-blue-600 transition-all group-hover:w-full"></span>
                </span>
              </>
            );

            if (item.isRoute) {
              return (
                <Link
                  key={item.id}
                  to={`/${item.id}`}
                  className="group flex items-center gap-2 text-sm font-semibold text-gray-600 transition-all hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="group flex items-center gap-2 text-sm font-semibold text-gray-600 transition-all hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
              >
                {content}
              </button>
            );
          })}
        </div>

        {/* Desktop Actions - Hidden on mobile/tablet */}
        <div className="hidden lg:flex items-center">{renderDesktopActions()}</div>

        {/* Mobile/Tablet Menu Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label={isMobileMenuOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-5 pt-3 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <div className="space-y-1">
            {navItems.map((item) => {
              const mobileContent = (
                <>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </>
              );

              if (item.isRoute) {
                return (
                  <Link
                    key={item.id}
                    to={`/${item.id}`}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {mobileContent}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98] dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                >
                  {mobileContent}
                </button>
              );
            })}
          </div>
          {renderMobileActions()}
        </div>
      )}
    </nav>
  );
}
