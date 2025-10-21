export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Gizlilik Politikası
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Toplanan Veriler
              </h2>
              <p className="text-gray-700 mb-4">Aşağıdaki kişisel verileri topluyoruz:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta, şifre (şifreli)</li>
                <li><strong>Kullanım Verileri:</strong> Deneme sonuçları, çalışma süreleri, ilerleme</li>
                <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı bilgisi, cihaz tipi</li>
                <li><strong>Ödeme Bilgileri:</strong> Paddle.com tarafından işlenir, bizde saklanmaz</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Verilerin Kullanım Amacı
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Hizmet sunumu ve hesap yönetimi</li>
                <li>Performans analizi ve öneriler</li>
                <li>Müşteri desteği</li>
                <li>Sistem güvenliği ve dolandırıcılık önleme</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Veri Güvenliği
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Tüm veriler SSL/TLS ile şifrelenir</li>
                <li>Şifreler bcrypt ile hash'lenir</li>
                <li>Supabase güvenli bulut altyapısı kullanılır</li>
                <li>Düzenli güvenlik güncellemeleri yapılır</li>
                <li>Erişim logları tutulur</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Veri Paylaşımı
              </h2>
              <p className="text-gray-700 mb-4">
                Verileriniz şu durumlarda üçüncü taraflarla paylaşılabilir:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Ödeme İşlemleri:</strong> Paddle.com (PCI-DSS uyumlu)</li>
                <li><strong>Hosting:</strong> Supabase (GDPR uyumlu)</li>
                <li><strong>Yasal Zorunluluk:</strong> Mahkeme kararı veya yasal talep</li>
                <li><strong>Rıza ile:</strong> Açık izniniz dahilinde</li>
              </ul>
              <p className="text-gray-700 mt-4">
                <strong>Verilerinizi asla satmıyoruz veya pazarlama amacıyla paylaşmıyoruz.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Kullanıcı Hakları (KVKK)
              </h2>
              <p className="text-gray-700 mb-4">
                6698 sayılı KVKK kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Verilerinize erişim hakkı</li>
                <li>Düzeltme ve güncelleme hakkı</li>
                <li>Silme (unutulma) hakkı</li>
                <li>Veri taşınabilirliği hakkı</li>
                <li>İtiraz hakkı</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Bu haklarınızı kullanmak için: <a href="mailto:kvkk@basariyolum.com" className="text-blue-600 hover:underline">kvkk@basariyolum.com</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Çerezler (Cookies)
              </h2>
              <p className="text-gray-700">
                Oturum yönetimi ve kullanıcı deneyimini iyileştirmek için çerezler kullanıyoruz.
                Zorunlu çerezler hariç, tarayıcınızdan çerezleri reddedebilirsiniz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Veri Saklama Süresi
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Aktif hesaplar: Hesap silinene kadar</li>
                <li>Silinen hesaplar: 30 gün içinde kalıcı silme</li>
                <li>Yedek kopyalar: Maks 90 gün</li>
                <li>Yasal kayıtlar: Mevzuat gereklilikleri süresi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Çocukların Gizliliği
              </h2>
              <p className="text-gray-700">
                18 yaşından küçük kullanıcılar için veli onayı gereklidir.
                Veliler çocuklarının verilerini yönetme hakkına sahiptir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Politika Değişiklikleri
              </h2>
              <p className="text-gray-700">
                Bu politikayı güncelleme hakkımız saklıdır. Önemli değişiklikler
                e-posta ile bildirilir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. İletişim
              </h2>
              <p className="text-gray-700">
                <strong>Veri Sorumlusu:</strong> BaşarıYolu Eğitim Teknolojileri<br/>
                <strong>E-posta:</strong> <a href="mailto:kvkk@basariyolum.com" className="text-blue-600 hover:underline">kvkk@basariyolum.com</a><br/>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}