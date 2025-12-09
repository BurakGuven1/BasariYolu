import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Video,
  Brain,
  BookOpen,
  BarChart,
  Zap,
  Star,
  ArrowRight
} from 'lucide-react';
import { getActivePackages, getAllCoaches, type CoachingPackage, type CoachProfile } from '../lib/coachingApi';
import { useAuth } from '../hooks/useAuth';

export default function CoachingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [packages, setPackages] = useState<CoachingPackage[]>([]);
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesData, coachesData] = await Promise.all([
        getActivePackages(),
        getAllCoaches(),
      ]);
      setPackages(packagesData);
      setCoaches(coachesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      navigate('/login?redirect=/coaching');
    } else if (user.profile?.role === 'student') {
      navigate('/student-dashboard?tab=coaching');
    } else {
      navigate('/login');
    }
  };

  const platformFeatures = [
    {
      icon: Brain,
      title: 'AI Destekli Analiz',
      description: 'Yapay zeka ile performans analizi ve kişiselleştirilmiş öneriler',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Target,
      title: 'Konu Takibi',
      description: 'Tüm konuları detaylı takip edin, ilerlemenizi görün',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BookOpen,
      title: 'Konu Özetleri',
      description: 'Binlerce konu özeti ve formül kartlarına erişim',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: BarChart,
      title: 'Performans Raporu',
      description: 'Detaylı grafikler ve istatistiklerle gelişiminizi izleyin',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Clock,
      title: 'Pomodoro Timer',
      description: 'Verimli çalışma için pomodoro tekniği desteği',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: MessageSquare,
      title: 'Soru Portalı',
      description: 'Öğretmenlerle ve arkadaşlarınla soru paylaş, cevap al',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  const getPackageIcon = (sessionCount: number) => {
    if (sessionCount === 1) return '🎯';
    if (sessionCount === 8) return '⭐';
    return '👑';
  };

  const getPackageColor = (sessionCount: number) => {
    if (sessionCount === 1) return 'from-blue-500 to-blue-600';
    if (sessionCount === 8) return 'from-purple-500 to-purple-600';
    return 'from-amber-500 to-amber-600';
  };

  const getPackageBorderColor = (sessionCount: number) => {
    if (sessionCount === 1) return 'border-blue-200 hover:border-blue-400';
    if (sessionCount === 8) return 'border-purple-200 hover:border-purple-400';
    return 'border-amber-200 hover:border-amber-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              👨‍🏫 Kişisel Koçluk Hizmeti
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              Hedeflerine ulaşmak için profesyonel koçluk desteği al.
              1-on-1 görüşmeler, günlük takip ve platform özellikleriyle başarıya ulaş!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Hemen Başla <ArrowRight className="inline ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-indigo-600 transition-all"
              >
                Paketleri İncele
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center border-2 border-blue-100">
            <div className="text-4xl font-bold text-blue-600 mb-2">{coaches.length}+</div>
            <div className="text-gray-600">Deneyimli Koç</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center border-2 border-purple-100">
            <div className="text-4xl font-bold text-purple-600 mb-2">1000+</div>
            <div className="text-gray-600">Başarılı Görüşme</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center border-2 border-green-100">
            <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
            <div className="text-gray-600">Memnuniyet Oranı</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center border-2 border-orange-100">
            <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
            <div className="text-gray-600">Platform Erişimi</div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Neden Koçluk?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Koçluk desteği ile hedeflerine çok daha hızlı ve etkili bir şekilde ulaş
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-blue-500">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Hedef Odaklı Çalışma</h3>
            <p className="text-gray-600">
              Koçunla birlikte net hedefler belirle ve bu hedeflere ulaşmak için kişiselleştirilmiş plan oluştur.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-purple-500">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Sürekli Takip</h3>
            <p className="text-gray-600">
              Haftada 2 görüşme ve günlük denetim ile sürekli takip altında ol, motivasyonunu hiç kaybetme.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow border-t-4 border-green-500">
            <div className="text-4xl mb-4">💪</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Motivasyon Desteği</h3>
            <p className="text-gray-600">
              Zorlu süreçlerde yanında olan koçunla birlikte motivasyonunu yüksek tut.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Platform Özellikleri
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Standart ve Premium paketlerle platformun tüm özelliklerine erişim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all"
              >
                <div className={`${feature.bgColor} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Packages Section */}
      <div id="packages" className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Koçluk Paketleri</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            İhtiyacına uygun paketi seç ve başarıya ulaşmaya başla
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl shadow-xl p-8 border-4 transition-all hover:scale-105 ${getPackageBorderColor(pkg.session_count)}`}
              >
                {pkg.session_count === 8 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      EN POPÜLER
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">{getPackageIcon(pkg.session_count)}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <div className={`text-5xl font-bold bg-gradient-to-r ${getPackageColor(pkg.session_count)} bg-clip-text text-transparent mb-2`}>
                    {pkg.price.toFixed(0)}₺
                  </div>
                  <p className="text-gray-600">
                    {pkg.session_count} seans • {pkg.duration_days} gün geçerli
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {pkg.description?.split('\n').filter(line => line.trim().startsWith('📌')).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature.replace('📌', '').trim()}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGetStarted}
                  className={`w-full py-3 bg-gradient-to-r ${getPackageColor(pkg.session_count)} text-white rounded-xl font-bold hover:shadow-lg transition-all`}
                >
                  Paketi Seç
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coaches Section */}
      {coaches.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Koçlarımız</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Deneyimli ve başarılı koçlarımızla tanış
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {coaches.slice(0, 8).map((coach) => (
                <div
                  key={coach.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-center"
                >
                  {coach.avatar_url ? (
                    <img
                      src={coach.avatar_url}
                      alt={coach.full_name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-indigo-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 border-4 border-indigo-200">
                      {coach.full_name[0]}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-2">{coach.full_name}</h3>
                  {coach.coach_specializations && coach.coach_specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                      {coach.coach_specializations.slice(0, 3).map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                  {coach.coach_bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{coach.coach_bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Başarıya Giden Yolda Yalnız Değilsin!</h2>
          <p className="text-xl mb-8 text-purple-100">
            Profesyonel koçluk desteği ile hedeflerine ulaş. Hemen başla!
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Ücretsiz Danışmanlık Al <ArrowRight className="inline ml-2 h-5 w-5" />
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🤔 Koçluk nasıl çalışır?</h3>
            <p className="text-gray-600">
              Paket satın aldıktan sonra koçunuz ile Google Meet üzerinden 1-on-1 görüşmeler yaparsınız.
              Standart ve Premium paketlerde günlük denetim ve takip de vardır.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">💰 Ödeme nasıl yapılır?</h3>
            <p className="text-gray-600">
              Güvenli ödeme sistemimiz üzerinden kredi kartı ile tek seferde ödeme yapabilirsiniz.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📅 Randevular nasıl belirlenir?</h3>
            <p className="text-gray-600">
              Koçunuz sizin için uygun saatlerde randevu oluşturur. Platform üzerinden randevularınızı görebilir
              ve Google Meet linki ile doğrudan görüşmeye katılabilirsiniz.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🎯 Platform özellikleri nelerdir?</h3>
            <p className="text-gray-600">
              Standart ve Premium paketlerle AI analiz, konu takibi, performans raporları, soru portalı ve
              daha birçok özelliğe tam erişim sağlarsınız.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
