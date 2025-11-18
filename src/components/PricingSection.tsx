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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-gray-500">
            <span>✓ Güvenli ödeme (İyzico)</span>
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
