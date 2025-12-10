import { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Loader, Camera, FileText, Award, Phone, Mail, User, Briefcase } from 'lucide-react';
import {
  submitCoachApplication,
  uploadCoachAvatar,
  getSpecializationOptions,
  type CoachApplicationInput,
} from '../../lib/coachingApi';
import CoachTermsModal from './CoachTermsModal';

interface CoachApplicationFormProps {
  teacherId: string;
  teacherEmail?: string;
  teacherName?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function CoachApplicationForm({
  teacherId,
  teacherEmail = '',
  teacherName = '',
  onSuccess,
  onClose,
}: CoachApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<CoachApplicationInput>({
    full_name: teacherName || '',
    email: teacherEmail || '',
    phone: '',
    avatar_url: undefined,
    experience_years: 1,
    bio: '',
    specializations: [],
    hourly_rate: undefined,
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const specializationOptions = getSpecializationOptions();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, avatar: 'Lütfen geçerli bir resim dosyası seçin' }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Dosya boyutu 2MB\'dan küçük olmalıdır' }));
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrors((prev) => ({ ...prev, avatar: '' }));

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const url = await uploadCoachAvatar(teacherId, file);
      setFormData((prev) => ({ ...prev, avatar_url: url }));
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setErrors((prev) => ({ ...prev, avatar: 'Fotoğraf yüklenirken hata oluştu' }));
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSpecializationToggle = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Ad Soyad zorunludur';
    if (!formData.email.trim()) newErrors.email = 'Email zorunludur';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Geçerli bir email adresi girin';
    if (!formData.phone.trim()) newErrors.phone = 'Telefon numarası zorunludur';
    if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) newErrors.phone = 'Geçerli bir telefon numarası girin (10-11 rakam)';
    if (formData.experience_years < 0) newErrors.experience_years = 'Deneyim yılı 0 veya daha büyük olmalıdır';
    if (!formData.bio.trim()) newErrors.bio = 'Açıklama zorunludur';
    if (formData.bio.length < 100) newErrors.bio = 'Açıklama en az 100 karakter olmalıdır';
    if (formData.specializations.length === 0) newErrors.specializations = 'En az 1 uzmanlık alanı seçin';
    if (formData.specializations.length > 5) newErrors.specializations = 'En fazla 5 uzmanlık alanı seçebilirsiniz';
    if (!formData.terms_accepted) newErrors.terms = 'Koçluk sözleşmesini kabul etmelisiniz';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await submitCoachApplication(teacherId, formData);
      alert('✅ Başvurunuz başarıyla gönderildi! İncelendikten sonra size dönüş yapılacaktır.');
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      alert('Başvuru gönderilirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">🎓 Koç Başvuru Formu</h1>
        <p className="text-indigo-100">
          BaşarıYolu platformunda koç olarak çalışmak için başvurunuzu yapın
        </p>
      </div>

      {/* Avatar Upload */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          <Camera className="inline h-5 w-5 mr-2" />
          Profil Fotoğrafı
        </label>
        <div className="flex items-start gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border-4 border-indigo-200">
                <Camera className="h-12 w-12 text-indigo-400" />
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Loader className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
            >
              {uploadingAvatar ? 'Yükleniyor...' : 'Fotoğraf Seç'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Öğrencilerin göreceği profil fotoğrafınızı yükleyin
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG veya WebP • Maksimum 2MB
            </p>
            {errors.avatar && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.avatar}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <User className="h-6 w-6 text-indigo-600" />
          Kişisel Bilgiler
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Soyad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ahmet Yılmaz"
            />
            {errors.full_name && (
              <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ornek@email.com"
              />
            </div>
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5XX XXX XX XX"
              />
            </div>
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deneyim (Yıl) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))
                }
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.experience_years ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.experience_years && (
              <p className="text-sm text-red-600 mt-1">{errors.experience_years}</p>
            )}
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-indigo-600" />
          Profesyonel Bilgiler
        </h3>

        {/* Bio */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kendinizi Tanıtın <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            rows={6}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-colors ${
              errors.bio ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Deneyimlerinizi, eğitim yaklaşımınızı, başarı hikayelerinizi paylaşın... (minimum 100 karakter)"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              {formData.bio.length} / 100 karakter (minimum)
            </p>
            {errors.bio && <p className="text-sm text-red-600">{errors.bio}</p>}
          </div>
        </div>

        {/* Specializations */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Uzmanlık Alanlarınız <span className="text-red-500">*</span> (1-5 adet)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {specializationOptions.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => handleSpecializationToggle(spec)}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-all text-left ${
                  formData.specializations.includes(spec)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                }`}
              >
                {formData.specializations.includes(spec) && (
                  <Check className="inline h-4 w-4 mr-1" />
                )}
                {spec}
              </button>
            ))}
          </div>
          {errors.specializations && (
            <p className="text-sm text-red-600 mt-2">{errors.specializations}</p>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Koçluk Sözleşmesi
        </h3>

        <div className={`border-2 rounded-lg p-4 ${errors.terms ? 'border-red-500' : 'border-gray-300'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.terms_accepted}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, terms_accepted: e.target.checked }))
              }
              className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              BaşarıYolu platformu{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-indigo-600 font-semibold underline hover:text-indigo-700"
              >
                Koçluk Sözleşmesi ve Kurallarını
              </button>{' '}
              okudum ve kabul ediyorum. <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.terms && (
            <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.terms}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-4">
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> Zorunlu alanlar
        </p>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="h-6 w-6 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Check className="h-6 w-6" />
              Başvuruyu Gönder
            </>
          )}
        </button>
      </div>

      {/* Terms Modal */}
      {showTerms && <CoachTermsModal onClose={() => setShowTerms(false)} />}
    </form>
  );
}
