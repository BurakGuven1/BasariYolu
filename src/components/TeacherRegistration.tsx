import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, School, GraduationCap, Users, Calculator } from 'lucide-react';
import { registerTeacher } from '../lib/teacherApi';
import { PACKAGE_OPTIONS, calculateClassPrice } from '../types/teacher';
import TeacherPaymentPage from './TeacherPaymentPage';

interface TeacherRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeacherRegistration({ isOpen, onClose, onSuccess }: TeacherRegistrationProps) {
  const [currentStep, setCurrentStep] = useState<'info' | 'class' | 'payment'>('info');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    school_name: '',
    class_name: '',
    class_description: '',
    student_capacity: 30,
    package_type: '9_months' as 'monthly' | '3_months' | '9_months'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateInfoForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Geçerli bir email adresi girin';
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Şifre en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    // Name validation
    if (formData.full_name.length < 2) {
      newErrors.full_name = 'Ad soyad en az 2 karakter olmalıdır';
    }

    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Telefon numarası 10 haneli olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateClassForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.class_name.length < 3 || formData.class_name.length > 50) {
      newErrors.class_name = 'Sınıf adı 3-50 karakter arasında olmalıdır';
    }

    if (formData.student_capacity < 5 || formData.student_capacity > 40) {
      newErrors.student_capacity = 'Sınıf kapasitesi 5-40 öğrenci arasında olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInfoForm()) return;
    setCurrentStep('class');
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateClassForm()) return;
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      // Create teacher account
      await registerTeacher({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone.replace(/\D/g, ''),
        school_name: formData.school_name || undefined
      });

      alert('Öğretmen kaydı ve ödeme başarılı! Artık giriş yapabilirsiniz.');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        phone: '',
        school_name: '',
        class_name: '',
        class_description: '',
        student_capacity: 30,
        package_type: '9_months'
      });
      setErrors({});
      setCurrentStep('info');
    } catch (error: any) {
      alert('Kayıt hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'class') {
      setCurrentStep('info');
    } else if (currentStep === 'payment') {
      setCurrentStep('class');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const pricing = calculateClassPrice(formData.student_capacity, formData.package_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          {/* Progress Steps */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'info' ? 'bg-blue-600 text-white' : 
                currentStep === 'class' || currentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-8 h-1 ${currentStep === 'class' || currentStep === 'payment' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'class' ? 'bg-blue-600 text-white' : 
                currentStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-8 h-1 ${currentStep === 'payment' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>
          
          <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentStep === 'info' && 'Öğretmen Bilgileri'}
            {currentStep === 'class' && 'Sınıf Bilgileri'}
            {currentStep === 'payment' && 'Ödeme'}
          </h2>
          <p className="text-gray-600 mt-2">
            {currentStep === 'info' && 'Kişisel bilgilerinizi girin'}
            {currentStep === 'class' && 'İlk sınıfınızı oluşturun'}
            {currentStep === 'payment' && 'Ödeme yapın ve hesabınızı aktifleştirin'}
          </p>
        </div>

        {currentStep === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Adınızı ve soyadınızı girin"
                  required
                />
              </div>
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="5XX XXX XX XX"
                  required
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Okul Adı (Opsiyonel)
              </label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Çalıştığınız okul"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre Tekrar *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Devam Et
            </button>
          </form>
        )}

        {currentStep === 'class' && (
          <form onSubmit={handleClassSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sınıf Adı *
              </label>
              <input
                type="text"
                name="class_name"
                value={formData.class_name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.class_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Örn: 12-A TYT Hazırlık"
                required
              />
              {errors.class_name && <p className="text-red-500 text-xs mt-1">{errors.class_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sınıf Açıklaması (Opsiyonel)
              </label>
              <textarea
                name="class_description"
                value={formData.class_description}
                onChange={(e) => setFormData(prev => ({ ...prev, class_description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Sınıf hakkında kısa açıklama"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Öğrenci Kapasitesi: {formData.student_capacity}
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={formData.student_capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, student_capacity: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 öğrenci</span>
                <span>40 öğrenci</span>
              </div>
              {errors.student_capacity && <p className="text-red-500 text-xs mt-1">{errors.student_capacity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paket Seçimi *
              </label>
              <div className="space-y-2">
                {PACKAGE_OPTIONS.map((pkg) => (
                  <button
                    key={pkg.type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, package_type: pkg.type }))}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      formData.package_type === pkg.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{pkg.name}</span>
                        {pkg.popular && (
                          <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            En Popüler
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{pkg.price_per_student}₺/öğrenci/ay</div>
                        {pkg.discount_percent > 0 && (
                          <div className="text-green-600 text-sm">%{pkg.discount_percent} indirim</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Calculator */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Maliyet Hesabı</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Öğrenci Sayısı:</span>
                  <span className="font-semibold">{formData.student_capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Öğrenci Başı Aylık:</span>
                  <span className="font-semibold">{pricing.pricePerStudent}₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Süre:</span>
                  <span className="font-semibold">{pricing.duration} ay</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-base">
                  <span>Aylık Toplam:</span>
                  <span className="font-bold text-blue-600">{pricing.monthlyPrice.toLocaleString()}₺</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Toplam Tutar:</span>
                  <span className="font-bold text-green-600">{pricing.totalPrice.toLocaleString()}₺</span>
                </div>
                {pricing.savings > 0 && (
                  <div className="bg-green-100 p-2 rounded text-center">
                    <div className="text-green-800 font-semibold text-sm">
                      Tasarruf: {pricing.savings.toLocaleString()}₺
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Ödemeye Geç
              </button>
            </div>
          </form>
        )}

        {currentStep === 'payment' && (
          <TeacherPaymentPage
            teacherData={formData}
            pricing={pricing}
            onBack={handleBack}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {currentStep === 'info' && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Öğretmen Sistemi Özellikleri:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Maksimum 40 öğrenci kapasiteli sınıflar</li>
                <li>• Esnek fiyatlandırma (Aylık, 3 Aylık, Dönemlik)</li>
                <li>• Öğrenci performans takibi</li>
                <li>• Davet kodu ile kolay öğrenci ekleme</li>
                <li>• Detaylı raporlama ve analiz</li>
              </ul>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Kayıt olduktan sonra email adresinize doğrulama linki gönderilecektir.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}