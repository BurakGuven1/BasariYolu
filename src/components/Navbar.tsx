import React, { useState } from 'react';
import { BookOpen, User, Bell, Menu, X, Home, Package, BarChart3, GraduationCap } from 'lucide-react';

interface NavbarProps {
  user?: any;
  onStudentParentLogin: () => void;
  onTeacherLogin: () => void;
  onMenuToggle: () => void;
}

export default function Navbar({ user, onStudentParentLogin, onTeacherLogin, onMenuToggle }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const navItems = [
    { id: 'features', label: 'Özellikler', icon: Home },
    { id: 'pricing', label: 'Paketler', icon: Package },
    { id: 'exam-topics', label: 'TYT-AYT Çıkmış Konular', icon: BarChart3 },
    { id: 'teacher', label: 'Öğretmenler', icon: GraduationCap },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">EduTracker</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-gray-700 hover:text-blue-600 transition-colors font-bold flex items-center space-x-1"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-blue-600" />
                <div className="flex items-center space-x-2">
                  <User className="h-6 w-6 text-gray-600" />
                  <span className="text-sm text-gray-700 font-bold">{user.name}</span>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={onStudentParentLogin}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold"
                >
                  Öğrenci/Veli Girişi
                </button>
                <button
                  onClick={onTeacherLogin}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs font-bold"
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
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
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
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              {/* Navigation Items */}
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-bold flex items-center space-x-2"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Mobile Auth Buttons */}
              {user ? (
                <div className="px-3 py-2 border-t border-gray-200 mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700 font-bold">{user.name}</span>
                  </div>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <Bell className="h-5 w-5" />
                    <span className="font-bold">Bildirimler</span>
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 border-t border-gray-200 mt-2 space-y-2">
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