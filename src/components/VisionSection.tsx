import { Brain, Link2, Database, Zap } from 'lucide-react';

export default function VisionSection() {
  const solutions = [
    {
      icon: Brain,
      title: 'AI Destekli Analiz',
      description: 'Sınav sonuçlarınızı yapay zeka analiz eder, hangi konulara odaklanmanız gerektiğini söyler.',
      highlight: 'Artık tahmin yok, veri var.',
      color: 'from-purple-500 to-pink-500',
      stats: 'Doğruluk oranı %94'
    },
    {
      icon: Link2,
      title: 'Bağlantılı Ekosistem',
      description: 'Öğretmen → Öğrenci → Veli. Herkes aynı platformda. Şeffaf. Gerçek zamanlı.',
      highlight: 'Kimse karanlıkta kalmıyor.',
      color: 'from-blue-500 to-cyan-500',
      stats: '3 taraf tek platformda'
    },
    {
      icon: Database,
      title: '8 Yıllık Veri Bankası',
      description: '2018-2025 tüm TYT-AYT soruları analiz edildi. Hangi konular sık çıkıyor?',
      highlight: 'Akıllı çalış, sıkı değil.',
      color: 'from-green-500 to-emerald-500',
      stats: '5000 çıkmış soru analizi'
    }
  ];

  return (
    <div className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold mb-6">
            Çözümümüz
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Biz Farklı Düşündük
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sadece bir platform değil, başarı için tam ekosistem
          </p>
        </div>

        {/* Solution Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              {/* Icon with gradient */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${solution.color} flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform`}>
                <solution.icon className="h-10 w-10 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {solution.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-4 leading-relaxed">
                {solution.description}
              </p>

              {/* Highlight */}
              <p className="text-lg font-semibold text-blue-600 mb-4 italic">
                "{solution.highlight}"
              </p>

              {/* Stats */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-semibold text-gray-700">{solution.stats}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Video/Story Section */}
        <div id="sena-story-video" className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Sena'nın Hikayesi
              </h3>
              <div className="space-y-4 text-blue-100">
                <p className="text-lg">
                  <strong className="text-white">Sena, 11. sınıf öğrencisi.</strong><br />
                  Matematik çalışıyor ama netleri yükselmiyor.
                </p>
                <p className="text-lg">
                  BaşarıYolu'na giriyor. Yapay zeka eksikleri analiz ediyor:<br />
                  <span className="text-yellow-400 font-semibold">"Son 8 yılın çıkmış sorularına göre gelecek yılın sınavına uygun çalışma planı sunuyor"</span>
                </p>
                <p className="text-lg">
                  Öğretmeni görüyor, ödev atıyor.<br />
                  Velisi telefonda bildirimleri alıyor.<br />
                  <strong className="text-white">Sena artık ne yapacağını biliyor.</strong>
                </p>
                <div className="bg-green-500/20 border border-green-400 rounded-lg p-4 mt-6">
                  <p className="text-xl font-bold text-green-300">
                    3 ay sonra Sena'nın matematik neti 13'den 24'e çıktı! 🚀
                  </p>
                </div>
              </div>
            </div>

            {/* Video placeholder */}
            <div className="relative">
              <div className="aspect-video bg-black/20 rounded-2xl backdrop-blur-sm flex items-center justify-center border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer group">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold">Videoyu İzle</p>
                  <p className="text-blue-200 text-sm">1 dakika</p>
                </div>
              </div>
              <video
                className="absolute top-0 left-0 w-full h-full rounded-2xl object-cover z-10"
                src="/gemini.mp4"
                controls
                autoPlay={false}
                muted
                hidden={false} // istersen göster/gizle kontrolü de ekleyebilirsin
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}