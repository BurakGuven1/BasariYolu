import { Crown, ArrowRight } from 'lucide-react';

interface PaywallProps {
  feature: string;
  onUpgrade: () => void;
}

export default function Paywall({ feature, onUpgrade }: PaywallProps) {
  const featureMessages: Record<string, { title: string; description: string }> = {
    ai_analysis: {
      title: 'AI Eksik Analizi',
      description: 'Yapay zeka ile hangi konularda zayıf olduğunu keşfet'
    },
    exam_topics: {
      title: '2021-2025 Çıkmış Konular',
      description: 'Son 4 yılın soru dağılımını analiz et'
    },
    advanced_reports: {
      title: 'Gelişmiş Raporlar',
      description: 'Detaylı PDF raporlar ve trend analizleri'
    }
  };

  const message = featureMessages[feature] || {
    title: 'Premium Özellik',
    description: 'Bu özelliğe erişmek için paketini yükselt'
  };

  return (
    <div className="relative">
      {/* Blurred content overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/50 z-10 rounded-lg flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md text-center border-2 border-yellow-200">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="h-10 w-10 text-white" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {message.title}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {message.description}
          </p>

          <button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
          >
            Paketi Yükselt
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-xs text-gray-500 mt-4">
            7 gün ücretsiz deneme ile başla
          </p>
        </div>
      </div>
    </div>
  );
}