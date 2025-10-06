import React, { useState } from 'react';
import { Users, BookOpen, TrendingUp, Shield, Star, Calculator } from 'lucide-react';
import { PACKAGE_OPTIONS, calculateClassPrice } from '../types/teacher';
import TeacherRegistration from './TeacherRegistration';
import TeacherLogin from './TeacherLogin';

export default function TeacherSection() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(PACKAGE_OPTIONS[2]); // Default to 9-month
  const [studentCount, setStudentCount] = useState(30);

  const pricing = calculateClassPrice(studentCount, selectedPackage.type);

  // Listen for teacher registration modal trigger
  React.useEffect(() => {
    const handleOpenRegistration = () => {
      setShowRegistration(true);
    };
    
    window.addEventListener('openTeacherRegistration', handleOpenRegistration);
    return () => window.removeEventListener('openTeacherRegistration', handleOpenRegistration);
  }, []);

  return (
    <div id="teacher" className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Öğretmenler İçin Özel Sistem
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sınıfınızı dijitalleştirin! Öğrencilerinizin performansını takip edin, 
            velilerle iletişim kurun ve eğitim sürecinizi optimize edin.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="text-center bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">40 Öğrenci Kapasitesi</h3>
            <p className="text-gray-600 text-sm">Maksimum 40 öğrenci ile sınıfınızı yönetin</p>
          </div>

          <div className="text-center bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Performans Takibi</h3>
            <p className="text-gray-600 text-sm">Öğrenci gelişimini detaylı analiz edin</p>
          </div>

          <div className="text-center bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-purple-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kolay Yönetim</h3>
            <p className="text-gray-600 text-sm">Davet kodu ile öğrenci ekleme</p>
          </div>

          <div className="text-center bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-orange-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Güvenli Sistem</h3>
            <p className="text-gray-600 text-sm">KVKK uyumlu veri güvenliği</p>
          </div>
        </div>

        {/* Pricing Calculator */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Fiyat Hesaplayıcı</h3>
            <p className="text-gray-600">Sınıfınız için uygun paketi seçin ve maliyeti hesaplayın</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Öğrenci Sayısı: {studentCount}
                </label>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 öğrenci</span>
                  <span>40 öğrenci</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paket Seçimi
                </label>
                <div className="space-y-2">
                  {PACKAGE_OPTIONS.map((pkg) => (
                    <button
                      key={pkg.type}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedPackage.type === pkg.type
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
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Calculator className="h-6 w-6 text-blue-600 mr-2" />
                <h4 className="text-lg font-semibold">Maliyet Hesabı</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Öğrenci Sayısı:</span>
                  <span className="font-semibold">{studentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paket:</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Öğrenci Başı Aylık:</span>
                  <span className="font-semibold">{selectedPackage.price_per_student}₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Süre:</span>
                  <span className="font-semibold">{selectedPackage.duration_months} ay</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between text-lg">
                  <span>Aylık Toplam:</span>
                  <span className="font-bold text-blue-600">{pricing.monthlyPrice.toLocaleString()}₺</span>
                </div>
                <div className="flex justify-between text-xl">
                  <span>Toplam Tutar:</span>
                  <span className="font-bold text-green-600">{pricing.totalPrice.toLocaleString()}₺</span>
                </div>
                {pricing.savings > 0 && (
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="text-green-800 text-center">
                      <div className="font-semibold">Tasarruf: {pricing.savings.toLocaleString()}₺</div>
                      <div className="text-sm">Aylık pakete göre</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Hemen Öğretmen Kaydı yapabilirsiniz !</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Sınıfınızı dijitalleştirin ve öğrencilerinizin başarısını artırın. 
            Kayıt olduktan sonra email doğrulaması yaparak sınıfınızı oluşturabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Ücretsiz Kayıt Ol
            </button>
            <button
              onClick={() => setShowLogin(true)}
              className="bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-800 transition-colors shadow-lg border-2 border-green-500"
            >
              Öğretmen Girişi
            </button>
          </div>
        </div>

        {/* Security & Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Güvenli Veri</h4>
            <p className="text-gray-600 text-sm">KVKK uyumlu veri saklama</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Kolay Kullanım</h4>
            <p className="text-gray-600 text-sm">Sezgisel arayüz tasarımı</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Detaylı Analiz</h4>
            <p className="text-gray-600 text-sm">AI destekli performans analizi</p>
          </div>
        </div>
      </div>

      <TeacherRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => {
          setShowRegistration(false);
          alert('Kayıt başarılı! Artık giriş yapabilirsiniz.');
        }}
      />

      <TeacherLogin
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSuccess={() => {
          setShowLogin(false);
          // Trigger page reload to activate teacher dashboard
          window.location.reload();
        }}
      />
    </div>
  );
}