import React, { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Phone, Mail, Lock, X } from 'lucide-react';
import {
  fetchInstitutionStudentPortalData,
  fetchInstitutionStudentStatus,
  submitInstitutionStudentSignup,
  type InstitutionExamResult,
  type InstitutionStudentRequest,
} from '../lib/institutionStudentApi';
import type { InstitutionExamBlueprint } from '../lib/institutionQuestionApi';
import InstitutionStudentPortal from './InstitutionStudentPortal';

interface InstitutionStudentAccessModalProps {
  open: boolean;
  onClose: () => void;
}

type ViewState = 'signup' | 'login' | 'portal';

const initialSignupForm = {
  inviteCode: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
};

const initialLoginForm = {
  email: '',
  password: '',
};

export default function InstitutionStudentAccessModal({ open, onClose }: InstitutionStudentAccessModalProps) {
  const [view, setView] = useState<ViewState>('signup');
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalContext, setPortalContext] = useState<{
    request: InstitutionStudentRequest;
    blueprints: InstitutionExamBlueprint[];
    results: InstitutionExamResult[];
    userId: string;
  } | null>(null);

  const handlePortalRefresh = async () => {
    if (!portalContext) return;
    try {
      const portalData = await fetchInstitutionStudentPortalData(
        portalContext.request.institution_id,
        portalContext.userId,
      );
      setPortalContext((prev) =>
        prev
          ? {
              ...prev,
              blueprints: portalData.blueprints,
              results: portalData.results,
            }
          : prev,
      );
    } catch (err) {
      console.error('Institution student portal refresh error:', err);
    }
  };

  const title = useMemo(() => {
    if (view === 'portal') return 'Kurum Öğrenci Paneli';
    return view === 'signup' ? 'Kurum Öğrencisi Kaydı' : 'Kurum Öğrencisi Girişi';
  }, [view]);

  if (!open) {
    return null;
  }

  const resetState = () => {
    setSignupForm(initialSignupForm);
    setLoginForm(initialLoginForm);
    setMessage(null);
    setError(null);
    setPortalContext(null);
    setView('signup');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await submitInstitutionStudentSignup(signupForm);
      setMessage(
        'Başvurunuz alındı. Kurumunuz onay verdiğinde mail adresiniz ve belirlediğiniz şifreyle giriş yapabilirsiniz.',
      );
      setView('login');
      setLoginForm((prev) => ({ ...prev, email: signupForm.email }));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Kayıt tamamlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (authError) {
        throw authError;
      }

      const user = data.user;
      if (!user) {
        throw new Error('Giriş başarısız. Lütfen tekrar deneyin.');
      }

      const request = await fetchInstitutionStudentStatus(user.id);

      if (!request) {
        setError('Bu hesap için kurum öğrenci talebi bulunamadı.');
        await supabase.auth.signOut();
        return;
      }

      if (request.status !== 'approved') {
        setMessage(
          request.status === 'pending'
            ? 'Başvurunuz kurum tarafından inceleniyor. Onaylandığında mail ile bilgilendirileceksiniz.'
            : 'Başvurunuz reddedildi. Detay için kurum yetkilinizle iletişime geçebilirsiniz.',
        );
        await supabase.auth.signOut();
        return;
      }

      const portalData = await fetchInstitutionStudentPortalData(request.institution_id, user.id);
      setPortalContext({
        request,
        blueprints: portalData.blueprints,
        results: portalData.results,
        userId: user.id,
      });
      setView('portal');
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">
            Kurum Öğrenci Erişimi
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Kurumunuzun ilettiği davet koduyla sisteme kayıt olabilir veya onay sonrası giriş yapabilirsiniz.
          </p>
        </div>

        {view !== 'portal' && (
          <div className="mb-6 flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                type="button"
                onClick={() => setView('signup')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'signup'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kaydol
              </button>
              <button
                type="button"
                onClick={() => setView('login')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Giriş yap
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {view === 'signup' && (
          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Davet Kodu
              </label>
              <input
                value={signupForm.inviteCode}
                onChange={(event) =>
                  setSignupForm((prev) => ({ ...prev, inviteCode: event.target.value.toUpperCase() }))
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Kurumunuzdan aldığınız kod"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad - Soyad
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  value={signupForm.fullName}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Adınızı ve soyadınızı giriniz"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    value={signupForm.phone}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, phone: event.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0 507 XXX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => setSignupForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) => setSignupForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Şifrenizi giriniz"
                />
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
                  Kayıt olunuyor...
                </div>
              ) : (
                'Kayıt Ol'
              )}
            </button>
          </form>
        )}

        {view === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="ornek@email.com"
                  autoComplete="username"
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
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Şifrenizi giriniz"
                  autoComplete="current-password"
                />
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
                'Giriş Yap'
              )}
            </button>
          </form>
        )}

        {view === 'portal' && portalContext && (
          <div className="max-h-[65vh] overflow-y-auto rounded-xl border border-gray-300 bg-gray-50 p-4">
            <InstitutionStudentPortal
              request={portalContext.request}
              blueprints={portalContext.blueprints}
              results={portalContext.results}
              studentId={portalContext.request.student_profile_id ?? undefined}
              userId={portalContext.userId}
              onExamSubmitted={handlePortalRefresh}
            />
          </div>
        )}

        {view !== 'portal' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-sm font-medium mb-2">İletişim</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>destek@basariyolum.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}