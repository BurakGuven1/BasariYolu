import { generateSmartStudyPlan } from '../lib/ai';

export default function SmartStudyPlan({ studentData }: any) {
  const plan = generateSmartStudyPlan(studentData);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-2">Akıllı Çalışma Planın</h2>
        <p>AI tarafından kişiselleştirilmiş, sana özel çalışma stratejisi</p>
      </div>

      {/* Priority Focus */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">🎯 Öncelikli Odak Alanların</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {plan.focusAreas.map((area: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900">{area.subject}</h4>
              <p className="text-sm text-gray-600">Ortalama: {area.avgScore.toFixed(1)}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                area.trend === 'improving' ? 'bg-green-100 text-green-700' :
                area.trend === 'declining' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {area.trend === 'improving' ? '📈 Gelişiyor' :
                 area.trend === 'declining' ? '📉 Düşüş var' :
                 '➡️ Stabil'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-2">📅 Günlük Hedefin</h3>
        <p className="text-2xl font-bold text-orange-600">{plan.dailyGoal}</p>
      </div>

      {/* Weekly Targets */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">📊 Haftalık Hedefler</h3>
        {plan.weeklyTarget.map((target: any, idx: number) => (
          <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold">{target.subject}</h4>
            <p className="text-sm text-gray-600">{target.hoursPerWeek} saat/hafta</p>
            <ul className="mt-2 space-y-1">
              {target.specificGoals.map((goal: string, i: number) => (
                <li key={i} className="text-sm text-gray-700">✓ {goal}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Study Tips */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">💡 Çalışma İpuçları</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {plan.tips.map((tip: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-600">•</span>
              <span className="text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}