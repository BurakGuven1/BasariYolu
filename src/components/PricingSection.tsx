import React from 'react';
import { Check, X, Star, Calendar, CreditCard, ArrowUp } from 'lucide-react';
import { packages, allFeatures } from '../data/packages';
import { useAuth } from '../hooks/useAuth';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface PricingSectionProps {
  onSelectPackage: (packageId: string, billingCycle: 'monthly' | 'sixMonth' | 'yearly') => void;
}

export default function PricingSection({ onSelectPackage }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'sixMonth' | 'yearly'>('sixMonth');
  const [showComparison, setShowComparison] = React.useState(false);
  const { user } = useAuth();
  const { planName } = useFeatureAccess();

  const canUpgradeTo = (targetPlan: string) => {
    if (!planName) return true;
    const planOrder = ['basic', 'advanced', 'professional'];
    const currentIndex = planOrder.indexOf(planName);
    const targetIndex = planOrder.indexOf(targetPlan);
    return targetIndex > currentIndex;
  };

  const isCurrentPlan = (packageId: string) => {
    return planName === packageId;
  };

  return (
    <div id="pricing" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Size Uygun Paketi Seçin
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            İhtiyaçlarınıza göre tasarlanmış esnek paket seçenekleri.
            İstediğiniz zaman paket değiştirebilirsiniz.
          </p>

          {/* Görünüm Değiştirme Toggle */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
            >
              {showComparison ? '← Kart Görünümüne Dön' : 'Paketleri Karşılaştır →'}
            </button>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex flex-wrap">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>1 Ay</span>
              </button>
              <button
                onClick={() => setBillingCycle('sixMonth')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                  billingCycle === 'sixMonth'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>6 Ay</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs ml-1">
                  %10 İndirim
                </span>
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>12 Ay</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs ml-1">
                  %25 İndirim
                </span>
              </button>
            </div>
          </div>
        </div>

        {showComparison ? (
          /* Karşılaştırma Tablosu */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                      Özellikler
                    </th>
                    {packages.map((pkg, index) => {
                      const currentPrice =
                        billingCycle === 'monthly' ? pkg.monthlyPrice :
                        billingCycle === 'sixMonth' ? pkg.sixMonthPrice :
                        pkg.yearlyPrice;

                      const monthlyEquivalent =
                        billingCycle === 'monthly' ? pkg.monthlyPrice :
                        billingCycle === 'sixMonth' ? pkg.sixMonthPrice / 6 :
                        pkg.yearlyPrice / 12;

                      const isCurrent = isCurrentPlan(pkg.id);

                      return (
                        <th
                          key={pkg.id}
                          className={`px-6 py-4 text-center ${
                            index === 1 ? 'bg-blue-50' : ''
                          } ${isCurrent ? 'bg-green-50' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            {index === 1 && !isCurrent && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                                <Star className="h-3 w-3 mr-1" />
                                En Popüler
                              </span>
                            )}
                            {isCurrent && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                                <Check className="h-3 w-3 mr-1" />
                                Aktif
                              </span>
                            )}
                            <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                            <div>
                              <span className="text-2xl font-bold text-gray-900">
                                {currentPrice.toFixed(0)}₺
                              </span>
                              <span className="text-gray-600 text-sm">
                                {billingCycle === 'monthly' ? '/ay' :
                                 billingCycle === 'sixMonth' ? '/6ay' : '/yıl'}
                              </span>
                            </div>
                            {billingCycle !== 'monthly' && (
                              <span className="text-xs text-gray-500">
                                Aylık ~{monthlyEquivalent.toFixed(0)}₺
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Kategoriye göre grupla */}
                  {['Temel', 'Gelişmiş', 'Profesyonel'].map((category) => {
                    const categoryFeatures = allFeatures.filter(f => f.category === category);
                    if (categoryFeatures.length === 0) return null;

                    return (
                      <React.Fragment key={category}>
                        {/* Kategori Başlığı */}
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700">
                            {category} Özellikler
                          </td>
                        </tr>
                        {/* Kategori Özellikleri */}
                        {categoryFeatures.map((feature) => (
                          <tr key={feature.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-700 sticky left-0 bg-white">
                              {feature.name}
                            </td>
                            {packages.map((pkg, pkgIndex) => (
                              <td
                                key={pkg.id}
                                className={`px-6 py-4 text-center ${
                                  pkgIndex === 1 ? 'bg-blue-50/30' : ''
                                } ${isCurrentPlan(pkg.id) ? 'bg-green-50/30' : ''}`}
                              >
                                {pkg.featureAccess[feature.id] ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-gray-300 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {/* Veli Hesabı Sayısı */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 sticky left-0 bg-white">
                      Veli Hesabı Sayısı
                    </td>
                    {packages.map((pkg, pkgIndex) => (
                      <td
                        key={pkg.id}
                        className={`px-6 py-4 text-center font-semibold ${
                          pkgIndex === 1 ? 'bg-blue-50/30' : ''
                        } ${isCurrentPlan(pkg.id) ? 'bg-green-50/30' : ''}`}
                      >
                        {pkg.maxParents}
                      </td>
                    ))}
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-6 py-4 sticky left-0 bg-white"></td>
                    {packages.map((pkg) => {
                      const isCurrent = isCurrentPlan(pkg.id);
                      const canUpgrade = canUpgradeTo(pkg.id);

                      return (
                        <td key={pkg.id} className="px-6 py-4 text-center">
                          {user ? (
                            isCurrent ? (
                              <button
                                disabled
                                className="w-full py-2 px-4 rounded-lg font-semibold bg-green-100 text-green-700 cursor-default flex items-center justify-center gap-2"
                              >
                                <Check className="h-4 w-4" />
                                Aktif
                              </button>
                            ) : canUpgrade ? (
                              <button
                                onClick={() => onSelectPackage(pkg.id, billingCycle)}
                                className="w-full py-2 px-4 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all"
                              >
                                Yükselt
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full py-2 px-4 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed text-xs"
                              >
                                Düşük Paket
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => onSelectPackage(pkg.id, billingCycle)}
                              className="w-full py-2 px-4 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Seç
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* Kart Görünümü (Mevcut) */
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => {
              const currentPrice =
                billingCycle === 'monthly' ? pkg.monthlyPrice :
                billingCycle === 'sixMonth' ? pkg.sixMonthPrice :
                pkg.yearlyPrice;

              const monthlyEquivalent =
                billingCycle === 'monthly' ? pkg.monthlyPrice :
                billingCycle === 'sixMonth' ? pkg.sixMonthPrice / 6 :
                pkg.yearlyPrice / 12;

              const fullPrice =
                billingCycle === 'monthly' ? pkg.monthlyPrice :
                billingCycle === 'sixMonth' ? pkg.monthlyPrice * 6 :
                pkg.monthlyPrice * 12;

              const savings = fullPrice - currentPrice;
              const isCurrent = isCurrentPlan(pkg.id);
              const canUpgrade = canUpgradeTo(pkg.id);

              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-xl shadow-lg p-8 relative ${
                    index === 1 ? 'md:ring-2 md:ring-blue-500 md:scale-105' : ''
                  } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
                >
                  {/* En Popüler Badge */}
                  {index === 1 && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        En Popüler
                      </div>
                    </div>
                  )}

                  {/* Aktif Paket Badge */}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                        <Check className="h-4 w-4 mr-1" />
                        Aktif Paket
                      </div>
                    </div>
                  )}

                  {/* Tasarruf Badge */}
                  {billingCycle !== 'monthly' && savings > 0 && !isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {savings.toFixed(0)}₺ Tasarruf
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{currentPrice.toFixed(0)}</span>
                      <span className="text-gray-600 ml-1">₺{
                        billingCycle === 'monthly' ? '/ay' :
                        billingCycle === 'sixMonth' ? '/6 ay' :
                        '/yıl'
                      }</span>
                      {billingCycle !== 'monthly' && (
                        <div className="text-sm text-gray-500 mt-1">
                          Aylık {monthlyEquivalent.toFixed(0)}₺'ye denk geliyor
                        </div>
                      )}
                    </div>
                   <b><p className="text-gray-600">
                       • {pkg.aiSupport ? 'Her konuda Yapay Zeka Destekli Soru Çözümü' : 'Temel özellikler'}
                    </p></b>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Akıllı Buton */}
                  {user ? (
                    isCurrent ? (
                      <button
                        disabled
                        className="w-full py-3 px-6 rounded-lg font-semibold bg-green-100 text-green-700 cursor-default flex items-center justify-center gap-2"
                      >
                        <Check className="h-5 w-5" />
                        Aktif Paketiniz
                      </button>
                    ) : canUpgrade ? (
                      <button
                        onClick={() => onSelectPackage(pkg.id, billingCycle)}
                        className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowUp className="h-5 w-5" />
                        Paketi Yükselt
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
                      >
                        Daha Düşük Paket
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onSelectPackage(pkg.id, billingCycle)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        index === 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      Paketi Seç
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            {billingCycle === 'yearly'
              ? '12 Aylık Ödemede %25 indirim fırsatı 🚀'
              : billingCycle === 'sixMonth'
              ? '6 Aylık Ödemede %10 indirim fırsatı 🎯'
              : 'Aylık esnek ödeme seçeneği 💳'
            }
          </p>

          {/* Mobile App Notice */}
          <div className="max-w-3xl mx-auto mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-600 rounded-full p-2 flex-shrink-0">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-gray-900 mb-2">📱 Paket Satın Alımları Mobil Uygulama Üzerinden</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Güvenli ödeme için Google Play ve App Store altyapısını kullanıyoruz.
                  Mobil uygulamamızdan satın aldığınız paketleri <strong>hem mobil hem de web platformlarında</strong> kullanabilirsiniz.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://apps.apple.com/app/basariyolu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    App Store
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.basariyolu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                    Google Play
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-gray-500">
            <span>✓ Güvenli ödeme (Google & Apple)</span>
            <span>✓ 24/7 destek</span>
            <span>✓ {
              billingCycle === 'yearly' ? '12 ay %25 indirim' :
              billingCycle === 'sixMonth' ? '6 ay %10 indirim' :
              'Esnek ödeme'
            }</span>
            {user && <span>✓ Kredi sistemi ile uygun yükseltme</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
