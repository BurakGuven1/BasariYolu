import React from 'react';
import { Smartphone, Shield, Check, Download, Apple, Lock } from 'lucide-react';

interface PremiumRequiredScreenProps {
  userType?: 'student' | 'teacher' | 'parent' | 'institution';
}

export default function PremiumRequiredScreen({ userType = 'student' }: PremiumRequiredScreenProps) {
  const getMessage = () => {
    switch (userType) {
      case 'teacher':
        return {
          title: 'Öğretmen Hesabınızı Aktifleştirin',
          description: 'Sınıflarınızı yönetmek ve öğrencilerinizle etkileşime geçmek için mobil uygulamamızdan paket satın almalısınız.',
        };
      case 'institution':
        return {
          title: 'Kurum Hesabınızı Aktifleştirin',
          description: 'Kurumunuz için öğrenci yönetimi ve raporlama özelliklerine erişmek için mobil uygulamamızdan paket satın almalısınız.',
        };
      default:
        return {
          title: 'Premium Özelliklere Erişmek İçin Paket Satın Alın',
          description: 'Tüm özelliklere erişmek ve öğrenme yolculuğunuza başlamak için mobil uygulamamızdan paket satın almalısınız.',
        };
    }
  };

  const { title, description } = getMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-6">
            <Lock className="h-16 w-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          {title}
        </h1>

        {/* Description */}
        <p className="text-center text-gray-600 text-lg mb-8">
          {description}
        </p>

        {/* Mobile App Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-8 border-2 border-blue-200">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">
            Paket Satın Alımları Mobil Uygulama Üzerinden Yapılmaktadır
          </h3>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 bg-white rounded-lg p-4">
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Güvenli Ödeme</h4>
                <p className="text-sm text-gray-600">
                  Ödemeleriniz Google Play ve App Store'un güvenli altyapısı üzerinden işlenir
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-lg p-4">
              <Check className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Her Platformda Kullanın</h4>
                <p className="text-sm text-gray-600">
                  Mobil uygulamadan satın aldığınız paketi <strong>hem mobil hem de web platformlarında</strong> kullanabilirsiniz
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-lg p-4">
              <Download className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Anında Aktif</h4>
                <p className="text-sm text-gray-600">
                  Paket satın aldıktan sonra tüm özellikler anında aktif olur ve hem mobil hem web'de kullanabilirsiniz
                </p>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="space-y-3">
            <a
              href="https://apps.apple.com/app/basariyolu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              <Apple className="h-6 w-6" />
              <div className="text-left">
                <div className="text-xs">App Store'dan İndirin</div>
                <div className="text-sm font-bold">iOS Uygulamamız</div>
              </div>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.basariyolu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs">Google Play'den İndirin</div>
                <div className="text-sm font-bold">Android Uygulamamız</div>
              </div>
            </a>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Not:</strong> Mobil uygulamamızda oturum açtıktan sonra, size uygun paketi seçip güvenle satın alabilirsiniz.
              Satın aldığınız paket web platformunda da otomatik olarak aktif hale gelecektir.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Yardıma mı ihtiyacınız var? <a href="mailto:destek@basariyolu.com" className="text-blue-600 hover:underline">destek@basariyolu.com</a></p>
        </div>
      </div>
    </div>
  );
}
