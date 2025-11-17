import React from 'react';
import { Check, Star, Calendar, CreditCard, ArrowUp } from 'lucide-react';
import { packages } from '../data/packages';
import { useAuth } from '../hooks/useAuth';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface PricingSectionProps {
  onSelectPackage: (packageId: string, billingCycle: 'monthly' | 'sixMonth' | 'yearly') => void;
}

export default function PricingSection({ onSelectPackage }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'sixMonth' | 'yearly'>('sixMonth');
  const { user } = useAuth();
  const { planName } = useFeatureAccess();

  const canUpgradeTo = (targetPlan: string) => {
    if (!planName) return true; // Giriş yapmamışsa her pakete başlayabilir
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
          <p className="text-gray-600 max-w-2xl mx-auto">
            İhtiyaçlarınıza göre tasarlanmış esnek paket seçenekleri. 
            İstediğiniz zaman paket değiştirebilirsiniz.
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mt-8">
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
                  <p className="text-gray-600">
                    {pkg.maxParents} veli hesabı • {pkg.aiSupport ? 'AI desteği' : 'Temel özellikler'}
                  </p>
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
                    // Mevcut paket - Buton disabled
                    <button
                      disabled
                      className="w-full py-3 px-6 rounded-lg font-semibold bg-green-100 text-green-700 cursor-default flex items-center justify-center gap-2"
                    >
                      <Check className="h-5 w-5" />
                      Aktif Paketiniz
                    </button>
                  ) : canUpgrade ? (
                    // Upgrade yapılabilir
                    <button
                      onClick={() => onSelectPackage(pkg.id, billingCycle)}
                      className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowUp className="h-5 w-5" />
                      Paketi Yükselt
                    </button>
                  ) : (
                    // Daha düşük paket - Downgrade
                    <button
                      disabled
                      className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
                    >
                      Daha Düşük Paket
                    </button>
                  )
                ) : (
                  // Giriş yapmamış - Normal buton
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