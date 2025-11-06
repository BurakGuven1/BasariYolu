
import React, { useMemo, useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Lock,
  Phone,
  User,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { registerInstitutionAccount, InstitutionSession } from '../lib/institutionApi';
import { supabase } from '../lib/supabase';

interface InstitutionRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: InstitutionSession) => void;
  onSwitchToLogin: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  institutionName: string;
  contactPhone: string;
}

const initialFormState: FormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  institutionName: '',
  contactPhone: '',
};

const isPasswordValid = (value: string) => value.length >= 8;

export default function InstitutionRegisterModal({
  isOpen,
  onClose,
  onSuccess,
  onSwitchToLogin,
}: InstitutionRegisterModalProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setLogoFile(null);
      setPreviewUrl(null);
      setLoading(false);
      setError(null);
      setPasswordVisible(false);
      setConfirmVisible(false);
    }
  }, [isOpen]);

  const logoPreview = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (!logoFile) return null;
    return URL.createObjectURL(logoFile);
  }, [logoFile, previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Lutfen logo icin gecerli bir gorsel dosyasi secin.');
      return;
    }

    setLogoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;

    if (!logoFile) {
      setError('Lutfen kurum logonuzu yukleyin.');
      return;
    }

    if (!isPasswordValid(formData.password)) {
      setError('Sifre en az 8 karakter olmalidir.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Sifreler eslesmiyor.');
      return;
    }

    setLoading(true);

    try {
      const session = await registerInstitutionAccount({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        institutionName: formData.institutionName.trim(),
        contactPhone: formData.contactPhone.trim(),
        logoFile,
      });

      await supabase.auth.signOut();
      localStorage.removeItem('institutionSession');

      onSuccess(session);
      onClose();
      if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    } catch (err: any) {
      setError(err?.message || 'Kurum kaydi olusturulurken bir hata olustu. Lutfen tekrar deneyin.');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
          aria-label="Kapat"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="grid lg:grid-cols-5">
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white">
            <div className="mb-6 flex items-center gap-3">
              <Building2 className="h-10 w-10" />
              <div>
                <p className="text-sm uppercase tracking-widest text-blue-100">BasariYolu Kurum Platformu</p>
                <h2 className="text-2xl font-bold">Kurum Kaydi</h2>
              </div>
            </div>

            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-100" />
                <span>Tek panelden ogretmen, sinif ve ogrenci yonetimi</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-100" />
                <span>Kurum logosu ile markali sinav ve rapor olusturma</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-100" />
                <span>Aktif edildiginde soru bankasi ve veli raporlari</span>
              </li>
            </ul>

            <div className="mt-8 rounded-xl border border-white/20 bg-white/10 p-4 text-sm leading-relaxed text-blue-50">
              Basvurunuzu alip en kisa surede inceleyerek hesabinizin aktivasyonunu gerceklestiriyoruz. Onay sonrasi soru
              bankasi, sinav ve ogretmen yonetimi otomatik olarak acilacak.
            </div>
          </div>

          <div className="lg:col-span-3 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Kurum Logosu
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo on izleme" className="h-full w-full object-cover" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <input
                      id="institution-logo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="institution-logo"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Logo Yukle
                    </label>
                    <p className="mt-2 text-xs text-gray-500">PNG veya SVG, maksimum 2 MB.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Yetkili Adi Soyadi
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Adiniz Soyadiniz"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Kurum Adi
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="institutionName"
                      value={formData.institutionName}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Orn. Basari Dershanesi"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ornek@kurum.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Kurum Telefonu
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+90 5xx xxx xx xx"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Sifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="********"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">En az 8 karakter olmalidir.</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Sifre Tekrar
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type={confirmVisible ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="********"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmVisible((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {confirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Kaydiniz olusturuluyor...
                  </>
                ) : (
                  'Basvuru Gonder'
                )}
              </button>

              <p className="text-xs text-gray-500">
                Basvurunuzu gonderdikten sonra ekip onayi ile hesabiniz aktive edilir.
              </p>

              <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                <span>Hesabiniz var mi? </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Kurum Girişi git
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

