import { Star, Quote, TrendingUp, Users, Award, Heart } from 'lucide-react';

export default function SocialProof() {
  const stats = [
    {
      icon: Users,
      number: '1000+',
      label: 'Aktif Öğrenci',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Award,
      number: '300+',
      label: 'Öğretmen',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      number: '%36',
      label: 'Ortalama Net Artışı',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Heart,
      number: '4.8/5',
      label: 'Kullanıcı Memnuniyeti',
      color: 'from-pink-500 to-rose-500'
    }
  ];

  const testimonials = [
    {
      name: 'Ayşe Yılmaz',
      role: 'Veli',
      avatar: '👩',
      rating: 5,
      text: 'Oğlum artık neye çalışacağını biliyor. Motivasyonu arttı çünkü ilerlemesini görüyor. Öğretmeniyle de sürekli iletişim halindeyiz.',
      result: 'Matematik neti 3 ayda 6 → 14'
    },
    {
      name: 'Ahmet Demir',
      role: 'Matematik Öğretmeni',
      avatar: '👨‍🏫',
      rating: 5,
      text: '30 öğrencim var ama artık hepsinin durumunu biliyorum. Kim nerede eksik, kim ilerliyor anında görüyorum. Oyun değiştirici.',
      result: 'Sınıf ortalaması +23% arttı'
    },
    {
      name: 'Mehmet Kaya',
      role: '12. Sınıf Öğrencisi',
      avatar: '🎓',
      rating: 5,
      text: 'AI analiz sayesinde hangi konuları çalışacağımı biliyorum. Artık körü körüne değil, akıllı çalışıyorum. Hedeflerime her gün biraz daha yaklaşıyorum.',
      result: 'TYT neti 45 → 68 (3 ay)'
    },
    {
      name: 'Zeynep Arslan',
      role: 'Veli',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Kızımın her sınavını takip edebiliyorum. Öğretmenin yorumlarını görüyorum. Artık ne olup bittiğini biliyorum, bu çok değerli.',
      result: 'Kızı ilk 100\'e girdi'
    },
    {
      name: 'Can Öztürk',
      role: 'Fen Bilimleri Öğretmeni',
      avatar: '👨‍🔬',
      rating: 5,
      text: 'Ödev veriyorum, tüm sınıf anında görüyor. Duyuru yapıyorum, veliler bildirimleri alıyor. Zaman tasarrufu inanılmaz.',
      result: 'Günde 2 saat kazandım'
    },
    {
      name: 'Elif Yıldız',
      role: '11. Sınıf Öğrencisi',
      avatar: '📚',
      rating: 5,
      text: 'Eksiklerimi görmek çok motive edici. Grafiklerim yükseliyor, bu beni daha çok çalışmaya teşvik ediyor. Artık hedefim çok net.',
      result: 'Hedef üniversiteye 45 puan kaldı'
    }
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Rakamlar Konuşuyor
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Binlerce öğrenci, veli ve öğretmen bize güveniyor
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Kullanıcılarımız Ne Diyor?
            </h2>
            <p className="text-xl text-gray-600">
              Gerçek insanların gerçek hikayeleri
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100"
              >
                {/* Quote icon */}
                <Quote className="h-8 w-8 text-blue-200 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" />
                  ))}
                </div>

                {/* Testimonial text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Result badge */}
                {testimonial.result && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-semibold text-sm">
                        {testimonial.result}
                      </span>
                    </div>
                  </div>
                )}

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Güvenilir ve Güvenli
            </h3>
            <p className="text-gray-600">
              Verileriniz 256-bit SSL şifrelemesi ile korunuyor
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-12">
            <div className="text-center">
              <div className="text-4xl mb-2">🔒</div>
              <div className="font-semibold text-gray-700">SSL Güvenlik</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">✓</div>
              <div className="font-semibold text-gray-700">KVKK Uyumlu</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="font-semibold text-gray-700">ISO Sertifikalı</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💳</div>
              <div className="font-semibold text-gray-700">Güvenli Ödeme</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}