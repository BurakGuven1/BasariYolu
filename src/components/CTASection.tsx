import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <div className="py-20 bg-gradient-to-br from-[#1F2533] via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-8 border border-white/20">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">Sınırlı Süre Özel Fırsat</span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Potansiyelini Keşfetmeye
          <span className="block mt-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Hazır Mısın?
          </span>
        </h2>

        {/* Description */}
        <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          Bugün başla, başarının tadını çıkar🚀
        </p>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="group bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-12 py-5 rounded-full text-xl font-bold hover:scale-105 transition-all shadow-2xl inline-flex items-center gap-3 mb-12"
        >
          Hemen Başla🚀
          <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
        </button>

        {/* Features list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            'Aylık - 3 Aylık - 9 Aylık seçenekler',
            'Yapay Zeka desteği ile başarını arttır',
            'Kendini takip et',
            'Çıkmış konulara göre çalış'
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2 text-white bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20"
            >
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Bottom text */}
        <p className="mt-12 text-blue-200 text-sm">
          Binlerce öğrenci, veli ve öğretmen zaten başladı. Sıra sende! 🚀
        </p>
      </div>
    </div>
  );
}