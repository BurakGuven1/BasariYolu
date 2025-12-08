import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import institution from '../animations/institution.json';
import learning from '../animations/learning.json';
import student from '../animations/student.json';
import teacher from '../animations/teacher.json';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Users,
  Award,
  Target,
  TrendingUp,
  Clock,
  Brain,
  Sparkles,
  Zap,
  Heart,
  BarChart3,
  CheckCircle2,
  TrainFront,
  HandCoins,
} from 'lucide-react';

// Hero Section - Apple style
function HeroSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <motion.section
      ref={ref}
      style={{ opacity, scale }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-indigo-600 dark:text-indigo-400 font-semibold text-lg mb-4 tracking-wide"
          >
            EĞİTİMDE YENİ ÇAĞIN PLATFORMU
          </motion.p>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
            Başarı Yolu
          </h1>
          <p className="text-2xl md:text-4xl font-light text-gray-700 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Öğrenci, öğretmen, veli ve kurumları bir araya getiren{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">mükemmel uyum</span>
          </p>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Yapay zeka destekli kişiselleştirilmiş eğitim deneyimi. Her öğrenci için özel bir yolculuk.
            5-12. sınıf-Mezun, LGS, TYT ve AYT  hazırlık süreçlerinde yanınızdayız.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-20"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            1000+ öğrenci, 120+ öğretmen tarafından güvenle kullanılıyor
          </p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-gray-600 dark:bg-gray-400 rounded-full"
          />
        </div>
      </motion.div>
    </motion.section>
  );
}

// User Type Card
interface UserTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  features: string[];
  index: number;
}

