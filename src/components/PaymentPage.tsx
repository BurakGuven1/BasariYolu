import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Shield, Check, X, Calendar, Star } from 'lucide-react';
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

export default function PaymentPage({ isOpen, onClose, onPaymentSuccess, registrationData }: PaymentPageProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: ''
  });

  if (!isOpen) return null;

  const selectedPackage = packages.find(pkg => pkg.id === registrationData.packageType);
  if (!selectedPackage) return null;

  const currentPrice = registrationData.billingCycle === 'monthly' 
    ? selectedPackage.monthlyPrice 
    : selectedPackage.yearlyPrice;
  
  const monthlyEquivalent = registrationData.billingCycle === 'yearly' 
    ? selectedPackage.yearlyPrice / 12 
    : selectedPackage.monthlyPrice;
  
  const savings = registrationData.billingCycle === 'yearly' 
    ? (selectedPackage.monthlyPrice * 12) - selectedPackage.yearlyPrice 
    : 0;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        alert('Ödeme başarılı! Hesabınız oluşturuluyor...');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex items-center mb-6">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Geri</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ödeme Sayfası</h2>
            <p className="text-gray-600">Seçtiğiniz paketi satın alın ve hesabınızı aktifleştirin</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Side - Package Summary */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Sipariş Özeti</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-blue-800">{selectedPackage.name}</h4>
                    <p className="text-sm text-blue-600">
                      {registrationData.billingCycle === 'yearly' ? 'Yıllık Ödeme' : 'Aylık Ödeme'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {currentPrice.toLocaleString()}₺
                    </div>
                    {registrationData.billingCycle === 'yearly' && (
                      <div className="text-sm text-green-600">
                        Aylık {monthlyEquivalent.toFixed(0)}₺'ye denk geliyor
                      </div>
                    )}
                  </div>
                </div>

                {savings > 0 && (
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="text-green-800 text-center">
                      <div className="font-semibold flex items-center justify-center">
                        <Star className="h-4 w-4 mr-1" />
                        {savings.toLocaleString()}₺ Tasarruf!
                      </div>
                      <div className="text-sm">
                        Aylık ödemeye göre %{Math.round((savings / (selectedPackage.monthlyPrice * 12)) * 100)} indirim
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-blue-200 pt-4">
                  <h5 className="font-medium text-blue-800 mb-2">Paket Avantajları:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {selectedPackage.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {selectedPackage.features.length > 4 && (
                      <li className="text-blue-600 font-medium">
                        +{selectedPackage.features.length - 4} özellik daha...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* User Info Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hesap Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ad Soyad:</span>
                  <span className="font-medium">{registrationData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-posta:</span>
                  <span className="font-medium">{registrationData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sınıf:</span>
                  <span className="font-medium">{registrationData.grade}. Sınıf</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Okul:</span>
                  <span className="font-medium">{registrationData.schoolName}</span>
                </div>
                {registrationData.classCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sınıf Kodu:</span>
                    <span className="font-medium font-mono">{registrationData.classCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="space-y-6">
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
                    <p><strong>Tutar:</strong> {currentPrice.toLocaleString()}₺</p>
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
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? `${currentPrice.toLocaleString()}₺ Öde` 
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
        </div>
      </div>
    </div>
  );
}