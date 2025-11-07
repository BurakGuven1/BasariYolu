import React, { useState } from 'react';
import { X, Mail, Lock, Building2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginInstitutionAccount, InstitutionSession } from '../lib/institutionApi';

interface InstitutionLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: InstitutionSession) => void;
  onSwitchToRegister: () => void;
}

export default function InstitutionLoginModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToRegister,
}: InstitutionLoginModalProps) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', password: '' });
      setError(null);
      setLoading(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const session = await loginInstitutionAccount(formData.email.trim().toLowerCase(), formData.password);
      localStorage.setItem('institutionSession', JSON.stringify(session));
      onSuccess(session);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Giriş işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1 transition-colors"
          aria-label="Kapat"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Kurum Girişi</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Soru bankası, ders planları ve raporlara erişmek için hesabınızla giriş yapın.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kurum E-posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="ornek@kurum.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Şifrenizi giriniz"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Giriş yapılıyor...
              </div>
            ) : (
              'Kurum Girişi Yap'
            )}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-indigo-50 p-4">
          <p className="text-indigo-800 text-sm font-medium mb-2">
            Aktifleştirme Bekleyen Hesap
          </p>
          <p className="text-xs text-indigo-700 leading-relaxed">
            Kurum başvurunuz onaylanana kadar panelde sınırlı erişim sağlanır. Onay sonrası soru oluşturma ve
            sınav yayınlama özellikleri otomatik açılır.
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <span>Yeni kurum musunuz? </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Kurum kaydı oluştur
          </button>
        </div>
      </div>
    </div>
  );
}