function UserTypeCard({ icon, title, description, color, features, index }: UserTypeCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 group-hover:border-transparent h-full">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <CheckCircle2 className={`w-5 h-5 mt-0.5 shrink-0 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// Platform Overview Section
function PlatformOverview() {
  const userTypes = [
    {
      icon: <GraduationCap className="w-8 h-8 text-white" />,
      title: 'Öğrenci',
      description: 'Kişiselleştirilmiş öğrenme deneyimi ile hedeflerine ulaş',
      color: 'from-blue-500 to-indigo-600',
      features: [
        'Yapamadığınız soruyu Yapay Zeka Asistanına veya soru portalındaki öğrencilere sorun',
        'Yapay zeka destekli konu analizi',
        'ÖSYM ve MEB sınavlarında çıkmış konuların analizine göre yönlendirme',
        'Deneme sonuçlarınıza göre size özel öneriler,kaynak yönlendirmeleri',
        'Pomodoro tekniği ile verimli çalışma',
        'Gerçek zamanlı performans takibi',
        'Öğretmen ve kurumunuzdan anlık geri bildirimler',
        'Yapay Zeka destekli ders çalışma planı',
        'Her konunun Özet PDF notları ve Formül Kartları',
        'Big Five kişilik analizi ile her öğrenciye uygun motivasyon önerileri',
        'Ve sayamadığımız birçok özellik',
      ],
    },
    {
      icon: <Building2 className="w-8 h-8 text-white" />,
      title: 'Kurum',
      description: 'Tüm eğitim süreçlerinizi tek platformdan yönetin',
      color: 'from-purple-500 to-pink-600',
      features: [
        'Kurumunuza ait öğrencileriniz Gelişmiş paket özelliklerinden faydalansın',
        'Kurumunuzu takip edin, dijitalleştirin diğer kurumlardan bir adım önde olun',
        'Tek tıkla Öğrenci Listesi-Performans Raporu-Sınav Sonuçları gibi ihtiyaçlarınızı PDF ve Excel olarak indirin',
        'Kapsamlı soru bankası yönetimi',
        'Öğrenci ve öğretmen takibi',
        'Detaylı performans raporları',
        'Duyuru ve iletişim araçları',
        'Kurum içi denemeleri ve performans takibini sağlayın',
        'Kurumunuza özel ders programı oluşturun',
        'Ve sayamadığımız birçok özellik'
      ],
    },
    {
      icon: <BookOpen className="w-8 h-8 text-white" />,
      title: 'Öğretmen',
      description: 'Öğrencilerinizi en iyi şekilde destekleyin',
      color: 'from-green-500 to-emerald-600',
      features: [
        'Sınıf yönetimi ve öğrenci bazlı takip',
        'Özel ödev ve quiz oluşturma',
        'Kişiye özel veya sınıf geneline ders çalışma programı hazırlama',
        'Öğrenci gelişim raporları',
        'İletişim ve duyuru sistemi',
        'Ders planı ve materyal paylaşımı',
        'Soru Bankası',
        'Ödev verin, sınav sonuçlarını açıklayın'
      ],
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: 'Veli',
      description: 'Çocuğunuzun eğitim sürecini yakından ve ücretsiz takip edin',
      color: 'from-orange-500 to-red-600',
      features: [
        'Velilere ücretsiz takip paneli',
        'Gerçek zamanlı başarı takibi',
        'Detaylı çalışma raporları',
        'Günlük aktivite özeti',
        'Hedef belirleme ve izleme',
        'Öğrencinizin ödevlerini ve denemelerini takip edin',
      ],
    },
  ];

  return (
    <section className="py-32 px-6 bg-white dark:bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.05),transparent_50%)]" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-4 text-lg">
            HERKESİN KATKISINI GÜÇLENDİRİN
          </p>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Dört Farklı Perspektif,
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Bir Ortak Hedef
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Eğitim ekosistemindeki her paydaş için özel olarak tasarlanmış araçlar ve özellikler
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {userTypes.map((type, index) => (
            <UserTypeCard key={type.title} {...type} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Feature Highlight Section
interface FeatureHighlightProps {
  reverse?: boolean;
  badge: string;
  title: string;
  description: string;
  features: Array<{ icon: React.ReactNode; title: string; text: string }>;
  gradient: string;
  animationData?: any;
}

function FeatureHighlight({ reverse, badge, title, description, features, gradient, animationData }: FeatureHighlightProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-32 px-6 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${reverse ? 'lg:grid-flow-dense' : ''}`}>
        <motion.div
          initial={{ opacity: 0, x: reverse ? 50 : -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 50 : -50 }}
          transition={{ duration: 0.8 }}
          className={reverse ? 'lg:col-start-2' : ''}
        >
          <p className="text-indigo-600 dark:text-indigo-400 font-semibold mb-4 text-sm tracking-wider uppercase">
            {badge}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
            {title}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">{description}</p>

          <div className="space-y-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: reverse ? -50 : 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? -50 : 50 }}
          transition={{ duration: 0.8 }}
          className={reverse ? 'lg:col-start-1 lg:row-start-1' : ''}
        >
          <div className={`relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${gradient} p-1`}>
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 aspect-square flex items-center justify-center">
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  loop
                  className="w-full h-full max-w-md"
                />
              ) : (
                <div className="text-center">
                  <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${gradient} opacity-20`} />
                  <p className="text-gray-500 dark:text-gray-400">Showcase Image/Animation</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Stats Section
function StatsSection() {
  const stats = [
    { value: '1,000+', label: 'Aktif Öğrenci' },
    { value: '120+', label: 'Öğretmen' },
    { value: '10+', label: 'Kurum' },
    { value: '%95', label: 'Memnuniyet' },
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-12"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-indigo-100 text-lg">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-32 px-6 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"
        />
      </div>
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Başarı Yolculuğuna
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Bugün Başlayın
            </span>
          </h2>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => (window.location.href = "/")}
              className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              Haydi Sen de Başla
            </button>
            <a
              href="https://wa.me/905074938307"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-600 dark:hover:border-indigo-400 text-gray-900 dark:text-white rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 justify-center"
            >
              Satış Ekibiyle Görüş
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Main Component
export default function FeaturesShowcase() {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 overflow-x-hidden relative">
      <button
        onClick={() => (navigate(-1), window.scrollTo(0, 0))}
        className="hidden md:inline-flex items-center gap-2 absolute top-6 left-6 z-20 rounded-full bg-white/80 dark:bg-gray-800/80 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-md backdrop-blur hover:shadow-lg transition"
      >
        <span className="text-lg">←</span>
        Önceki sayfaya dön
      </button>

      <HeroSection />
      <PlatformOverview />

      {/* Student Features */}
      <FeatureHighlight
        badge="ÖĞRENCİ DENEYİMİ"
        title="Yapay Zeka ile Kişiselleştirilmiş Öğrenme"
        description="Her öğrenci benzersizdir. Platformumuz, her öğrencinin güçlü ve zayıf yönlerini analiz ederek özel bir öğrenme yolu oluşturur."
        gradient="from-blue-500 to-indigo-600"
        animationData={student}
        features={[
          {
            icon: <TrainFront className="w-6 h-6 text-white" />,
            title: 'Çözülemeyen soru ve anlaşılmayan konuları için Yapay Zeka Asistanı',
            text: 'Yapamadığınız soruları ve anlamadığınız konuları anında sorun, detaylı açıklamalar alın',
          },
          {
            icon: <Brain className="w-6 h-6 text-white" />,
            title: 'Akıllı Konu Analizi',
            text: 'Hangi konularda zorlandığınızı tespit eder ve özel çalışma planı oluşturur',
          },
          {
            icon: <Target className="w-6 h-6 text-white" />,
            title: 'Hedef Odaklı Çalışma',
            text: 'TYT, AYT, LGS veya özel hedefleriniz için optimize edilmiş içerik',
          },
          {
            icon: <TrendingUp className="w-6 h-6 text-white" />,
            title: 'Gerçek Zamanlı İlerleme',
            text: 'Her çalışmanızın etkisini anında görün, motivasyonunuzu koruyun',
          },
          {
            icon: <Target className="w-6 h-6 text-white" />,
            title: 'Her Konu İçin Özet PDF Notlar ve Formül Kartları',
            text: 'Kısa süreli tekrarlarınız için özet notlar ve formül kartlarıyla bilgilerinizi pekiştirin',
          },
          
        ]}
      />

      {/* Institution Features */}
      <FeatureHighlight
        reverse
        badge="KURUM YÖNETİMİ"
        title="Tüm Eğitim Süreçlerinizi Tek Platformda Yönetin"
        description="Soru bankası, öğrenci takibi, performans analizi ve daha fazlası. Kurumunuzu dijital çağa taşıyın."
        gradient="from-purple-500 to-pink-600"
        animationData={institution}
        features={[
          {
            icon: <Award className="w-6 h-6 text-white" />,
            title: 'Öğrenciye özel deneme performans raporu',
            text: 'Kurum içi yaptığınız denemelerde her öğrenciye özel konu konu performans raporu',
          },
          {
            icon: <BarChart3 className="w-6 h-6 text-white" />,
            title: 'Detaylı Raporlama',
            text: 'Öğrenci başarılarını, öğretmen performansını anlık takip edin',
          },
          {
            icon: <Brain className="w-6 h-6 text-white" />,
            title: 'Öğrencileriniz ücretsiz bir şekilde platformun gelişmiş özelliklerine erişebilir.',
            text: 'Öğrencileriniz yapay zeka destekli kişiselleştirilmiş öğrenme deneyiminden faydalansın',
          },
          {
            icon: <Zap className="w-6 h-6 text-white" />,
            title: 'Hiç bir entegrasyon sorunu yaşamayın',
            text: 'Web sitemiz üzerinden kurum panelinize kolayca erişin ve yönetin',
          },
        ]}
      />

      {/* Teacher Features */}
      <FeatureHighlight
        badge="ÖĞRETMEN ARAÇLARI"
        title="Öğrencilerinize Daha İyi Destek Olun"
        description="Sınıf yönetiminden performans analizine, tüm ihtiyacınız olan araçlar parmaklarınızın ucunda."
        gradient="from-green-500 to-emerald-600"
        animationData={teacher}
        features={[
          {
            icon: <BookOpen className="w-6 h-6 text-white" />,
            title: 'Kolay Ders Yönetimi',
            text: 'Sınıflarınızı, ödevlerinizi ve sınavlarınızı kolayca organize edin',
          },
          {
            icon: <HandCoins className="w-6 h-6 text-white" />,
            title: 'Sınıfa ve Öğrenciye Özel Ders Çalışma Programı Oluşturma',
            text: 'Her öğrenciye veya sınıfa özel ders çalışma programları hazırlayın ve geri bildirimler alın',
          },
          {
            icon: <Award className="w-6 h-6 text-white" />,
            title: 'Öğrenci Gelişim Takibi',
            text: 'Her öğrencinin ilerlemesini detaylı raporlarla izleyin',
          },
          {
            icon: <Sparkles className="w-6 h-6 text-white" />,
            title: 'Sınav-quiz sonuçları ve ödev yönetimi',
            text: 'Sınav-quiz sonuçlarınızı açıklayın ve ödevler oluşturun',
          },
        ]}
      />

      {/* Parent Features */}
      <FeatureHighlight
        reverse
        badge="VELİ TAKİBİ"
        title="Çocuğunuzun Başarı Yolculuğunda Yanında Olun"
        description="Çocuğunuzun eğitim sürecini gerçek zamanlı takip edin, öğretmenleriyle iletişimde kalın."
        gradient="from-orange-500 to-red-600"
        animationData={learning}
        features={[
          {
            icon: <HandCoins className="w-6 h-6 text-white" />,
            title: 'Ücretsiz',
            text: 'Velilere özel ücretsiz takip paneli',
          },
          {
            icon: <Heart className="w-6 h-6 text-white" />,
            title: 'Huzur Veren Takip',
            text: 'Çocuğunuzun çalışma saatlerini, başarılarını anında görün',
          },
          {
            icon: <Clock className="w-6 h-6 text-white" />,
            title: 'Günlük Özetler',
            text: 'Her gün ne kadar çalıştı, hangi konuları tamamladı öğrenin',
          },
          {
            icon: <CheckCircle2 className="w-6 h-6 text-white" />,
            title: 'Çocuk-Ebeveyn İletişimi',
            text: 'Sınav sürecinde öğrencilerinize doğru veli rehberliği sağlayın',
          },
        ]}
      />

      <StatsSection />
      <CTASection />
    </div>
  );
}

