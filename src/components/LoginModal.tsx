import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { signUp, signIn, createProfile, createStudentRecord, createParentRecord, supabase } from '../lib/supabase';
import PaymentPage from './PaymentPage';
import ClassCodeLogin from './ClassCodeLogin';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (userData: any) => void;
  setUserState?: (userData: any) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin, setUserState }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [userType] = useState<'student' | 'parent'>('student');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showClassCodeLogin, setShowClassCodeLogin] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [formData, setFormData] = useState({
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

  const packages = [
    {
      id: 'basic',
      name: 'Temel Paket',
      monthlyPrice: 219.99,
      yearlyPrice: 1999.99,
      features: ['Temel özellikler', 'Sınırlı içerik', 'E-posta desteği']
    },
    {
      id: 'advanced',
      name: 'Gelişmiş Paket',
      monthlyPrice: 319.99,
      yearlyPrice: 2599.99,
      features: ['Gelişmiş özellikler', 'Tam içerik', 'Yapay Zeka Desteği','Öncelikli destek','Analitik raporlar']
    },
    {
      id: 'professional',
      name: 'Profesyonel Paket',
      monthlyPrice: 499.99,
      yearlyPrice: 3499.99,
      features: ['Tüm özellikler', 'Sınırsız içerik','Yapay Zeka Desteği','Öncelikli destek','Çıkmış Soruların Analizi', 'Detaylı analitik raporlar']
    }
  ];

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
    alert('Lütfen davet kodunu girin');
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
      profile: {
        full_name: 'Veli',
        user_type: 'parent'
      },
      isParentLogin: true,
      connectedStudents: [completeStudent]
    };

    console.log('✅ Parent user created');

    // Save to localStorage
    localStorage.setItem('tempParentUser', JSON.stringify(parentUser));
    
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
    alert('Veli girişi hatası: ' + (error.message || 'Bilinmeyen hata'));
  } finally {
    setLoading(false);
  }
  return;
}

    // Student login
    try {
      const { data, error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      
      if (data.user) {
        onLogin(data.user);
        onClose();
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
      }
    } catch (error: any) {
      console.error('Login error:', error);
      alert('Giriş hatası: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    if (userType === 'student' && (!formData.grade || !formData.schoolName)) {
      alert('Öğrenci için sınıf ve okul bilgisi gereklidir');
      setLoading(false);
      return;
    }

    if (userType === 'student' && (!formData.packageType || !formData.billingCycle)) {
      alert('Lütfen paket seçimi yapın');
      setLoading(false);
      return;
    }

    // Store registration data and show payment page
    setRegistrationData({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      grade: formData.grade,
      schoolName: formData.schoolName,
      packageType: formData.packageType,
      billingCycle: formData.billingCycle,
      classCode: formData.classCode
    });
    setShowPayment(true);
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      let classId = null;
      
      // If class code is provided, validate it first
      if (registrationData.classCode.trim()) {
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .select('id, status, current_students, student_capacity')
          .eq('invite_code', registrationData.classCode.trim().toUpperCase())
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
      const { data: authData, error: authError } = await signUp(registrationData.email, registrationData.password);
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (authData.user) {
        console.log('User created:', authData.user.id);
        
        // Wait a moment for auth to settle
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. Create profile
        const profileData = {
          id: authData.user.id,
          email: registrationData.email,
          full_name: registrationData.name,
          role: userType,
          package_type: registrationData.packageType
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
            grade: parseInt(registrationData.grade),
            school_name: registrationData.schoolName
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
                alert('Kayıt başarılı ancak sınıfa katılımda sorun oluştu. Daha sonra tekrar deneyebilirsiniz.');
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
        
        onLogin(authData.user);
        
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
        
        setShowPayment(false);
        onClose();
        alert('Ödeme başarılı! Hesabınız aktifleştirildi. Hoş geldiniz!');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      alert('Hesap oluşturma hatası: ' + (error.message || 'Bilinmeyen hata'));
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paket Seçimi *
                </label>
                <select
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Paket seçin</option>
                  <option value="basic">Temel Paket - 219.99₺/ay</option>
                  <option value="advanced">Gelişmiş Paket - 319.99₺/ay</option>
                  <option value="professional">Profesyonel Paket - 499.99₺/ay</option>
                </select>
              </div>
            )}

            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ödeme Döngüsü *
                </label>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Ödeme döngüsü seçin</option>
                  <option value="monthly">Aylık Ödeme</option>
                  <option value="yearly">Yıllık Ödeme (%33 İndirimli✨)</option>
                </select>
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
                    required
                  />
                </div>
              </div>
            )}

            {!isLoginMode && formData.packageType && formData.billingCycle && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Seçilen Paket Detayları</h4>
                {(() => {
      const selectedPkg = packages.find(pkg => pkg.id === formData.packageType);
      if (!selectedPkg) return null;
      
      const currentPrice = formData.billingCycle === 'monthly' ? selectedPkg.monthlyPrice : selectedPkg.yearlyPrice;
      const monthlyEquivalent = formData.billingCycle === 'yearly' ? selectedPkg.yearlyPrice / 12 : selectedPkg.monthlyPrice;
      
      // DÜZELTİLMİŞ HESAPLAMALAR:
      const savings = formData.billingCycle === 'yearly' 
        ? (selectedPkg.monthlyPrice * 12) - selectedPkg.yearlyPrice 
        : 0;
      
      // 10'un katlarına yukarı yuvarla ve kuruşları kaldır
      const roundedSavings = Math.ceil(savings / 10) * 10;
      
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-900">{selectedPkg.name}</span>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">
                            {currentPrice.toFixed(0)}₺
                          </div>
                          <div className="text-sm text-blue-700">
                            {formData.billingCycle === 'yearly' ? '/yıl' : '/ay'}
                          </div>
                          {formData.billingCycle === 'yearly' && (
                            <div className="text-xs text-green-600">
                              Aylık {monthlyEquivalent.toFixed(0)}₺'ye denk geliyor
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {savings > 0 && (
                        <div className="bg-green-100 p-2 rounded text-center">
                          <div className="text-green-800 font-semibold">
                            🎉 {roundedSavings.toFixed(0)}₺ Tasarruf!
                          </div>
                          <div className="text-green-700 text-xs">
                            Aylık ödemeye göre yıllık %{Math.round((savings / (selectedPkg.monthlyPrice * 12)) * 100)} indirim
                          </div>
                        </div>
                      )}
                      
                      <div className="border-t border-blue-200 pt-3">
                        <div className="text-sm text-blue-800 font-medium mb-2">Paket Avantajları:</div>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {selectedPkg.features.slice(0, 4).map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-600 mr-1">✓</span>
                              {feature}
                            </li>
                          ))}
                          {selectedPkg.features.length > 4 && (
                            <li className="text-blue-600 font-medium">
                              +{selectedPkg.features.length - 4} özellik daha...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
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
          if (setUserState) {
            setUserState(data);
          }
          setShowClassCodeLogin(false);
          onClose();
        }}
      />
      {/* Payment Page */}
    {registrationData && (
      <PaymentPage
        isOpen={showPayment}
        onClose={() => {
          setShowPayment(false);
          setRegistrationData(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
        registrationData={registrationData}
      />
    )}
    </div>
  );
}