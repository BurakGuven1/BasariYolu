import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Shield, Check, Calendar, Calculator } from 'lucide-react';
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
    package_type: 'monthly' | '3_months' | '9_months';
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

export default function TeacherPaymentPage({ teacherData, pricing, onBack, onPaymentSuccess }: TeacherPaymentPageProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });

  const selectedPackage = PACKAGE_OPTIONS.find(pkg => pkg.type === teacherData.package_type);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        alert('Ödeme başarılı! Öğretmen hesabınız oluşturuluyor...');
        onPaymentSuccess();
      } else {
        throw new Error('Ödeme işlemi başarısız oldu');
      }
    } catch (error: any) {
      alert('Ödeme hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

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

      {/* Order Summary */}
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Sipariş Özeti</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-green-800">{teacherData.class_name}</h4>
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
                  🎉 {pricing.savings.toLocaleString()}₺ Tasarruf!
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
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Öğretmen Bilgileri</h3>
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

      {/* Payment Method Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemi</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Kredi Kartı</div>
          </button>
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              paymentMethod === 'bank'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Havale/EFT</div>
          </button>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handlePayment} className="space-y-4">
        {paymentMethod === 'card' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kart Numarası
              </label>
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={(e) => setCardData(prev => ({ 
                  ...prev, 
                  cardNumber: formatCardNumber(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Son Kullanma Tarihi
                </label>
                <input
                  type="text"
                  value={cardData.expiryDate}
                  onChange={(e) => setCardData(prev => ({ 
                    ...prev, 
                    expiryDate: formatExpiryDate(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={(e) => setCardData(prev => ({ 
                    ...prev, 
                    cvv: e.target.value.replace(/\D/g, '') 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kart Sahibinin Adı
              </label>
              <input
                type="text"
                value={cardData.cardHolder}
                onChange={(e) => setCardData(prev => ({ 
                  ...prev, 
                  cardHolder: e.target.value.toUpperCase() 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AD SOYAD"
                required
              />
            </div>
          </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Havale/EFT Bilgileri</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Banka:</strong> Türkiye İş Bankası</p>
              <p><strong>Hesap No:</strong> 1234-5678-9012-3456</p>
              <p><strong>IBAN:</strong> TR12 0006 4000 0011 2345 6789 01</p>
              <p><strong>Tutar:</strong> {pricing.totalPrice.toLocaleString()}₺</p>
              <p className="mt-2 text-yellow-600">
                Havale/EFT sonrası dekont fotoğrafını WhatsApp ile gönderiniz: 0850 123 45 67
              </p>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-sm text-green-700">
              <strong>Güvenli Ödeme:</strong> Tüm ödeme bilgileriniz SSL ile şifrelenir
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {paymentMethod === 'card' ? 'Ödeme İşleniyor...' : 'Onaylanıyor...'}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <CreditCard className="h-5 w-5 mr-2" />
              {paymentMethod === 'card' 
                ? `${pricing.totalPrice.toLocaleString()}₺ Öde` 
                : 'Havale Bilgilerini Onayladım'
              }
            </div>
          )}
        </button>
      </form>

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