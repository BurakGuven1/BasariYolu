import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { signUp, signIn, createProfile, createStudentRecord, createParentRecord, supabase } from '../lib/supabase';
import * as authApi from '../lib/authApi';
import ClassCodeLogin from './ClassCodeLogin';
import EmailVerificationScreen from './EmailVerificationScreen';
import { useToast } from '../contexts/ToastContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
  setUserState?: (userData: any) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin, setUserState }: LoginModalProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userType] = useState<'student' | 'parent'>('student');
  const [loading, setLoading] = useState(false);
  const [showClassCodeLogin, setShowClassCodeLogin] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
    grade: '',
    schoolName: '',
    phone: '',
    parentCode: '',
    parentPhone: '',
    classCode: ''
  });

  // Reset loading when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLoginMode) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleLogin = async () => {
  if (activeTab === 'parent') {
  if (!formData.parentCode.trim()) {
    toast.error('Lütfen davet kodunu girin');
    setLoading(false);
    return;
  }
  
  try {
    console.log('👨‍👩‍👧 Parent login started with code:', formData.parentCode.trim());
    
    // Find student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('invite_code', formData.parentCode.trim())
      .single();

    if (studentError || !student) {
      throw new Error('Geçersiz davet kodu');
    }

    console.log('✅ Student found:', student.id, student.profiles?.full_name);

    // Get all student data
    const [examResults, homeworks, studySessions, weeklyGoal] = await Promise.all([
      supabase.from('exam_results').select('*').eq('student_id', student.id).order('exam_date', { ascending: false }),
      supabase.from('homeworks').select('*').eq('student_id', student.id).order('due_date', { ascending: true }),
      supabase.from('study_sessions').select('*').eq('student_id', student.id).order('session_date', { ascending: false }),
      supabase.from('weekly_study_goals').select('*').eq('student_id', student.id).eq('is_active', true).maybeSingle()
    ]);

    console.log('📊 Data loaded:', {
      exams: examResults.data?.length || 0,
      homeworks: homeworks.data?.length || 0,
      sessions: studySessions.data?.length || 0,
      hasGoal: !!weeklyGoal.data
    });

    // Complete student object
    const completeStudent = {
      ...student,
      exam_results: examResults.data || [],
      homeworks: homeworks.data || [],
      study_sessions: studySessions.data || [],
      weekly_study_goal: weeklyGoal.data
    };

    // Parent user object
    const parentUser = {
      id: `parent_${student.id}_${Date.now()}`,
      email: `parent_${student.id}@temp.com`,
      userType: 'parent' as const,
      profile: {
        full_name: 'Veli',
        user_type: 'parent'
      },
      isParentLogin: true,
      connectedStudents: [completeStudent]
    };

    console.log('✅ Parent user created');

    // ✅ setUserState kullan
    if (setUserState) {
      console.log('✅ Using setUserState directly');
      setUserState(parentUser);
    } else {
      console.log('✅ Using onLogin callback');
      onLogin(parentUser);
    }
    
    // Reset form
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: '',
      grade: '',
      schoolName: '',
      parentCode: '',
      parentPhone: '',
      classCode: '',
      packageType: 'basic',
      billingCycle: 'monthly'
    });
    
    onClose();
  } catch (error: any) {
    console.error('❌ Parent login error:', error);
    toast.error('Veli girişi hatası: ' + (error.message || 'Bilinmeyen hata'));
  } finally {
    setLoading(false);
  }
  return;
}

    // Student login - Try Worker API first, fallback to Supabase
    try {
      let studentUser;

      // Try Worker API (HTTP-only cookies) if available
      try {
        console.log('🔐 Attempting secure login with Worker API (HTTP-only cookies)');
        const { user, access_token } = await authApi.login(formData.email, formData.password);

        if (user) {
          console.log('✅ Worker API login successful');
          studentUser = {
            id: user.id,
            email: user.email || '',
            userType: 'student' as const,
            profile: user.user_metadata || {},
            metadata: user.user_metadata || {},
          };
        }
      } catch (workerError: any) {
        console.warn('⚠️ Worker API unavailable, falling back to Supabase:', workerError.message);

        // Fallback to Supabase direct auth
        const { data, error } = await signIn(formData.email, formData.password);
        if (error) throw error;

        if (data.user) {
          console.log('✅ Supabase fallback login successful');
          studentUser = {
            id: data.user.id,
            email: data.user.email || '',
            userType: 'student' as const,
            profile: data.user.user_metadata || {},
            metadata: data.user.user_metadata || {},
          };
        }
      }

      if (studentUser) {
        // Verify user role before allowing login
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', studentUser.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          toast.error('Profil bilgisi alınamadı. Lütfen tekrar deneyin.');
          setLoading(false);
          return;
        }

        // Check if user role matches the login type
        const expectedRole = activeTab === 'parent' ? 'parent' : 'student';
        if (profile.role !== expectedRole) {
          // Sign out silently (security: don't reveal user role existence)
          await supabase.auth.signOut().catch(() => {});
          authApi.logout().catch(() => {});

          toast.error('E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.');
          setLoading(false);
          return;
        }

        onLogin(studentUser);
        onClose();
        // Reset form
        setFormData({
          email: '',
          password: '',
          name: '',
          confirmPassword: '',
          grade: '',
          schoolName: '',
          phone: '',
          parentCode: '',
          parentPhone: '',
          classCode: ''
        });
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast.error('Giriş hatası: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    if (userType === 'student' && (!formData.grade || !formData.schoolName)) {
      toast.error('Öğrenci için sınıf ve okul bilgisi gereklidir');
      setLoading(false);
      return;
    }

    // Validate phone number (Turkish format)
    if (userType === 'student' && formData.phone) {
      const phoneRegex = /^0[5][0-5][0-9]{8}$/;
      const cleanPhone = formData.phone.replace(/\s/g, ''); // Remove spaces

      if (!phoneRegex.test(cleanPhone)) {
        toast.error('Geçerli bir Türk cep telefonu numarası giriniz (örn: 05XX XXX XX XX)');
        setLoading(false);
        return;
      }
    }

    try {
      let classId = null;

      // If class code is provided, validate it first
      if (formData.classCode.trim()) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, status, current_students, student_capacity')
          .eq('invite_code', formData.classCode.trim().toUpperCase())
          .single();

        if (classError || !classData) {
          throw new Error('Geçersiz sınıf kodu');
        }

        if (classData.status !== 'active') {
          throw new Error('Sınıf aktif değil');
        }

        if (classData.current_students >= classData.student_capacity) {
          throw new Error('Sınıf kapasitesi dolu');
        }

        classId = classData.id;
      }

      // 1. Create auth user
      const { data: authData, error: authError } = await signUp(formData.email, formData.password);

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('User created:', authData.user.id);

        // Wait a moment for auth to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Create profile (WITHOUT package_type - no subscription)
        const profileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.name,
          role: userType
        };

        console.log('Creating profile:', profileData);
        const { error: profileError } = await createProfile(profileData);
        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        // 3. Create role-specific record
        if (userType === 'student') {
          const studentData = {
            user_id: authData.user.id,
            grade: parseInt(formData.grade),
            school_name: formData.schoolName,
            phone: formData.phone.replace(/\s/g, '') // Remove spaces from phone
          };
          console.log('Creating student:', studentData);
          const { error: studentError } = await createStudentRecord(studentData);
          if (studentError) {
            console.error('Student error:', studentError);
            throw studentError;
          }

          // If class code provided, join the class
          if (classId) {
            const { data: studentRecord } = await supabase
              .from('students')
              .select('id')
              .eq('user_id', authData.user.id)
              .single();

            if (studentRecord) {
              const { error: joinError } = await supabase
                .from('class_students')
                .insert([{
                  class_id: classId,
                  student_id: studentRecord.id,
                  status: 'active'
                }]);

              if (joinError) {
                console.error('Class join error:', joinError);
                // Don't fail registration, just warn
                toast.warning('Kayıt başarılı ancak sınıfa katılımda sorun oluştu. Daha sonra tekrar deneyebilirsiniz.');
              }
            }
          }
        } else {
          const parentData = {
            user_id: authData.user.id
          };
          console.log('Creating parent:', parentData);
          const { error: parentError } = await createParentRecord(parentData);
          if (parentError) {
            console.error('Parent error:', parentError);
            throw parentError;
          }
        }

        // Show email verification screen instead of logging in
        setRegisteredEmail(formData.email);
        setShowEmailVerification(true);

        // Reset form
        setFormData({
          email: '',
          password: '',
          name: '',
          confirmPassword: '',
          grade: '',
          schoolName: '',
          phone: '',
          parentCode: '',
          parentPhone: '',
          classCode: ''
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle specific error cases
      if (error.message?.includes('security purposes') || error.status === 429) {
        toast.error('Çok fazla deneme yaptınız. Lütfen bir dakika bekleyip tekrar deneyin.', 8000);
      } else if (error.message?.includes('User already registered')) {
        toast.error('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
      } else if (error.message?.includes('Invalid email')) {
        toast.error('Geçersiz e-posta adresi. Lütfen kontrol edin.');
      } else if (error.message?.includes('Password')) {
        toast.error('Şifre en az 6 karakter olmalıdır.');
      } else {
        toast.error('Hesap oluşturma hatası: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'student'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Öğrenci
              </button>
              <button
                onClick={() => setActiveTab('parent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'parent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Veli
              </button>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'parent' ? 'Veli Girişi' : (isLoginMode ? 'Öğrenci Girişi' : 'Öğrenci Kaydı')}
          </h2>
          <p className="text-gray-600 mt-2">
            {activeTab === 'parent' 
              ? 'Öğrencinizden aldığınız davet kodu ile giriş yapın'
              : (isLoginMode ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun')
            }
          </p>
        </div>
        <div className="mb-4">
          <button
            onClick={() => setShowClassCodeLogin(true)}
            className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Sınıf Kodu ile Giriş
          </button>
        </div>
        {activeTab === 'parent' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Davet Kodu
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="parentCode"
                  value={formData.parentCode}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Öğrencinizden aldığınız kodu girin"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon Numarası
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0 507 XXX XX XX"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Telefon numaranızı 0 507 XXX XX XX formatında girin
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Giriş yapılıyor...
                </div>
              ) : (
                'Veli Girişi Yap'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adınızı ve soyadınızı giriniz"
                    required
                  />
                </div>
              </div>
            )}

            {!isLoginMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sınıf
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleSelectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sınıf seçin</option>
                    <option value="5">5. Sınıf</option>
                    <option value="6">6. Sınıf</option>
                    <option value="7">7. Sınıf</option>
                    <option value="8">8. Sınıf</option>
                    <option value="9">9. Sınıf</option>
                    <option value="10">10. Sınıf</option>
                    <option value="11">11. Sınıf</option>
                    <option value="12">12. Sınıf</option>
                    <option value="13">Mezun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Okul Adı
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Okul adınızı giriniz"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon Numarası
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="05XX XXX XX XX"
                      pattern="[0][5][0-5][0-9]{8}"
                      maxLength={11}
                      inputMode="tel"
                      autoComplete="tel"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sınıf Kodu (Opsiyonel)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      name="classCode"
                      value={formData.classCode}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center"
                      placeholder="645A-A006-208D (Opsiyonel)"
                      maxLength={14}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Öğretmeninizden aldığınız sınıf kodunu girebilirsiniz
                  </p>
                </div>
              </>
            )}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                  required
                  autoComplete="username"
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
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şifrenizi giriniz"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {isLoginMode && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.email) {
                      toast.error('Lütfen e-posta adresinizi girin');
                      return;
                    }
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                        redirectTo: `${window.location.origin}/auth/reset-password`,
                      });
                      if (error) throw error;
                      toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
                    } catch (error: any) {
                      toast.error('Şifre sıfırlama hatası: ' + (error.message || 'Bilinmeyen hata'));
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Şifremi unuttum
                </button>
              </div>
            )}

            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Şifrenizi tekrar giriniz"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLoginMode ? 'Giriş yapılıyor...' : 'Kayıt olunuyor...'}
                </div>
              ) : (
                isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'
              )}
            </button>
          </form>
        )}

        {activeTab === 'student' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isLoginMode ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>
        )}

        {isLoginMode && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm font-medium mb-2">İletişim</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>destek@basariyolum.com</p>
            </div>
          </div>
        )}
      </div>
      <ClassCodeLogin
        isOpen={showClassCodeLogin}
        onClose={() => setShowClassCodeLogin(false)}
        onSuccess={(data) => {
          onLogin(data);
          if (setUserState && data?.isParentLogin) {
            setUserState(data);
          }
          setShowClassCodeLogin(false);
          onClose();
        }}
      />
      {showEmailVerification && (
        <EmailVerificationScreen
          email={registeredEmail}
          onClose={() => {
            setShowEmailVerification(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
