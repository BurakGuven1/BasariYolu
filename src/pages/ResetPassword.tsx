import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check if user has valid session
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setHasSession(true);
    } else {
      setError('Şifre sıfırlama linkinizin süresi dolmuş olabilir. Lütfen tekrar deneyin.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Şifre en az bir büyük harf içermelidir.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Şifre en az bir rakam içermelidir.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Sign out and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/', { state: { message: 'Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.' } });
      }, 3000);

    } catch (err: any) {
      console.error('[ResetPassword] Error:', err);
      setError(err.message || 'Şifre güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Şifreniz Değiştirildi!
            </h2>
            <p className="text-gray-600 mb-4">
              Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Yeni Şifre Oluştur
            </h2>
            <p className="text-gray-600">
              Güçlü bir şifre seçin
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {!hasSession && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Şifre sıfırlama linkinizin süresi dolmuş. Lütfen giriş sayfasından tekrar şifre sıfırlama isteği gönderin.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-3 text-sm font-semibold text-yellow-900 hover:underline"
              >
                Giriş Sayfasına Dön →
              </button>
            </div>
          )}

          {hasSession && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!hasSession}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="En az 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={!hasSession}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Şifre gereksinimleri:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className={password.length >= 8 ? 'text-green-600' : ''}>
                    ✓ En az 8 karakter
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ En az bir büyük harf
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    ✓ En az bir rakam
                  </li>
                  <li className={password === confirmPassword && password.length > 0 ? 'text-green-600' : ''}>
                    ✓ Şifreler eşleşmeli
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !hasSession}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Şifre Değiştiriliyor...
                  </>
                ) : (
                  'Şifremi Değiştir'
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Ana Sayfaya Dön
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Şifreleriniz güvenli bir şekilde şifrelenir ve asla düz metin olarak saklanmaz.
        </p>
      </div>
    </div>
  );
}
