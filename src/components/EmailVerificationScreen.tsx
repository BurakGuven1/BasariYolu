import React from 'react';
import { Mail, Smartphone, Shield, Check, Download, Apple } from 'lucide-react';

interface EmailVerificationScreenProps {
  email: string;
  onClose: () => void;
}

export default function EmailVerificationScreen({ email, onClose }: EmailVerificationScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
        {/* Success Header */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <Check className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Hesabınız Oluşturuldu! 🎉
        </h1>

        <p className="text-center text-gray-600 text-lg mb-8">
          Hoş geldiniz! Hesabınızı aktifleştirmek için birkaç adım kaldı.
        </p>

        {/* Email Verification Card */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 rounded-full p-3 flex-shrink-0">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">📧 E-posta Onayı Gerekli</h3>
              <p className="text-sm text-gray-700 mb-3">
                <strong>{email}</strong> adresinize bir onay e-postası gönderdik.
                Hesabınızı aktifleştirmek için lütfen gelen kutunuzu kontrol edin ve
                e-postadaki bağlantıya tıklayın.
              </p>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-600">
                  💡 <strong>İpucu:</strong> E-postayı görmüyorsanız spam klasörünüzü kontrol edin.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Info */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-indigo-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-indigo-600 rounded-full p-3 flex-shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">📱 Paket Satın Alımı - Mobil Uygulama</h3>
              <p className="text-sm text-gray-700 mb-3">
                E-posta onayından sonra, premium özelliklere erişmek için mobil uygulamamızdan
                paket satın almalısınız.
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 bg-white rounded-lg p-4">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Güvenli Ödeme</h4>
                <p className="text-xs text-gray-600">
                  Google Play ve App Store'un güvenli altyapısı üzerinden ödeme yapın
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-lg p-4">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Her Platformda Kullanın</h4>
                <p className="text-xs text-gray-600">
                  Mobil'den aldığınız paket <strong>hem mobil hem de web platformunda</strong> geçerlidir
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white rounded-lg p-4">
              <Download className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">Anında Aktif</h4>
                <p className="text-xs text-gray-600">
                  Paket satın aldıktan sonra tüm özellikler anında aktif olur
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
              className="flex items-center justify-center gap-3 w-full bg-black text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              <Apple className="h-5 w-5" />
              <div className="text-left">
                <div className="text-xs">App Store'dan İndirin</div>
                <div className="text-sm font-bold">iOS Uygulamamız</div>
              </div>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.basariyolu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs">Google Play'den İndirin</div>
                <div className="text-sm font-bold">Android Uygulamamız</div>
              </div>
            </a>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Sıradaki Adımlar:</h3>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span className="text-sm text-gray-700">
                <strong>{email}</strong> adresine gelen onay e-postasındaki linke tıklayın
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span className="text-sm text-gray-700">
                Mobil uygulamamızı indirin (iOS veya Android)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span className="text-sm text-gray-700">
                Aynı e-posta ({email}) ile giriş yapın
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span className="text-sm text-gray-700">
                Size uygun paketi seçin ve güvenli ödeme yapın
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </span>
              <span className="text-sm text-gray-700">
                Tüm özelliklere hem mobil hem de web'den erişin!
              </span>
            </li>
          </ol>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors"
        >
          Tamam, Anladım
        </button>

        {/* Help */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Yardıma mı ihtiyacınız var?{' '}
          <a href="mailto:destek@basariyolu.com" className="text-blue-600 hover:underline">
            destek@basariyolu.com
          </a>
        </p>
      </div>
    </div>
  );
}
