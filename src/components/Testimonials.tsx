import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  school: string;
  image: string;
  rating: number;
  text: string;
  achievement: string;
  videoUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Zeynep Yılmaz',
    role: 'YKS 2024',
    school: 'İstanbul Üniversitesi - Tıp',
    image: '👩‍🎓',
    rating: 5,
    text: 'BaşarıYolu sayesinde çalışma programımı düzenledim ve hedeflerime ulaştım. Özellikle yapay zeka destekli konu önerileri çok işime yaradı. TYT\'de 450, AYT\'de 480 puan aldım!',
    achievement: 'TYT: 450 | AYT: 480',
  },
  {
    id: 2,
    name: 'Mehmet Kaya',
    role: 'LGS 2024',
    school: 'Fen Lisesi',
    image: '👨‍🎓',
    rating: 5,
    text: 'Platform çok kullanışlı. Günlük hedeflerim ve soru çözme takibim sayesinde motivasyonum hiç düşmedi. Pomodoro timer ile çalışma süremde %60 artış oldu!',
    achievement: 'LGS: 487 / 500',
  },
  {
    id: 3,
    name: 'Ayşe Demir',
    role: 'Veli',
    school: 'Öğrenci Velisi',
    image: '👨‍👩‍👧',
    rating: 5,
    text: 'Veli panelinden çocuğumun ilerlemesini takip etmek çok kolay. Hangi konularda zorlandığını görebiliyor ve ona yardımcı olabiliyorum. Çok başarılı bir sistem!',
    achievement: 'Veli Paneli Kullanıcısı',
  },
  {
    id: 4,
    name: 'Ahmet Öztürk',
    role: 'YKS 2024',
    school: 'Boğaziçi Üniversitesi - Bilgisayar Mühendisliği',
    image: '👨‍💻',
    rating: 5,
    text: 'Matematik ve fizik konularında eksiklerimi tespit ettim. AI önerileri sayesinde doğru konulara odaklandım. Sayısal puanım 1 ayda 40 puan arttı!',
    achievement: 'TYT: 470 | AYT: 495',
  },
  {
    id: 5,
    name: 'Elif Şahin',
    role: 'YKS 2024',
    school: 'ODTÜ - Endüstri Mühendisliği',
    image: '👩‍🔬',
    rating: 5,
    text: 'Deneme takip sistemi gerçekten çok iyi. Performansımı grafiklerle görmek motivasyon kaynağım oldu. Her hafta ilerlememi görerek hedefime emin adımlarla ilerledim.',
    achievement: 'TYT: 460 | AYT: 485',
  },
  {
    id: 6,
    name: 'Can Yıldırım',
    role: 'LGS 2024',
    school: 'Anadolu Lisesi',
    image: '👦',
    rating: 5,
    text: 'Arkadaşlarımla birlikte kullanıyoruz. Soru çözme yarışmaları yapıyoruz, çok eğlenceli! Hem öğreniyoruz hem de rekabet ediyor, kendimizi geliştiriyoruz.',
    achievement: 'LGS: 475 / 500',
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="bg-white dark:bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Öğrencilerimiz Ne Diyor?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Binlerce öğrencinin başarı hikayesine ortak olun
          </p>
        </div>

        {/* Main testimonial */}
        <div className="relative max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 shadow-xl">
            <Quote className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4 opacity-50" />

            <div className="mb-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-xl text-gray-700 dark:text-gray-200 leading-relaxed mb-6 italic">
                "{currentTestimonial.text}"
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{currentTestimonial.image}</div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {currentTestimonial.name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {currentTestimonial.role}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {currentTestimonial.school}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Başarı</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {currentTestimonial.achievement}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Önceki"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
            aria-label="Sonraki"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex justify-center gap-4 flex-wrap">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative transition-all ${
                index === currentIndex
                  ? 'scale-110 ring-4 ring-blue-500 dark:ring-blue-400'
                  : 'opacity-50 hover:opacity-100'
              }`}
            >
              <div className="text-4xl bg-white dark:bg-gray-800 rounded-full p-2 shadow-md">
                {testimonial.image}
              </div>
              {index === currentIndex && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">4.9/5</span>
              <span>Ortalama Puan</span>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <div>
              <span className="font-semibold">1,200+</span> Mutlu Öğrenci
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <div>
              <span className="font-semibold">95%</span> Başarı Oranı
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
