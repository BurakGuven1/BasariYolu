import { Frown, AlertCircle, HelpCircle } from 'lucide-react';

export default function ProblemSection() {
  const problems = [
    {
      icon: Frown,
      color: 'from-red-500 to-pink-500',
      persona: 'Veli',
      quote: '"Çocuğum çalışıyor ama sonuç alamıyor"',
      pain: [
        'Hangi konuda zayıf olduğunu bilemiyor',
        'Ne kadar çalışması gerektiğini kestiremiyoruz',
        'Sadece not defterine bakarak takip ediyoruz'
      ]
    },
    {
      icon: AlertCircle,
      color: 'from-orange-500 to-yellow-500',
      persona: 'Öğretmen',
      quote: '"30 öğrencim var, hepsini takip edemiyorum"',
      pain: [
        'Kim nerede eksik, kim ilerliyor bilmiyorum',
        'Bireysel ilgi gösteremiyorum',
        'Her öğrenciye özel rapor hazırlayamıyorum'
      ]
    },
    {
      icon: HelpCircle,
      color: 'from-blue-500 to-indigo-500',
      persona: 'Öğrenci',
      quote: '"Çok çalışıyorum ama neye odaklanacağımı bilmiyorum"',
      pain: [
        'Hangi konuları çalışmalıyım?',
        'Zayıf olduğum yerleri göremiyorum',
        'Gelişimimi ölçemiyorum'
      ]
    }
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Tanıdık Geliyor mu?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Her gün binlerce veli, öğretmen ve öğrenci bu problemlerle boğuşuyor
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${problem.color} flex items-center justify-center mb-6`}>
                <problem.icon className="h-8 w-8 text-white" />
              </div>

              {/* Persona */}
              <div className="mb-4">
                <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {problem.persona}
                </span>
              </div>

              {/* Quote */}
              <blockquote className="text-xl font-bold text-gray-900 mb-6 italic">
                {problem.quote}
              </blockquote>

              {/* Pain Points */}
              <ul className="space-y-3">
                {problem.pain.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="text-red-500 mt-1">✗</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8 max-w-3xl">
            <p className="text-2xl font-bold text-gray-900 mb-4">
              Peki ya bu sorunların <span className="text-red-600">çözümü</span> olsaydı?
            </p>
            <p className="text-lg text-gray-700">
              Herkesin aynı sayfada olduğu, şeffaf ve veri odaklı bir sistem...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}