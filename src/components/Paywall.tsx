import { Lock, Crown, ArrowRight, Sparkles, Check } from 'lucide-react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

interface PaywallProps {
  feature: string;
  onUpgrade: () => void;
  variant?: 'overlay' | 'card' | 'inline';
}

export default function Paywall({ feature, onUpgrade, variant = 'overlay' }: PaywallProps) {
  const { planName } = useFeatureAccess();

  const featureMessages: Record<string, { 
    title: string; 
    description: string;
    benefits: string[];
    requiredPlan: string;
  }> = {
    ai_analysis: {
      title: 'AI Eksik Analizi',
      description: 'Yapay zeka ile hangi konularda zayıf olduğunu keşfet',
      benefits: [
        'Konu bazlı zayıflık tespiti',
        'Akıllı çalışma önerileri',
        'Trend analizi ve tahminler'
      ],
      requiredPlan: 'Gelişmiş veya Profesyonel'
    },
    exam_topics: {
      title: '2021-2025 Çıkmış Konular',
      description: 'Son 4 yılın soru dağılımını analiz et',
      benefits: [
        'Tüm yılların konu dağılımı',
        'Trend grafikleri',
        'Sık çıkan konular analizi'
      ],
      requiredPlan: 'Gelişmiş veya Profesyonel'
    },
    advanced_reports: {
      title: 'Gelişmiş Raporlar',
      description: 'Detaylı PDF raporlar ve trend analizleri',
      benefits: [
        'PDF rapor oluşturma',
        'Karşılaştırmalı analizler',
        'Veli paylaşım özellikleri'
      ],
      requiredPlan: 'Profesyonel'
    },
    custom_goals: {
      title: 'Özel Hedefler',
      description: 'Kişiselleştirilmiş hedef takibi',
      benefits: [
        'Kendi hedeflerini oluştur',
        'İlerleme takibi',
        'Motivasyon bildirimleri'
      ],
      requiredPlan: 'Profesyonel'
    }
  };

  const message = featureMessages[feature] || {
    title: 'Premium Özellik',
    description: 'Bu özelliğe erişmek için paketini yükselt',
    benefits: ['Premium içeriklere erişim'],
    requiredPlan: 'Premium'
  };

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              {message.title}
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {message.requiredPlan}
              </span>
            </h3>
            <p className="text-gray-700 mb-4">{message.description}</p>
            <button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all shadow-md flex items-center gap-2"
            >
              Paketi Yükselt
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-yellow-200">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {message.title}
          </h3>
          <p className="text-gray-600">{message.description}</p>
        </div>

        <div className="space-y-3 mb-6">
          {message.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Paketi Yükselt
          <ArrowRight className="h-5 w-5" />
        </button>

        <p className="text-xs text-center text-gray-500 mt-4">
          7 gün ücretsiz deneme ile başla
        </p>
      </div>
    );
  }

  // Default: overlay variant
  return (
    <div className="relative min-h-[400px]">
      {/* Blurred background */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/60 z-10 rounded-lg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border-2 border-yellow-200">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <Crown className="h-10 w-10 text-white" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <Lock className="h-4 w-4 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {message.title}
            </h3>
            
            <p className="text-gray-600 mb-2">{message.description}</p>
            
            <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
              Gerekli: {message.requiredPlan}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {message.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Paketi Yükselt
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Şu anki paket: <strong>{planName === 'free' ? 'Ücretsiz' : planName}</strong>
          </p>
        </div>
      </div>

      {/* Placeholder content behind paywall */}
      <div className="opacity-30 pointer-events-none">
        <div className="h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
          <Lock className="h-24 w-24 text-gray-400" />
        </div>
      </div>
    </div>
  );
}