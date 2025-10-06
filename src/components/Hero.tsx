import React from 'react';
import { TrendingUp, Users, Brain, Target, BarChart3 } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Öğrencinin <span className="text-blue-600">Başarısını</span><br />
            Takip Et, <span className="text-green-600">Geliştir</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Deneme sonuçları, ödevler ve gelişim süreçlerini yapay zeka desteğiyle analiz eden 
            akıllı eğitim platformu. Öğrenci-Veli ve Öğretmenler için tasarlandı.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onGetStarted}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Hemen Başla
            </button>
            <button 
              onClick={() => {
                const teacherSection = document.getElementById('teacher');
                if (teacherSection) {
                  teacherSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
            >
              Öğretmen Kaydı
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mt-16">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Analiz & Raporlama</h3>
              <p className="text-gray-600 text-sm">Detaylı performans analizi</p>
            </div>
            <div className="text-center">
              <Brain className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">AI Desteği</h3>
              <p className="text-gray-600 text-sm">Akıllı eksik tespit sistemi</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Veli ve Öğretmen Takibi</h3>
              <p className="text-gray-600 text-sm">Öğrencinin başarı yolculuğunu kolayca izle</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Hedef Odaklı</h3>
              <p className="text-gray-600 text-sm">Kişisel gelişim planları ve Yapay Zeka Önerileri</p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Çıkmış Sorular Analizi</h3>
              <p className="text-gray-600 text-sm">2018-2025 TYT-AYT konu dağılımı ve trend analizi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}