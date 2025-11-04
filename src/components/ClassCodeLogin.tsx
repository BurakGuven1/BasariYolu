import React, { useState } from 'react';
import { X, Users, CheckCircle, AlertCircle, User, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClassCodeLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export default function ClassCodeLogin({ isOpen, onClose, onSuccess }: ClassCodeLoginProps) {
  const [step, setStep] = useState<'code' | 'registration'>('code');
  const [classCode, setClassCode] = useState('');
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirm: '',
    grade: 9,
    school_name: ''
  });

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sınıf kodunu doğrula
      const { data, error: codeError } = await supabase
        .from('classes')
        .select(`
          *,
          teacher:teachers(
            id,
            full_name,
            email,
            school_name
          )
        `)
        .eq('invite_code', classCode.trim().toUpperCase())
        .eq('status', 'active')
        .single();

      if (codeError || !data) {
        throw new Error('Geçersiz veya aktif olmayan sınıf kodu');
      }

      // Sınıf dolu mu kontrol et
      if (data.current_students >= data.student_capacity) {
        throw new Error('Sınıf dolu! Öğretmeninizle iletişime geçin.');
      }

      setClassData(data);
      setStep('registration');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasyon
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth ile kayıt ol
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Kayıt başarısız');

      // 2. Profile oluştur
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: 'student',
          package_type: 'basic' // Sınıf öğrencisi için temel
        });

      if (profileError) throw profileError;

      // 3. Student kaydı oluştur
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          grade: formData.grade,
          school_name: formData.school_name || classData.teacher.school_name || 'Belirtilmedi',
          profile_id: authData.user.id
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // 4. Sınıfa ekle
      const { error: classJoinError } = await supabase
        .from('class_students')
        .insert({
          class_id: classData.id,
          student_id: studentData.id,
          status: 'active'
        });

      if (classJoinError) throw classJoinError;

      // 5. Session bilgilerini kaydet
      localStorage.setItem('classViewerSession', JSON.stringify({
        classId: classData.id,
        className: classData.class_name,
        teacherName: classData.teacher.full_name,
        isClassStudent: true
      }));

      // 6. Başarılı giriş
      onSuccess({
        id: studentData.id,
        user_id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        grade: formData.grade,
        school_name: formData.school_name,
        isClassStudent: true,
        classId: classData.id,
        className: classData.class_name
      });

      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {step === 'code' ? 'Sınıf Kodunu Gir' : 'Kayıt Ol'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* STEP 1: Sınıf Kodu Girişi */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sınıfına Katıl
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Öğretmeninden aldığın sınıf kodunu girerek hemen başla
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sınıf Kodu *
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white uppercase"
                  placeholder="AB1D-12C4-E5GH"
                  maxLength={15}
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Öğretmeninden aldığın 12 haneli kodu gir
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || classCode.length < 3}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Doğrulanıyor...
                  </span>
                ) : (
                  'Devam Et'
                )}
              </button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p>Sınıf kodun yok mu?</p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Burada normal login modalını açabilirsiniz
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Bireysel Üyelik Al
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Kayıt Formu */}
          {step === 'registration' && classData && (
            <form onSubmit={handleRegisterAndJoin} className="space-y-4">
              {/* Sınıf Bilgisi */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800 dark:text-green-200">
                    Sınıf Bulundu!
                  </span>
                </div>
                <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <p><strong>Sınıf:</strong> {classData.class_name}</p>
                  <p><strong>Öğretmen:</strong> {classData.teacher.full_name}</p>
                  <p><strong>Okul:</strong> {classData.teacher.school_name || 'Belirtilmemiş'}</p>
                  <p><strong>Kontenjan:</strong> {classData.current_students}/{classData.student_capacity}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Ad Soyad *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  E-posta *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sınıf *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    {[5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                      <option key={grade} value={grade}>{grade}. Sınıf</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Okul
                  </label>
                  <input
                    type="text"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="İsteğe bağlı"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Şifre * (min 6 karakter)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Şifre Tekrar *
                </label>
                <input
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep('code');
                    setError('');
                  }}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={loading}
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Sınıfa Katıl'}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Kaydolarak{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Kullanım Şartları
                </a>{' '}
                ve{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Gizlilik Politikası
                </a>
                'nı kabul etmiş olursunuz.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}