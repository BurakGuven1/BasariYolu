import { X, FileText, Check, Shield } from 'lucide-react';

interface CoachTermsModalProps {
  onClose: () => void;
}

export default function CoachTermsModal({ onClose }: CoachTermsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 z-10 rounded-t-xl">
          <div className="flex justify-between items-start text-white">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <FileText className="h-7 w-7" />
                BaşarıYolu Koçluk Sözleşmesi ve Kurallar
              </h2>
              <p className="text-indigo-100">Son Güncelleme: 10 Aralık 2024</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-gray-700 leading-relaxed">
          {/* Introduction */}
          <section>
            <p className="text-lg">
              Bu sözleşme, <strong>BaşarıYolu</strong> platformunda koç olarak hizmet vermek isteyen
              eğitmenler ile platform arasındaki ilişkiyi düzenler. Lütfen dikkatle okuyun.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-600" />
              1. Genel Hükümler
            </h3>
            <div className="space-y-2">
              <p>
                <strong>1.1.</strong> BaşarıYolu, öğrenciler ile koçları buluşturan bir eğitim
                platformudur. Platform, koçluk hizmeti sunmak isteyen eğitmenlere alt yapı sağlar.
              </p>
              <p>
                <strong>1.2.</strong> Koç, bu sözleşmeyi kabul ederek platformun belirlediği etik
                kuralları, gizlilik politikasını ve çalışma şartlarını kabul etmiş sayılır.
              </p>
              <p>
                <strong>1.3.</strong> Platform, koç başvurularını inceleme ve onaylama/reddetme hakkını
                saklı tutar. Başvuru reddi durumunda gerekçe belirtme zorunluluğu yoktur.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Koç Yükümlülükleri</h3>
            <div className="space-y-2">
              <p>
                <strong>2.1. Profesyonellik:</strong> Koç, tüm oturumlarda profesyonel davranmayı,
                zamanında hazır olmayı ve öğrenciye saygılı yaklaşmayı taahhüt eder.
              </p>
              <p>
                <strong>2.2. Gizlilik:</strong> Öğrencilerle yapılan tüm görüşmeler ve paylaşılan
                bilgiler kesinlikle gizlidir. Koç, hiçbir şekilde öğrenci bilgilerini üçüncü kişilerle
                paylaşamaz.
              </p>
              <p>
                <strong>2.3. Düzenli Müsaitlik:</strong> Koç, müsaitlik takvimini düzenli olarak
                güncellemeyi ve belirlediği saatlere sadık kalmayı kabul eder.
              </p>
              <p>
                <strong>2.4. İletişim:</strong> Platform üzerinden gelen öğrenci taleplerine en geç
                24 saat içinde dönüş yapılmalıdır.
              </p>
              <p>
                <strong>2.5. İçerik Kalitesi:</strong> Verilen koçluk hizmeti, belirtilen uzmanlık
                alanlarıyla uyumlu ve yüksek kalitede olmalıdır.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Yasaklar ve Sınırlamalar</h3>
            <div className="space-y-2">
              <p>
                <strong>3.1.</strong> Koç, öğrencilerle platform dışında iletişim kurarak özel ders
                anlaşması yapamaz. Tüm işlemler platform üzerinden gerçekleştirilmelidir.
              </p>
              <p>
                <strong>3.2.</strong> Koç, öğrencilere siyasi, dini veya ideolojik görüş dayatamaz.
                Hizmet tamamen eğitim odaklı olmalıdır.
              </p>
              <p>
                <strong>3.3.</strong> Koç, öğrencilere karşı ayrımcılık yapamaz (cinsiyet, din, ırk,
                vb. sebeplerle).
              </p>
              <p>
                <strong>3.4.</strong> Uygunsuz davranış, taciz veya herhangi bir etik dışı davranış
                kesinlikle yasaktır ve derhal hesap kapatılmasına neden olur.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">4. Ödeme ve Ücretlendirme</h3>
            <div className="space-y-2">
              <p>
                <strong>4.1.</strong> Koçluk ücretleri platform tarafından belirlenebilir veya koçun
                önerisi doğrultusunda platform yönetimi ile anlaşılarak belirlenir.
              </p>
              <p>
                <strong>4.2.</strong> Platform, gerçekleşen her koçluk seansından belirli bir komisyon
                alır. Komisyon oranı platform politikalarına göre belirlenir ve koça önceden bildirilir.
              </p>
              <p>
                <strong>4.3.</strong> Ödemeler aylık dönemler halinde, platform tarafından belirlenen
                ödeme günlerinde koçun bildirdiği hesaba aktarılır.
              </p>
              <p>
                <strong>4.4.</strong> İptal edilen veya tamamlanmayan seanslar için ödeme yapılmaz.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">5. Randevu ve İptal Politikası</h3>
            <div className="space-y-2">
              <p>
                <strong>5.1.</strong> Koç, onayladığı randevulara katılmakla yükümlüdür. Mazeretsiz
                olarak 2 kez üst üste randevuya katılmama durumunda hesap askıya alınabilir.
              </p>
              <p>
                <strong>5.2.</strong> Acil durumlarda koç, en az 4 saat önceden randevuyu iptal
                edebilir ve gerekçesini platform ile paylaşmalıdır.
              </p>
              <p>
                <strong>5.3.</strong> Öğrenci tarafından yapılan iptal talepleri, koçun onayına
                sunulur.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">6. Değerlendirme ve Geri Bildirim</h3>
            <div className="space-y-2">
              <p>
                <strong>6.1.</strong> Öğrenciler, her seans sonunda koçu değerlendirebilir. Bu
                değerlendirmeler koçun profil puanını etkiler.
              </p>
              <p>
                <strong>6.2.</strong> Sürekli düşük puan alan koçlar için platform yönetimi ile
                görüşme yapılır ve gerekirse eğitim desteği sağlanır.
              </p>
              <p>
                <strong>6.3.</strong> Ciddi şikayetler durumunda platform, koç hesabını askıya alma
                veya kapatma hakkını saklı tutar.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">7. Fikri Mülkiyet ve Telif Hakları</h3>
            <div className="space-y-2">
              <p>
                <strong>7.1.</strong> Koç, platformda paylaştığı tüm içeriklerin (notlar, materyaller,
                vb.) telif haklarına sahip olduğunu ve üçüncü kişilerin haklarını ihlal etmediğini
                garanti eder.
              </p>
              <p>
                <strong>7.2.</strong> Platformda verilen koçluk seanslarının kayıt altına alınması
                platform tarafından kalite kontrol amacıyla yapılabilir.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">8. Sözleşme Süresi ve Fesih</h3>
            <div className="space-y-2">
              <p>
                <strong>8.1.</strong> Bu sözleşme, koç başvurusunun onaylanması ile başlar ve taraflardan
                biri feshetmediği sürece devam eder.
              </p>
              <p>
                <strong>8.2.</strong> Koç, 30 gün önceden bildirimde bulunarak sözleşmeyi feshedebilir.
              </p>
              <p>
                <strong>8.3.</strong> Platform, sözleşmeyi ihlal durumunda koçu derhal feshedebilir.
              </p>
              <p>
                <strong>8.4.</strong> Sözleşme sona erdiğinde, devam eden randevuların tamamlanması
                beklenir veya iptal edilir.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">9. Sorumluluk Sınırlaması</h3>
            <div className="space-y-2">
              <p>
                <strong>9.1.</strong> Platform, koç ile öğrenci arasındaki ilişkiden doğan
                anlaşmazlıklarda aracı role sahiptir. Nihai sorumluluk taraflara aittir.
              </p>
              <p>
                <strong>9.2.</strong> Teknik aksaklıklar veya mücbir sebepler nedeniyle platformun
                geçici olarak erişilemez olması durumunda platform sorumlu tutulamaz.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">10. Değişiklikler</h3>
            <div className="space-y-2">
              <p>
                <strong>10.1.</strong> Platform, bu sözleşme şartlarını değiştirme hakkını saklı
                tutar. Değişiklikler koçlara email ile bildirilir.
              </p>
              <p>
                <strong>10.2.</strong> Değişikliklere itiraz eden koç, sözleşmeyi feshetme hakkına
                sahiptir.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-3">11. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h3>
            <div className="space-y-2">
              <p>
                <strong>11.1.</strong> Bu sözleşme Türkiye Cumhuriyeti kanunlarına tabidir.
              </p>
              <p>
                <strong>11.2.</strong> Sözleşmeden doğan uyuşmazlıklarda öncelikle dostane çözüm
                aranır. Çözülemezse İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
              </p>
            </div>
          </section>

          {/* Final Note */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6 mt-8">
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-indigo-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Sözleşmeyi Onaylıyorum</h4>
                <p className="text-sm text-gray-700">
                  Yukarıdaki koşulları okudum, anladım ve kabul ediyorum. BaşarıYolu platformunda
                  koç olarak çalışmak için başvurumu bu şartlar çerçevesinde yapıyorum.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
