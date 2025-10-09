import React, { useState } from 'react';
import { Crown, ArrowUp, Clock } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import UpgradeModal from './UpgradeModal';
import { packages } from '../data/packages';

export default function SubscriptionBadge() {
  const { planName, planDisplayName, subscription } = useFeatureAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetPlan, setTargetPlan] = useState<any>(null);

  if (!subscription || !planName) return null;

  const canUpgrade = planName === 'basic' || planName === 'advanced';

  const getNextPlan = () => {
    if (planName === 'basic') return packages.find(p => p.id === 'advanced');
    if (planName === 'advanced') return packages.find(p => p.id === 'professional');
    return null;
  };

  const handleUpgradeClick = () => {
    const nextPlan = getNextPlan();
    if (nextPlan) {
      setTargetPlan(nextPlan);
      setShowUpgradeModal(true);
    }
  };

  const getPlanColor = () => {
    switch (planName) {
      case 'basic': return 'from-blue-500 to-blue-600';
      case 'advanced': return 'from-purple-500 to-purple-600';
      case 'professional': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanIcon = () => {
    switch (planName) {
      case 'professional': return '👑';
      case 'advanced': return '⭐';
      case 'basic': return '📘';
      default: return '📦';
    }
  };

  // Kalan gün hesaplama
  const daysRemaining = React.useMemo(() => {
    if (!subscription.current_period_end) return 0;
    const today = new Date();
    const endDate = new Date(subscription.current_period_end);
    const diff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [subscription.current_period_end]);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getPlanColor()} p-4`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getPlanIcon()}</span>
              <div>
                <h3 className="font-bold text-lg">{planDisplayName}</h3>
                <p className="text-xs opacity-90">
                  {subscription.billing_cycle === 'monthly' ? 'Aylık' : 'Yıllık'} Abonelik
                </p>
              </div>
            </div>
            {planName === 'professional' && (
              <Crown className="h-6 w-6" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Kalan Süre */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Kalan Süre</span>
            </div>
            <span className="font-semibold text-gray-900">
              {daysRemaining} gün
            </span>
          </div>

          {/* Upgrade Butonu */}
          {canUpgrade && (
            <button
              onClick={handleUpgradeClick}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <ArrowUp className="h-5 w-5" />
              <span>
                {planName === 'basic' ? 'Gelişmiş Pakete Geç' : 'Profesyonel Pakete Geç'}
              </span>
            </button>
          )}

          {planName === 'professional' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-amber-800 font-semibold text-sm">
                🎉 En üst seviye paketi kullanıyorsunuz!
              </p>
            </div>
          )}

          {/* Upgrade Credit Bilgisi (varsa) */}
          {subscription.upgrade_credit && subscription.upgrade_credit > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">💰 Mevcut Kredi</span>
                <span className="font-bold text-green-800">
                  {subscription.upgrade_credit.toFixed(2)}₺
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Yükseltme yaparken bu kredi düşülecek
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && targetPlan && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            setTargetPlan(null);
          }}
          targetPlanId={targetPlan.id}
          targetPlanName={targetPlan.name}
          targetPlanPrice={{
            monthly: targetPlan.monthlyPrice.toString(),
            yearly: targetPlan.yearlyPrice.toString()
          }}
          onSuccess={() => {
            window.location.reload(); // Sayfayı yenile
          }}
        />
      )}
    </>
  );
}