import { useState, useEffect } from 'react';
import { X, ArrowUp, CheckCircle, Loader } from 'lucide-react';
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
  const [processing, setProcessing] = useState(false);

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

  const handleUpgrade = async () => {
  if (!user?.id) return;

  setProcessing(true);

  // ✅ DEMO MOD: Gerçek upgrade yapmadan ödeme simülasyonu
  setTimeout(() => {
    setProcessing(false);
    alert(`✅ Demo Başarılı!\n\n💳 Ödeme Detayları:\nPaket: ${targetPlanName}\nTutar: ${calculation?.amountToPay.toFixed(2)}₺\n\n⚠️ Gerçek ödeme entegrasyonu eklenecek.`);
    onClose();
  }, 2000);

  /* GERÇEK UPGRADE - Ödeme sonrası aktif olacak
  try {
    const result = await upgradeSubscription({
      userId: user.id,
      newPlanId: targetPlanId,
      newBillingCycle: billingCycle
    });

    setProcessing(false);

    if (result.success) {
      alert('🎉 Paketiniz başarıyla yükseltildi!');
      onSuccess();
      onClose();
    } else {
      alert('❌ Hata: ' + result.error);
    }
  } catch (error: any) {
    setProcessing(false);
    alert('❌ Beklenmeyen hata: ' + error.message);
  }
  */
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <ArrowUp className="h-6 w-6" />
                Paket Yükseltme
              </h2>
              <p className="text-blue-100">
                {targetPlanName} paketine geçiş yapıyorsunuz
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
          <div className="mb-4 text-center">
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
              {billingCycle === 'monthly' ? '📅 Aylık Paket' : '📅 Yıllık Paket'}
            </span>
          </div>
          {/* Calculation Summary */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : calculation ? (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
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

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              disabled={processing}
            >
              İptal
            </button>
            <button
              onClick={handleUpgrade}
              disabled={!calculation || processing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <ArrowUp className="h-5 w-5" />
                  Paketi Yükselt
                </>
              )}
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Paket değişikliği anında gerçekleşir. Yeni özelliklerinize hemen erişebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}