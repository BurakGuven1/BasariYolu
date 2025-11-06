
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
          aria-label="Kapat"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kurum Girişi</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Soru bankası, ders planları ve raporlara erişmek için hesabınızla giriş yapın.
          </p>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              Kurum E-posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ornek@kurum.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">Sifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="********"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Sifreyi gizle' : 'Sifreyi goster'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                giriş yapılıyor...
              </>
            ) : (
              'Kurum Girişi Yap'
            )}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-xs text-blue-800">
          <p className="font-semibold text-blue-900">Aktifleştirme bekleyen hesap</p>
          <p className="mt-1 leading-relaxed">
            Kurum başvurunuz onaylanana kadar panelde sınırlı erişim sağlanır. Onay sonrası soru oluşturma ve
            sınav yayınlama özellikleri otomatik açılır.
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          <span>Yeni kurum musunuz? </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Kurum kaydı oluştur
          </button>
        </div>
      </div>
    </div>
  );
}
