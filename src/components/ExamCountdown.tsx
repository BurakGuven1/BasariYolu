import { useState, useEffect } from 'react';
import { Calendar, Eye, EyeOff, Clock } from 'lucide-react';

const EXAM_DATES = {
  TYT: new Date('2026-06-20'),
  AYT: new Date('2026-06-21'),
  YDT: new Date('2026-06-21')
};

export default function ExamCountdown() {
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('examCountdownVisible');
    return saved !== 'false'; // Default: visible
  });
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [nextExam, setNextExam] = useState('TYT');

  useEffect(() => {
    const calculateDays = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tytDate = EXAM_DATES.TYT;
      tytDate.setHours(0, 0, 0, 0);
      
      const diffTime = tytDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysRemaining(diffDays);
      
      // Hangi sınav yakın?
      if (diffDays <= 0) {
        const aytDiff = Math.ceil((EXAM_DATES.AYT.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (aytDiff > 0) {
          setNextExam('AYT/YDT');
          setDaysRemaining(aytDiff);
        }
      }
    };

    calculateDays();
    const interval = setInterval(calculateDays, 1000 * 60 * 60); // Her saat güncelle

    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    localStorage.setItem('examCountdownVisible', String(newValue));
  };

  const getMotivationalMessage = () => {
    if (daysRemaining <= 0) return 'Sınav günü! Başarılar! 🍀';
    if (daysRemaining <= 7) return 'Son hafta! Hadi son bir gayret! 💪';
    if (daysRemaining <= 30) return 'Son ay! Hız kesme! 🚀';
    if (daysRemaining <= 90) return 'Son 3 ay! Tempo yükselsin! ⚡';
    return 'Hazırlık zamanı! Her gün sayılır! 📚';
  };

  const getProgressPercentage = () => {
    const totalDays = 365; // ~1 yıllık hazırlık
    const progress = ((totalDays - daysRemaining) / totalDays) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
        title="Sınav sayacını göster"
      >
        <Eye className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl p-6 max-w-sm z-50 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="font-bold text-lg">{nextExam} Sınavına</h3>
        </div>
        <button
          onClick={toggleVisibility}
          className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          title="Gizle"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      </div>

      {/* Gün Sayacı */}
      <div className="text-center mb-4">
        <div className="text-6xl font-bold mb-2">
          {daysRemaining > 0 ? daysRemaining : 0}
        </div>
        <div className="text-lg font-medium opacity-90">
          {daysRemaining === 1 ? 'gün kaldı' : 'gün kaldı'}
        </div>
      </div>

      <div className="text-center mb-4 text-sm opacity-90">
        {getMotivationalMessage()}
      </div>

      <div className="bg-white/20 rounded-full h-2 overflow-hidden mb-3">
        <div
          className="bg-white h-full rounded-full transition-all duration-500"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      <div className="text-xs space-y-1 opacity-75">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>TYT: 20 Haziran 2026 Cumartesi</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>AYT/YDT: 21 Haziran 2026 Pazar</span>
        </div>
      </div>
    </div>
  );
}