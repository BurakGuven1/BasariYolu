import React from 'react';
import { 
  BarChart3, Brain, Users, Target, 
  TrendingUp, BookOpen, Clock, Award 
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Detaylı Analiz & Raporlama',
    description: 'Deneme sonuçlarınızı görsel grafiklerle analiz edin, gelişiminizi takip edin.',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: Brain,
    title: 'Yapay Zeka Desteği',
    description: 'AI ile eksik konuları tespit edin, kişiselleştirilmiş çalışma önerileri alın.',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: Users,
    title: 'Veli Takip Sistemi',
    description: 'Veliler çocuklarının performansını kolayca takip edebilir, rapor alabilir.',
    color: 'bg-green-100 text-green-600'
  },
  {
    icon: Target,
    title: 'Hedef Odaklı Planlama',
    description: 'Sınav hedeflerinizi belirleyin, sürecinizi adım adım takip edin.',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: BookOpen,
    title: 'Ödev & Görev Takibi',
    description: 'Ödevlerinizi organize edin, teslim tarihlerini takip edin.',
    color: 'bg-red-100 text-red-600'
  },
  {
    icon: TrendingUp,
    title: 'İlerleme Grafikleri',
    description: 'Haftalık, aylık performansınızı görsel grafiklerle izleyin.',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    icon: Clock,
    title: 'Çalışma Süresi Takibi',
    description: 'Günlük, haftalık çalışma sürelerinizi kaydedin ve analiz edin.',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: Award,
    title: 'Başarı Rozetleri',
    description: 'Hedeflerinize ulaştıkça rozet kazanın, motivasyonunuzu koruyun.',
    color: 'bg-pink-100 text-pink-600'
  }
];

export default function Features() {
  return (
    <div id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Platform Özellikleri
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            EduTracker ile öğrenme sürecinizi optimize edin. Modern teknoloji ve yapay zeka 
            desteğiyle akademik başarınızı artırın.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-200"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Neden EduTracker?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">10,000+</div>
                <p className="text-gray-600">Aktif Öğrenci</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">%85</div>
                <p className="text-gray-600">Başarı Artışı</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <p className="text-gray-600">Destek Hizmeti</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}