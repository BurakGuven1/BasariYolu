import React from 'react';
import { ArrowLeft, X, Smartphone, Check, Shield, Download, Apple } from 'lucide-react';
import { packages } from '../data/packages';

interface PaymentPageProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  registrationData: {
    email: string;
    password: string;
    name: string;
    grade: string;
    schoolName: string;
    packageType: string;
    billingCycle: 'monthly' | 'yearly';
    classCode?: string;
  };
}

export default function PaymentPage({ isOpen, onClose, registrationData }: PaymentPageProps) {
  if (!isOpen) return null;

  const selectedPackage = packages.find(pkg => pkg.id === registrationData.packageType);
  if (!selectedPackage) return null;

  const currentPrice = registrationData.billingCycle === 'monthly'
    ? selectedPackage.monthlyPrice
    : selectedPackage.yearlyPrice;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Geri</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mobil Uygulamamızdan Devam Edin</h2>
            <p className="text-gray-600">Güvenli ödeme için mobil uygulamamızı kullanın</p>
          </div>
        </div>

        {/* Mobile App Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 mb-6 border-2 border-blue-200">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 rounded-full p-4">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-center text-gray-900 mb-4">
            Paket Satın Alımları Mobil Uygulama Üzerinden Yapılmaktadır
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

          {/* Package Summary */}
          <div className="bg-white rounded-xl p-6 mb-6 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-3">Seçtiğiniz Paket:</h4>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-semibold text-blue-800">{selectedPackage.name}</h5>
                <p className="text-sm text-gray-600">
                  {registrationData.billingCycle === 'yearly' ? 'Yıllık Ödeme' : 'Aylık Ödeme'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-600">
                  {currentPrice.toLocaleString()}₺
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <p className="text-sm text-gray-600">
                Ad Soyad: <span className="font-medium text-gray-900">{registrationData.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                E-posta: <span className="font-medium text-gray-900">{registrationData.email}</span>
              </p>
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
              <strong>Not:</strong> Mobil uygulamamızı indirip giriş yaptıktan sonra, istediğiniz paketi seçip güvenle satın alabilirsiniz.
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
    </div>
  );
}
