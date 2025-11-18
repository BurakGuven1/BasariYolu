import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
}

export default function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full mb-8 text-sm font-medium">
          <Sparkles className="h-4 w-4" />
          Sınırlı Süre Özel Fırsat
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
          Potansiyelini Keşfetmeye
          <span className="block mt-2 text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text">
            Hazır Mısın?
          </span>
        </h2>

        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Bugün başla, başarının tadını çıkar.
        </p>

        <button
          onClick={onGetStarted}
          className="group bg-indigo-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:bg-indigo-700 transition-all shadow-xl inline-flex items-center gap-3 mb-10"
        >
          Hemen Başla
          <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            'Aylık / 6 Aylık / 9 Aylık paketler',
            'Yapay zekâ destekli programlar',
            'Net ve hedef takibi',
            'Çıkmış konulara göre çalışma'
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center justify-center gap-2 text-gray-700 bg-slate-50 rounded-full px-5 py-2 border border-slate-200"
            >
              <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span className="font-medium">{feature}</span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-gray-500 text-sm">
          Binlerce öğrenci, veli ve öğretmen zaten başladı. Sıra sende!
        </p>
      </div>
    </div>
  );
}
