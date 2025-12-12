import { useState, useEffect } from 'react';
import { X, ArrowUp, CheckCircle, Loader, Smartphone, Shield, Apple, Check, Download } from 'lucide-react';
import { calculateProration } from '../lib/subscriptionUpgrade';
import { useAuth } from '../hooks/useAuth';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlanId: string;
  targetPlanName: string;
  targetPlanPrice: { monthly: string; yearly: string };
  currentBillingCycle: 'monthly' | 'yearly';
  onSuccess: () => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  targetPlanId,
  targetPlanName,
  currentBillingCycle}: UpgradeModalProps) {
  const { user } = useAuth();

  const billingCycle = currentBillingCycle;

  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadCalculation();
    }
  }, [isOpen, user?.id]);

  const loadCalculation = async () => {
    if (!user?.id) return;

    setLoading(true);
    const calc = await calculateProration(user.id, targetPlanId, billingCycle);
    setCalculation(calc);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Paket Yükseltme - Mobil Uygulama
              </h2>
              <p className="text-blue-100">
                Paket yükseltme işlemi mobil uygulama üzerinden yapılmaktadır
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Calculation Summary */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : calculation ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <div className="mb-4 text-center">
                <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                  {targetPlanName} • {billingCycle === 'monthly' ? '📅 Aylık Paket' : '📅 Yıllık Paket'}
                </span>
              </div>

              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Fiyat Hesaplaması
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Yeni Paket Fiyatı</span>
                  <span className="font-semibold">{calculation.newPlanPrice.toFixed(2)}₺</span>
                </div>

                <div className="flex justify-between items-center text-green-600">
                  <span>Mevcut Paket Kredisi</span>
                  <span className="font-semibold">
                    -{calculation.creditAmount.toFixed(2)}₺
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Kalan Gün: {calculation.daysRemaining} / {calculation.totalDays}
                  </span>
                  <span className="text-sm text-gray-600">
                    %{calculation.discountPercentage} kredi
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-blue-600">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">
                      Ödenecek Tutar
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {calculation.amountToPay.toFixed(2)}₺
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Mevcut paketinizde kalan {calculation.daysRemaining} günlük süre,
                  yeni paketinize kredi olarak yansıtıldı. Sadece farkı ödeyeceksiniz!
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Hesaplama yapılamadı
            </div>
          )}

          {/* Mobile App Info */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-center text-gray-900 mb-4">
              Paket Yükseltme İşlemi Mobil Uygulama Üzerinden Yapılmaktadır
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
                    Mobil uygulamadan yükselttiğiniz paketi hem mobil hem de web platformlarında kullanabilirsiniz
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white rounded-lg p-4">
                <Download className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Anında Aktif</h4>
                  <p className="text-sm text-gray-600">
                    Yükseltme işleminiz tamamlandıktan sonra yeni özellikleriniz anında aktif olur
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
                <strong>Not:</strong> Mobil uygulamamızda oturum açtıktan sonra, paket yükseltme işlemini güvenle yapabilirsiniz.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Kapat
          </button>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Paket değişikliği mobil uygulama üzerinden anında gerçekleşir. Yeni özelliklerinize hemen erişebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
