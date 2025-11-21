export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            İptal ve İade Politikası
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. 7 Gün Para İade Garantisi
              </h2>
              <p className="text-gray-700">
                İlk aboneliğinizden sonraki 7 gün içinde herhangi bir nedenle
                memnun kalmazsanız, <strong>kısmi iade</strong> talep edebilirsiniz.
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>İade için <a href="mailto:destek@basariyolum.com" className="text-blue-600 hover:underline">destek@basariyolum.com</a> adresine e-posta gönderin</li>
                <li>İade talebi 2-5 iş günü içinde işleme alınır</li>
                <li>Para iadeniz 7 iş günü içinde hesabınıza geri döner</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Abonelik İptali
              </h2>
              <p className="text-gray-700 mb-4">
                Aboneliğinizi istediğiniz zaman iptal edebilirsiniz:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Hesabınızdan "Aboneliğim" sekmesine gidin</li>
                <li>"Aboneliği İptal Et" butonuna tıklayın</li>
                <li>İptal sonrası mevcut dönem sonuna kadar erişiminiz devam eder</li>
                <li>Yeni dönem için ücret tahsil edilmez</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Kısmi İade
              </h2>
              <p className="text-gray-700">
                7 günlük garanti süresi sonrası yapılan iptal taleplerinde
                kısmi iade yapılmaz.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Yıllık Abonelik İptali
              </h2>
              <p className="text-gray-700">
                Yıllık aboneliklerde:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>İlk 7 gün: Kısmi iade</li>
                <li>7 günden sonra: Kalan süre için iade yapılmaz</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Hesap Dondurma
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
                <li>Verileriniz korunur</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Teknik Sorunlar
              </h2>
              <p className="text-gray-700">
                Platformda yaşanan teknik sorunlar nedeniyle hizmete erişememeniz
                durumunda, aksama süresi kadar aboneliğiniz uzatılır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. İletişim
              </h2>
              <p className="text-gray-700">
                İade ve iptal talepleri için:<br/>
                <strong>E-posta:</strong> <a href="mailto:destek@basariyolum.com" className="text-blue-600 hover:underline">destek@basariyolum.com</a><br/>
                <strong>Cevap süresi:</strong> 24-48 saat
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}