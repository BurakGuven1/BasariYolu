import React, { useState } from 'react';
import { X, Mail, Lock, GraduationCap, Eye, EyeOff, Users } from 'lucide-react';
import { loginTeacher } from '../lib/teacherApi';
import { joinClassWithCode } from '../lib/teacherApi';
import { supabase } from '../lib/supabase';

interface TeacherLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacher: any) => void;
}

export default function TeacherLogin({ isOpen, onClose, onSuccess }: TeacherLoginProps) {
  const [loginType, setLoginType] = useState<'teacher' | 'class'>('teacher');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    classCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: teacher } = await loginTeacher(formData.email, formData.password);
      
      // Store teacher session (simple approach for now)
      localStorage.setItem('teacherSession', JSON.stringify({
        id: teacher.id,
        email: teacher.email,
        full_name: teacher.full_name,
        school_name: teacher.school_name,
        loginTime: new Date().toISOString()
      }));

      onSuccess(teacher);
      onClose();
      
      // Reset form
      setFormData({ email: '', password: '', classCode: '' });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Find class by invite code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          teachers(*),
          class_students(
            *,
            students(
              *,
              profiles(*)
            )
          ),
          class_assignments(*),
          class_announcements(*),
          class_exams(*)
        `)
        .eq('invite_code', formData.classCode.toUpperCase())
        .single();

      if (classError || !classData) {
        throw new Error('Geçersiz sınıf kodu');
      }

      if (classData.status !== 'active') {
        throw new Error('Sınıf aktif değil');
      }

      // Create a class viewer session
      const classSession = {
        type: 'class_viewer',
        class: classData,
        loginTime: new Date().toISOString()
      };

      localStorage.setItem('classViewerSession', JSON.stringify(classSession));
      
      // Redirect to class view
      window.location.href = `/#class-${classData.id}`;
      window.location.reload();
      
      onClose();
      setFormData({ email: '', password: '', classCode: '' });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Öğretmen Girişi</h2>
          <p className="text-gray-600 mt-2">
            Sınıfınızı yönetmek için giriş yapın
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Giriş yapılıyor...
                </div>
              ) : (
                'Öğretmen Girişi'
              )}
            </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <button
              onClick={() => {
                onClose();
                // Trigger teacher registration modal
                const event = new CustomEvent('openTeacherRegistration');
                window.dispatchEvent(event);
              }}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Öğretmen Kaydı
            </button>
          </p>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 text-sm font-medium mb-2">Demo Hesabı:</p>
          <div className="text-xs text-green-700 space-y-1">
            <p>Email: demo@ogretmen.com</p>
            <p>Şifre: Demo123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}