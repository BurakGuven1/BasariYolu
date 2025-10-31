import { Ghost, Home, RefreshCcw } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

export default function NotFoundPage({ onNavigateHome }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-24 text-white">
      <div className="relative max-w-3xl mx-auto text-center">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-14 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full mb-8 backdrop-blur-md">
            <Ghost className="h-6 w-6 text-purple-300" />
            <span className="text-sm tracking-widest uppercase text-purple-100">404 · Kayıp sayfa</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Burada ders aradık ama bulamadık!</h1>
          <p className="text-lg text-slate-200 mb-12 max-w-2xl mx-auto leading-relaxed">
            Aradığınız sayfa muhtemelen teneffüse çıktı. Endişelenmeyin, sizi hızla ana sayfamıza
            götürelim veya yeni bir rota deneyelim.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              <Home className="h-5 w-5" />
              Ana Sayfaya Dön
            </button>
            <button
              onClick={() => window.history.go(-1)}
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              <RefreshCcw className="h-5 w-5" />
              Bir Önceki Sayfa
            </button>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3 text-left">
            {[
              {
                title: 'Destek ekibi yanınızda',
                description: 'support@basariyolum.com adresinden bize ulaşabilirsiniz.'
              },
              {
                title: 'Sıkça Sorulan Sorular',
                description: 'En merak edilen soruların yanıtları yardım merkezimizde.'
              },
              {
                title: 'Blogu keşfet',
                description: 'Sınavlara dair öneriler ve başarı hikayeleri ile ilham al.'
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-200">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
