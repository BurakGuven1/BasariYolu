import { Crown, Zap, Star } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

export default function SubscriptionBadge() {
  const { subscription, planDisplayName, isTrialActive, getDaysUntilExpiry } = useFeatureAccess();

  if (!subscription) return null;

  const planConfig = {
    temel: {
      icon: Star,
      gradient: 'from-blue-500 to-cyan-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    gelismis: {
      icon: Zap,
      gradient: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50'
    },
    profesyonel: {
      icon: Crown,
      gradient: 'from-yellow-500 to-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-yellow-50'
    }
  };

  const config = planConfig[subscription.plan?.name as keyof typeof planConfig] || planConfig.temel;
  const Icon = config.icon;
  const daysLeft = getDaysUntilExpiry();

  return (
    <div className={`${config.bgColor} border-2 border-${config.textColor.split('-')[1]}-200 rounded-lg p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className={`font-semibold ${config.textColor}`}>
              {planDisplayName}
              {isTrialActive() && <span className="ml-2 text-xs">(Deneme)</span>}
            </div>
            {daysLeft > 0 && daysLeft < 7 && (
              <div className="text-xs text-gray-600">
                {daysLeft} gün kaldı
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}