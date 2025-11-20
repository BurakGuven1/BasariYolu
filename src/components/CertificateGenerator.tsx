import React, { useRef } from 'react';
import { X, Download, Share2, Instagram, Twitter, Linkedin } from 'lucide-react';
import html2canvas from 'html2canvas';

interface Certificate {
  id: string;
  achievement_type: string;
  achievement_title: string;
  achievement_description: string;
  icon: string;
  certificate_number: string;
  earned_at: string;
}

interface CertificateGeneratorProps {
  certificate: Certificate;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificateGenerator({
  certificate,
  studentName,
  isOpen,
  onClose,
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const earnedDate = new Date(certificate.earned_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `basariyolu-sertifika-${certificate.certificate_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Certificate download error:', error);
      alert('Sertifika indirilirken bir hata oluştu.');
    }
  };

  const handleShare = async (platform: string) => {
    const text = `${certificate.achievement_title} - BaşarıYolu'nda başarılarımı paylaşmaktan mutluluk duyuyorum! 🎓 #BaşarıYolu #Başarı`;
    const url = 'https://basariyolum.com';

    // First download the certificate
    await handleDownload();

    // Open social media share URLs
    const shareUrls: Record<string, string> = {
      instagram: 'https://www.instagram.com/', // Instagram doesn't support direct sharing URLs
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (platform === 'instagram') {
      alert('Sertifika indirildi! Instagram uygulamasını açın ve indirilen sertifikayı paylaşın.');
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }

    // Track share event
    // You can add analytics tracking here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Sertifikanız Hazır! 🎉</h2>
          <p className="text-gray-600 mt-2">
            Başarınızı sosyal medyada paylaşın ve arkadaşlarınıza ilham verin!
          </p>
        </div>

        {/* Certificate */}
        <div
          ref={certificateRef}
          className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-12 shadow-2xl mb-6 border-8 border-double border-yellow-400"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="text-9xl font-bold text-gray-900">BAŞARIYOLU</div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Logo/Badge */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-5xl mb-6 shadow-lg">
              {certificate.icon}
            </div>

            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">
              Başarı Sertifikası
            </h1>

            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto mb-8 rounded-full" />

            <p className="text-lg text-gray-700 mb-6">Bu belge,</p>

            <h2 className="text-4xl font-bold text-blue-600 mb-6">{studentName}</h2>

            <p className="text-xl text-gray-800 mb-8 leading-relaxed max-w-2xl mx-auto">
              <span className="font-bold text-2xl">{certificate.achievement_title}</span>
              <br />
              <span className="text-gray-600">{certificate.achievement_description}</span>
            </p>

            {/* Date and Certificate Number */}
            <div className="grid grid-cols-2 gap-8 max-w-xl mx-auto mb-8">
              <div className="text-left">
                <p className="text-sm text-gray-500 mb-1">Tarih</p>
                <p className="text-lg font-semibold text-gray-900">{earnedDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Sertifika No</p>
                <p className="text-lg font-semibold text-gray-900">{certificate.certificate_number}</p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="border-t-2 border-gray-300 pt-6">
              <div className="flex justify-center items-center gap-12">
                <div>
                  <div className="border-b-2 border-gray-400 w-40 mb-2" />
                  <p className="text-sm text-gray-600">BaşarıYolu</p>
                  <p className="text-xs text-gray-500">Eğitim Platformu</p>
                </div>
                <div>
                  <img
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%234F46E5' stroke-width='2'%3E%3Cpath d='M22 10v6M2 10l10-5 10 5-10 5z'/%3E%3Cpath d='M6 12v5c3 3 9 3 12 0v-5'/%3E%3C/svg%3E"
                    alt="Logo"
                    className="h-16 w-16 opacity-50"
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Sertifika doğrulama: basariyolum.com/verify/{certificate.certificate_number}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleDownload}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Sertifikayı İndir
          </button>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleShare('instagram')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              <Instagram className="w-5 h-5" />
              <span className="hidden sm:inline">Instagram</span>
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="bg-blue-400 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Twitter className="w-5 h-5" />
              <span className="hidden sm:inline">Twitter</span>
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              <Linkedin className="w-5 h-5" />
              <span className="hidden sm:inline">LinkedIn</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 İpucu: Sertifikanızı sosyal medyada paylaşarak arkadaşlarınıza ilham verin!</p>
        </div>
      </div>
    </div>
  );
}
