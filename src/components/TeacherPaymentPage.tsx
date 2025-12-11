import React from 'react';
import { ArrowLeft, Smartphone, Check, Shield, Download, Apple } from 'lucide-react';
import { PACKAGE_OPTIONS } from '../types/teacher';

interface TeacherPaymentPageProps {
  teacherData: {
    full_name: string;
    email: string;
    phone: string;
    school_name: string;
    class_name: string;
    class_description: string;
    student_capacity: number;
    package_type: 'monthly' | '6_months' | '9_months';
  };
  pricing: {
    monthlyPrice: number;
    totalPrice: number;
    savings: number;
    pricePerStudent: number;
    duration: number;
  };
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export default function TeacherPaymentPage({ teacherData, pricing, onBack }: TeacherPaymentPageProps) {
  const selectedPackage = PACKAGE_OPTIONS.find(pkg => pkg.type === teacherData.package_type);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Geri</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mobil Uygulamamızdan Devam Edin</h2>
        <p className="text-gray-600">Güvenli ödeme için mobil uygulamamızı kullanın</p>
      </div>

      {/* Mobile App Info Card */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-200">
        <div className="flex justify-center mb-6">
          <div className="bg-green-600 rounded-full p-4">
            <Smartphone className="h-12 w-12 text-white" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-center text-gray-900 mb-4">
          Öğretmen Paket Satın Alımları Mobil Uygulama Üzerinden Yapılmaktadır
        </h3>

        <div className="space-y-3 mb-6">
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
                Mobil uygulamadan satın aldığınız paketi hem mobil hem de web platformlarında kullanabilirsiniz
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white rounded-lg p-4">
            <Download className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Kolay Kurulum</h4>
              <p className="text-sm text-gray-600">
                Uygulamamızı indirin, giriş yapın ve paketinizi güvenle satın alın
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">Sipariş Özeti:</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-semibold text-green-800">{teacherData.class_name}</h5>
                <p className="text-sm text-green-600">{selectedPackage?.name}</p>
                <p className="text-xs text-green-600">{teacherData.student_capacity} öğrenci kapasitesi</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {pricing.totalPrice.toLocaleString()}₺
                </div>
                <div className="text-sm text-green-600">
                  {pricing.duration} ay için
                </div>
              </div>
            </div>

            {pricing.savings > 0 && (
              <div className="bg-green-100 p-3 rounded-lg">
                <div className="text-green-800 text-center">
                  <div className="font-semibold">
                    {pricing.savings.toLocaleString()}₺ Tasarruf!
                  </div>
                  <div className="text-sm">
                    Aylık pakete göre indirim
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-green-200 pt-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Öğrenci Başı Aylık:</span>
                  <span className="font-medium">{pricing.pricePerStudent}₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Aylık Toplam:</span>
                  <span className="font-medium">{pricing.monthlyPrice.toLocaleString()}₺</span>
                </div>
                <div className="flex justify-between">
                  <span>Süre:</span>
                  <span className="font-medium">{pricing.duration} ay</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teacher Info Summary */}
        <div className="bg-white rounded-xl p-6 mb-6 border border-green-200">
          <h4 className="font-semibold text-gray-900 mb-3">Öğretmen Bilgileri:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ad Soyad:</span>
              <span className="font-medium">{teacherData.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">E-posta:</span>
              <span className="font-medium">{teacherData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Telefon:</span>
              <span className="font-medium">{teacherData.phone}</span>
            </div>
            {teacherData.school_name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Okul:</span>
                <span className="font-medium">{teacherData.school_name}</span>
              </div>
            )}
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
            className="flex items-center justify-center gap-3 w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors"
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
            <strong>Not:</strong> Mobil uygulamamızı indirip giriş yaptıktan sonra, öğretmen paketinizi seçip güvenle satın alabilirsiniz.
          </p>
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-500 text-center">
        Ödeme yaparak{' '}
        <a href="#" className="text-blue-600 hover:underline">Kullanım Şartları</a>
        {' '}ve{' '}
        <a href="#" className="text-blue-600 hover:underline">Gizlilik Politikası</a>
        'nı kabul etmiş olursunuz.
      </div>
    </div>
  );
}
