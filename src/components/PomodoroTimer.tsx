import { useState } from 'react';
import { Play, Pause, RotateCcw, Settings, Coffee, Zap } from 'lucide-react';
import { usePomodoro } from '../contexts/PomodoroContext';

interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

export default function PomodoroTimer() {
  const {
    settings,
    isRunning,
    timeLeft,
    mode,
    completedSessions,
    todayStats,
    toggleTimer,  // ✅ Context'ten al
    resetTimer,
    skipToNext,
    updateSettings
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'focus':
        return {
          label: 'Odaklanma Zamanı',
          color: 'from-red-500 to-orange-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-500',
          icon: Zap
        };
      case 'shortBreak':
        return {
          label: 'Kısa Mola',
          color: 'from-green-500 to-teal-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-500',
          icon: Coffee
        };
      case 'longBreak':
        return {
          label: 'Uzun Mola',
          color: 'from-blue-500 to-purple-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-500',
          icon: Coffee
        };
    }
  };

  const modeConfig = getModeConfig();
  const maxTime = mode === 'focus'
    ? settings.focusMinutes * 60
    : mode === 'shortBreak'
    ? settings.shortBreakMinutes * 60
    : settings.longBreakMinutes * 60;
  const progress = ((maxTime - timeLeft) / maxTime) * 100;

  const handleToggle = () => {
    toggleTimer();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Timer Card */}
      <div className={`${modeConfig.bgColor} rounded-2xl p-8 shadow-xl border-2 ${modeConfig.borderColor}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <modeConfig.icon className={`h-6 w-6 ${modeConfig.textColor}`} />
            <h2 className={`text-2xl font-bold ${modeConfig.textColor}`}>
              {modeConfig.label}
            </h2>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-lg ${modeConfig.textColor} hover:bg-white/50 transition-colors`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          {/* Circular Progress */}
          <svg className="w-64 h-64 mx-auto transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-300"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className={modeConfig.textColor}
              strokeLinecap="round"
            />
          </svg>

          {/* Time Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-6xl font-bold ${modeConfig.textColor}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={resetTimer}
            className={`p-4 rounded-full ${modeConfig.textColor} hover:bg-white/50 transition-colors`}
            title="Sıfırla"
          >
            <RotateCcw className="h-6 w-6" />
          </button>
          
          {/* ✅ PLAY/PAUSE BUTONU - handleToggle kullan */}
          <button
            onClick={handleToggle}
            className={`p-6 rounded-full bg-gradient-to-r ${modeConfig.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
          >
            {isRunning ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </button>

          <button
            onClick={skipToNext}
            className={`p-4 rounded-full ${modeConfig.textColor} hover:bg-white/50 transition-colors`}
            title="Sonraki Aşamaya Geç"
          >
            <span className="text-xl font-bold">⏭️</span>
          </button>
        </div>

        {/* Session Progress */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < completedSessions % settings.sessionsBeforeLongBreak
                  ? `bg-gradient-to-r ${modeConfig.color}`
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className={`text-center text-sm ${modeConfig.textColor} mt-2`}>
          {completedSessions % settings.sessionsBeforeLongBreak}/{settings.sessionsBeforeLongBreak} oturum
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {todayStats.focusSessions}
          </div>
          <div className="text-sm text-gray-600">Pomodoro</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {todayStats.totalMinutes}
          </div>
          <div className="text-sm text-gray-600">Dakika</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-md border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {todayStats.currentStreak}
          </div>
          <div className="text-sm text-gray-600">Seri</div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <PomodoroSettings
          currentSettings={settings}
          onSave={(newSettings) => {
            updateSettings(newSettings);
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// Settings Modal Component
function PomodoroSettings({ 
  currentSettings, 
  onSave, 
  onClose 
}: { 
  currentSettings: PomodoroSettings;
  onSave: (settings: PomodoroSettings) => void;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState(currentSettings);

  const presets = [
    { name: 'Klasik', focus: 25, short: 5, long: 15, sessions: 4 },
    { name: 'Uzun Odak', focus: 50, short: 10, long: 30, sessions: 4 },
    { name: 'Kısa Sprint', focus: 15, short: 3, long: 10, sessions: 3 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Pomodoro Ayarları
        </h3>

        {/* Presets */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hazır Şablonlar
          </label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map(preset => (
              <button
                key={preset.name}
                onClick={() => setSettings({
                  focusMinutes: preset.focus,
                  shortBreakMinutes: preset.short,
                  longBreakMinutes: preset.long,
                  sessionsBeforeLongBreak: preset.sessions
                })}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Settings */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Odaklanma Süresi (dakika)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={settings.focusMinutes}
              onChange={(e) => setSettings({ ...settings, focusMinutes: parseInt(e.target.value) || 25 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kısa Mola (dakika)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.shortBreakMinutes}
              onChange={(e) => setSettings({ ...settings, shortBreakMinutes: parseInt(e.target.value) || 5 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uzun Mola (dakika)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.longBreakMinutes}
              onChange={(e) => setSettings({ ...settings, longBreakMinutes: parseInt(e.target.value) || 15 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uzun Mola Öncesi Oturum Sayısı
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.sessionsBeforeLongBreak}
              onChange={(e) => setSettings({ ...settings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => onSave(settings)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}