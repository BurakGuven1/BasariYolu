interface SiteFooterProps {
  onNavigateToBlog: () => void;
  onNavigateToTerms: () => void;
  onNavigateToPrivacy: () => void;
  onNavigateToRefund: () => void;
}

export default function SiteFooter({
  onNavigateToBlog,
  onNavigateToTerms,
  onNavigateToPrivacy,
  onNavigateToRefund
}: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">BaşarıYolum</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Türkiye&apos;nin en kapsamlı öğrenci takip platformu. Yapay zeka desteğiyle öğrencilerin,
              velilerin ve öğretmenlerin gelişimini tek ekrandan yönetin.
            </p>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <p>
                E-posta:{' '}
                <a href="mailto:support@basariyolum.com" className="text-white hover:underline">
                  support@basariyolum.com
                </a>
              </p>
              <p>
                Telefon:{' '}
                <a href="tel:+908508850000" className="text-white hover:underline">
                  0 (850) 885 00 00
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Öne Çıkan Özellikler</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Deneme ve net takibi</li>
              <li>AI destekli çalışma planı</li>
              <li>Veli kontrol paneli</li>
              <li>Sınıf yönetim araçları</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Keşfet</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={onNavigateToBlog} className="hover:text-white transition-colors">
                  Blog
                </button>
              </li>
              <li>
                <a href="https://www.basariyolum.com/referanslar" className="hover:text-white transition-colors">
                  Başarı hikayeleri
                </a>
              </li>
              <li>
                <a href="https://www.basariyolum.com/sss" className="hover:text-white transition-colors">
                  Sıkça sorulan sorular
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/basariyolum" className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resmi</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <button onClick={onNavigateToTerms} className="hover:text-white transition-colors">
                  Kullanım Şartları
                </button>
              </li>
              <li>
                <button onClick={onNavigateToPrivacy} className="hover:text-white transition-colors">
                  Gizlilik Politikası
                </button>
              </li>
              <li>
                <button onClick={onNavigateToRefund} className="hover:text-white transition-colors">
                  İptal ve İade
                </button>
              </li>
              <li>
                <a href="https://www.basariyolum.com/kvkk" className="hover:text-white transition-colors">
                  KVKK Aydınlatma Metni
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm space-y-3">
          <p>© {currentYear} BaşarıYolum. Tüm hakları saklıdır.</p>
          <p className="text-xs">
            Basariyolum Eğitim Teknolojileri A.Ş. | Beyoğlu, İstanbul · MERSİS No: 0123456789012345
          </p>
        </div>
      </div>
    </footer>
  );
}
