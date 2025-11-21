export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Hizmet Şartları ve Kullanım Koşulları
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Hizmetin Tanımı
              </h2>
              <p className="text-gray-700">
                BaşarıYolu ("Hizmet"), öğrencilerin akademik performansını takip etmelerini,
                denemelerini analiz etmelerini ve kişiselleştirilmiş çalışma planları 
                oluşturmalarını sağlayan bir eğitim teknolojisi platformudur.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Kullanıcı Hesabı ve Güvenlik
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Hesap oluşturmak için geçerli bir e-posta adresi gereklidir</li>
                <li>Şifrenizin güvenliğinden siz sorumlusunuz</li>
                <li>Hesabınızı başkalarıyla paylaşamazsınız</li>
                <li>Şüpheli aktivite durumunda derhal bize bildirmelisiniz</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Abonelik ve Ödemeler
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Abonelik ücretleri aylık veya yıllık olarak tahsil edilir</li>
                <li>Ödemeler Paddle.com aracılığıyla güvenli şekilde işlenir</li>
                <li>Aboneliğinizi istediğiniz zaman iptal edebilirsiniz</li>
                <li>İptal sonrası mevcut dönem sonuna kadar erişim devam eder</li>
                <li>İade politikası: İlk 7 gün içinde kısmi iade garantisi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Kullanım Kısıtlamaları
              </h2>
              <p className="text-gray-700 mb-4">Hizmeti kullanırken şunları yapamazsınız:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Yasadışı veya yetkisiz amaçlarla kullanmak</li>
                <li>Sistemlere zarar vermeye çalışmak</li>
                <li>Diğer kullanıcıların verilerine erişmeye çalışmak</li>
                <li>İçeriği izinsiz kopyalamak veya dağıtmak</li>
                <li>Botlar veya otomatik sistemler kullanmak</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Fikri Mülkiyet Hakları
              </h2>
              <p className="text-gray-700">
                Platform, içerik, logolar ve diğer tüm materyaller BaşarıYolu'na aittir
                ve telif hakkı yasalarıyla korunmaktadır. İzinsiz kullanım yasaktır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Sorumluluk Reddi
              </h2>
              <p className="text-gray-700">
                BaşarıYolu, akademik başarıyı garanti etmez. Platform bir araçtır ve
                başarı kullanıcının çalışmasına bağlıdır. Sınav sonuçlarından veya
                akademik performanstan sorumlu değiliz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Hizmet Değişiklikleri
              </h2>
              <p className="text-gray-700">
                Hizmeti istediğimiz zaman değiştirme, askıya alma veya sonlandırma
                hakkını saklı tutarız. Önemli değişiklikler önceden bildirilir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. İletişim
              </h2>
              <p className="text-gray-700">
                Sorularınız için: <a href="mailto:info@basariyolum.com" className="text-blue-600 hover:underline">info@basariyolum.com</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Yürürlük
              </h2>
              <p className="text-gray-700">
                Bu şartlar, hizmeti kullanmaya başladığınız anda yürürlüğe girer.
                Devam etmeniz bu şartları kabul ettiğiniz anlamına gelir.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}