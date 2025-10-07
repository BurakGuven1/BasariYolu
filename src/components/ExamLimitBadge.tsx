import { AlertCircle, CheckCircle, Crown } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface ExamLimitBadgeProps {
  onUpgrade?: () => void;
}

export default function ExamLimitBadge({ onUpgrade }: ExamLimitBadgeProps) {
  const { examStats, isFreeTier } = useFeatureAccess();

  if (isFreeTier) return null;

  const percentage = examStats.limit === Infinity 
    ? 100 
    : (examStats.count / examStats.limit) * 100;

  const isNearLimit = percentage >= 80;
  const isAtLimit = examStats.remaining === 0 && examStats.limit !== Infinity;

  if (examStats.limit === Infinity) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-yellow-600" />
          <div>
            <div className="font-semibold text-gray-900">Sınırsız Deneme</div>
            <div className="text-sm text-gray-600">İstediğin kadar deneme ekleyebilirsin</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 border-2 ${
      isAtLimit 
        ? 'bg-red-50 border-red-200' 
        : isNearLimit 
        ? 'bg-orange-50 border-orange-200' 
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isAtLimit ? (
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-semibold text-gray-900 mb-1">
              Deneme Limiti
            </div>
            <div className="text-sm text-gray-700 mb-2">
              {examStats.count} / {examStats.limit} kullanıldı
              {examStats.remaining > 0 && ` (${examStats.remaining} kaldı)`}
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  isAtLimit 
                    ? 'bg-red-500' 
                    : isNearLimit 
                    ? 'bg-orange-500' 
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {(isAtLimit || isNearLimit) && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-all shadow-md text-sm whitespace-nowrap"
          >
            Yükselt
          </button>
        )}
      </div>

      {isAtLimit && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-sm text-red-700">
            Deneme limitine ulaştın. Daha fazla deneme eklemek için paketini yükselt.
          </p>
        </div>
      )}
    </div>
  );
}