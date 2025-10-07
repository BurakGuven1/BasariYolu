import { useState } from 'react';
import { Brain, Users, BarChart3, Bell, BookOpen, Target, Zap } from 'lucide-react';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher'>('student');

  const features = {
    student: [
      {
        icon: Brain,
        title: 'AI Destekli Eksik Analizi',
        description: 'Yapay zeka hangi konularda zayıf olduğunu tespit eder ve öncelikli çalışma planı sunar.',
        color: 'from-purple-500 to-pink-500'
      },
      {
        icon: BarChart3,
        title: 'Detaylı Performans Grafikleri',
        description: 'Her deneme sonrası net analizi, konu bazlı başarı oranları ve ilerleme takibi.',
        color: 'from-blue-500 to-cyan-500'
      },
      {
        icon: Target,
        title: 'Hedef Takip Sistemi',
        description: 'Hedeflerini belirle, ilerlemeni gör. Motivasyonun her zaman yüksek olsun.',
        color: 'from-orange-500 to-red-500'
      },
      {
        icon: BookOpen,
        title: '8 Yıllık Soru Bankası',
        description: '2018-2025 TYT-AYT soruları analiz edildi. Hangi konular sık çıkıyor, sen de bil.',
        color: 'from-green-500 to-emerald-500'
      }
    ],
    parent: [
      {
        icon: Bell,
        title: 'Anlık Bildirimler',
        description: 'Çocuğunuzun deneme sonuçları, ödevleri ve gelişimi hakkında anında bilgi alın.',
        color: 'from-blue-500 to-indigo-500'
      },
      {
        icon: BarChart3,
        title: 'Şeffaf Raporlama',
        description: 'Her hafta detaylı ilerleme raporu. Neyi eksik neyi iyi görebilirsiniz.',
        color: 'from-purple-500 to-pink-500'
      },
      {
        icon: Users,
        title: 'Öğretmenle İletişim',
        description: 'Öğretmenin yorumlarını görün, mesajlaşın. Herkes aynı sayfada.',
        color: 'from-green-500 to-teal-500'
      },
      {
        icon: Target,
        title: 'Hedef Takibi',
        description: 'Çocuğunuzun hedeflerine ne kadar yaklaştığını gerçek zamanlı izleyin.',
        color: 'from-orange-500 to-yellow-500'
      }
    ],
    teacher: [
      {
        icon: Users,
        title: 'Sınıf Yönetimi',
        description: '30 öğrenciyi tek ekranda yönetin. Kim nerede, kim ne yapıyor hepsi elinizin altında.',
        color: 'from-blue-500 to-cyan-500'
      },
      {
        icon: BookOpen,
        title: 'Ödev & Duyuru Sistemi',
        description: 'Ödev atın, duyuru yapın, sınav ekleyin. Tüm öğrenciler anında görsün.',
        color: 'from-green-500 to-emerald-500'
      },
      {
        icon: BarChart3,
        title: 'Toplu Analiz',
        description: 'Tüm sınıfın performansını tek bakışta görün. En zayıf konu hangisi?',
        color: 'from-purple-500 to-pink-500'
      },
      {
        icon: Zap,
        title: 'Hızlı İşlem',
        description: 'Sınav sonuçlarını toplu girin, otomatik hesaplansın. Zaman tasarrufu.',
        color: 'from-orange-500 to-red-500'
      }
    ]
  };

  const screenshots = {
    student: '/screenshots/student-dashboard.png',
    parent: '/screenshots/parent-dashboard.png',
    teacher: '/screenshots/teacher-dashboard.png'
  };

  return (
    <div className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold mb-6">
            Ürünümüz
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Herkes İçin Özel Çözümler
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Öğrenci, Veli ve Öğretmen - her kullanıcı için özel tasarlanmış deneyim
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-full p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎓 Öğrenci
            </button>
            <button
              onClick={() => setActiveTab('parent')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'parent'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👨‍👩‍👧 Veli
            </button>
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                activeTab === 'teacher'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👩‍🏫 Öğretmen
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Screenshot */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 rounded-3xl transform rotate-3 scale-105 opacity-20"></div>
              
              {/* Screenshot container */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-white">
                <img
                  src={screenshots[activeTab]}
                  alt={`${activeTab} dashboard screenshot`}
                  className="w-full h-auto"
                  onError={(e) => {
                    // Fallback placeholder
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                
                {/* Fallback placeholder */}
                <div className="hidden aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center p-8">
                    <BarChart3 className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold">
                      {activeTab === 'student' && 'Öğrenci Dashboard'}
                      {activeTab === 'parent' && 'Veli Dashboard'}
                      {activeTab === 'teacher' && 'Öğretmen Dashboard'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-xl font-bold">
                ✓ Canlı Demo
              </div>
            </div>
          </div>

          {/* Right - Features */}
          <div className="order-1 lg:order-2">
            <div className="space-y-6">
              {features[activeTab].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block bg-white rounded-2xl p-8 shadow-xl max-w-3xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Tüm özellikleri denemek ister misin?
            </h3>
            <p className="text-gray-600 mb-6">
              7 gün boyunca tüm premium özellikleri ücretsiz kullan. Kredi kartı gerekmez.
            </p>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-semibold hover:scale-105 transition-all shadow-lg">
              Ücretsiz Dene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}