import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the hash fragment
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle errors
      if (error) {
        console.error('[AuthCallback] Error:', error, errorDescription);
        setStatus('error');
        setMessage(errorDescription || 'Doğrulama sırasında bir hata oluştu.');
        setTimeout(() => navigate('/'), 5000);
        return;
      }

      // Handle different auth types
      if (type === 'signup') {
        // Email confirmation
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          setStatus('success');
          setMessage('Email adresiniz başarıyla doğrulandı! Giriş yapılıyor...');

          // Get user type and redirect accordingly
          const userType = data.user?.user_metadata?.user_type;
          setTimeout(() => {
            if (userType === 'institution_student') {
              navigate('/');
            } else if (userType === 'teacher') {
              navigate('/teacher');
            } else if (userType === 'institution') {
              navigate('/institution');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          throw new Error('Doğrulama bilgileri eksik.');
        }
      } else if (type === 'recovery') {
        // Password reset
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          setStatus('success');
          setMessage('Şifre sıfırlama onaylandı. Yeni şifre sayfasına yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/auth/reset-password'), 2000);
        } else {
          throw new Error('Sıfırlama bilgileri eksik.');
        }
      } else if (type === 'magiclink') {
        // Magic link login
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          setStatus('success');
          setMessage('Giriş başarılı! Yönlendiriliyorsunuz...');

          const userType = data.user?.user_metadata?.user_type;
          setTimeout(() => {
            if (userType === 'teacher') {
              navigate('/teacher');
            } else if (userType === 'institution') {
              navigate('/institution');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        }
      } else {
        // Default: try to set session if tokens exist
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          setStatus('success');
          setMessage('İşlem başarılı! Yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/'), 2000);
        } else {
          throw new Error('Doğrulama bilgileri bulunamadı.');
        }
      }
    } catch (error: any) {
      console.error('[AuthCallback] Error:', error);
      setStatus('error');
      setMessage(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      setTimeout(() => navigate('/'), 5000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                İşleminiz Gerçekleştiriliyor
              </h2>
              <p className="text-gray-600">
                Lütfen bekleyin...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Başarılı!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 rounded-full p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bir Hata Oluştu
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ana Sayfaya Dön
              </button>
            </>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          BaşarıYolu - Güvenli Giriş Sistemi
        </p>
      </div>
    </div>
  );
}
