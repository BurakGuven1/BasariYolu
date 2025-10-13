import { useState, useEffect } from 'react';
import { Crown, Calendar, CreditCard, ArrowRight, Loader } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { calculateProration } from '../lib/subscriptionUpgrade';
import { packages } from '../data/packages';
import UpgradeModal from './UpgradeModal';

export default function SubscriptionManagement() {
  const {subscription, planName, planDisplayName } = useFeatureAccess();
  const [calculations, setCalculations] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    if (subscription?.user_id) {
      loadCalculations();
    }
  }, [subscription]);

  const loadCalculations = async () => {
  if (!subscription?.user_id) return;

  setLoading(true);
  const calcs: any = {};

  // Mevcut billing cycle'ı al
  const currentBillingCycle = subscription.billing_cycle || 'monthly';

  // Her paket için SADECE mevcut cycle'da hesapla
  for (const pkg of packages) {
    if (pkg.id !== planName) {
      const calculation = await calculateProration(
        subscription.user_id,
        pkg.id,
        currentBillingCycle as 'monthly' | 'yearly'
      );
      
      calcs[pkg.id] = {
        [currentBillingCycle]: calculation
      };
    }
  }

  setCalculations(calcs);
  setLoading(false);
};

  const handleUpgradeClick = (pkg: any, billingCycle: 'monthly' | 'yearly') => {
  setSelectedPlan({
    id: pkg.id,
    name: pkg.name,
    monthlyPrice: pkg.monthlyPrice.toString(),
    yearlyPrice: pkg.yearlyPrice.toString(),
    billingCycle
  });
  setShowUpgradeModal(true);
};
  if (!subscription) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-600">Abonelik bilgisi bulunamadı</p>
      </div>
    );
  }

  // Tarih hesaplamaları
  const startDate = new Date(subscription.current_period_start);
  const endDate = new Date(subscription.current_period_end);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUsed = totalDays - daysRemaining;

  // Kredi hesaplama
  const currentPrice =
  subscription.billing_cycle === 'monthly'
    ? Number(subscription.plan?.monthly_price ?? 0)
    : Number(subscription.plan?.yearly_price ?? 0);
  const creditAmount = (currentPrice / totalDays) * daysRemaining;

  const getPlanIcon = (name: string) => {
    switch (name) {
      case 'professional': return '👑';
      case 'advanced': return '⭐';
      case 'basic': return '📘';
      default: return '📦';
    }
  };

  const canUpgradeTo = (targetPlan: string) => {
    const planOrder = ['basic', 'advanced', 'professional'];
    const currentIndex = planOrder.indexOf(planName || '');
    const targetIndex = planOrder.indexOf(targetPlan);
    return targetIndex > currentIndex;
  };

  return (
    <div className="space-y-6">
      {/* Mevcut Abonelik Kartı */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span className="text-4xl">{getPlanIcon(planName || '')}</span>
              {planDisplayName}
            </h2>
            <p className="text-blue-100 mt-2">
              {subscription.billing_cycle === 'monthly' ? 'Aylık' : 'Yıllık'} Abonelik
            </p>
          </div>
          {planName === 'professional' && (
            <Crown className="h-12 w-12 text-amber-300" />
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Kayıt Tarihi</span>
            </div>
            <p className="text-xl font-bold">
              {startDate.toLocaleDateString('tr-TR')}
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Bitiş Tarihi</span>
            </div>
            <p className="text-xl font-bold">
              {endDate.toLocaleDateString('tr-TR')}
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-100 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Kalan Süre</span>
            </div>
            <p className="text-xl font-bold">
              {daysRemaining} gün
            </p>
          </div>
        </div>

        {/* Kredi Bilgisi */}
        <div className="mt-6 bg-green-500/20 border border-green-400/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">💰 Mevcut Krediniz</p>
              <p className="text-xs text-green-200 mt-1">
                {daysUsed} gün kullandınız, {daysRemaining} gün kaldı
              </p>
            </div>
            <p className="text-3xl font-bold text-green-300">
              {creditAmount.toFixed(2)}₺
            </p>
          </div>
        </div>
      </div>

      {/* Yükseltme Seçenekleri */}
      {planName !== 'professional' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold mb-6">Paketi Yükselt</h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {packages.map((pkg) => {
                if (!canUpgradeTo(pkg.id)) return null;

                const calc = calculations[pkg.id];
                if (!calc) return null;

                // Mevcut billing cycle
                const currentCycle = subscription.billing_cycle || 'monthly';
                const isMonthly = currentCycle === 'monthly';
                const isYearly = currentCycle === 'yearly';
                const calculation = calc[currentCycle];

                if (!calculation) return null;

                return (
                  <div key={pkg.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-2xl font-bold flex items-center gap-2">
                          <span className="text-3xl">{getPlanIcon(pkg.id)}</span>
                          {pkg.name}
                        </h4>
                        <p className="text-gray-600 mt-1">Tüm premium özelliklere erişin</p>
                      </div>
                    </div>

                    {/* Tek bir billing cycle seçeneği */}
                    <div className={`rounded-lg p-4 ${isYearly ? 'bg-green-50' : 'bg-blue-50'}`}>
                      {isYearly && (
                        <span className="inline-block mb-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          %33 İndirim
                        </span>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            {isMonthly ? 'Aylık' : 'Yıllık'} Paket
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {isMonthly ? pkg.monthlyPrice : pkg.yearlyPrice}₺
                          </p>
                          {isYearly && (
                            <p className="text-xs text-gray-500">
                              Aylık {(pkg.yearlyPrice / 12).toFixed(0)}₺'ye denk geliyor
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paket Fiyatı</span>
                          <span className="font-semibold">{calculation.newPlanPrice.toFixed(2)}₺</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Krediniz ({calculation.daysRemaining} gün)</span>
                          <span className="font-semibold">-{calculation.creditAmount.toFixed(2)}₺</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-bold">Ödenecek</span>
                          <span className={`text-xl font-bold ${isYearly ? 'text-green-600' : 'text-blue-600'}`}>
                            {calculation.amountToPay.toFixed(2)}₺
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUpgradeClick(pkg, currentCycle)}
                        className={`w-full py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 font-semibold text-white ${
                          isYearly ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                      >
                        Bu Pakete Geç
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-2">
                      Mevcut paketiniz: {isMonthly ? 'Aylık' : 'Yıllık'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Profesyonel Paket Mesajı */}
      {planName === 'professional' && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-8 text-center">
          <Crown className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">🎉 En Üst Seviye Paket!</h3>
          <p className="text-amber-100">
            Zaten en iyi paketi kullanıyorsunuz. Tüm premium özelliklerin keyfini çıkarın!
          </p>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }}
          targetPlanId={selectedPlan.id}
          targetPlanName={selectedPlan.name}
          targetPlanPrice={{
            monthly: selectedPlan.monthlyPrice,
            yearly: selectedPlan.yearlyPrice
          }}
          currentBillingCycle={selectedPlan.billingCycle} // ✅ YENİ PROP
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}