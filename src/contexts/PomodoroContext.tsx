import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

interface PomodoroState {
  isRunning: boolean;
  timeLeft: number;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  completedSessions: number;
  startTime: number | null;
}

interface PomodoroContextType {
  settings: PomodoroSettings;
  isRunning: boolean;
  timeLeft: number;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  completedSessions: number;
  todayStats: {
    focusSessions: number;
    totalMinutes: number;
    currentStreak: number;
  };
  toggleTimer: () => void;
  resetTimer: () => void;
  skipToNext: () => void;
  updateSettings: (newSettings: PomodoroSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const STORAGE_KEY = 'pomodoro-state';
const SETTINGS_KEY = 'pomodoro-settings';

function getStoredState(): PomodoroState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredState(state: PomodoroState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

function getStoredSettings(): PomodoroSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4
    };
  } catch {
    return {
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4
    };
  }
}

export function PomodoroProvider({ children, studentId }: { children: ReactNode; studentId?: string }) {
  console.log('🍅 PomodoroProvider mounted with studentId:', studentId);

  const [settings, setSettings] = useState<PomodoroSettings>(getStoredSettings());
  
  const storedState = getStoredState();
  const [isRunning, setIsRunning] = useState(storedState?.isRunning || false);
  const [timeLeft, setTimeLeft] = useState(storedState?.timeLeft || settings.focusMinutes * 60);
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>(storedState?.mode || 'focus');
  const [completedSessions, setCompletedSessions] = useState(storedState?.completedSessions || 0);
  const [todayStats, setTodayStats] = useState({
    focusSessions: 0,
    totalMinutes: 0,
    currentStreak: 0
  });

  const intervalRef = useRef<number | null>(null);
  const studentIdRef = useRef(studentId);

  // Update studentIdRef when it changes
  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    setStoredState({
      isRunning,
      timeLeft,
      mode,
      completedSessions,
      startTime: isRunning ? Date.now() : null
    });
  }, [isRunning, timeLeft, mode, completedSessions]);

  // Load today stats
  useEffect(() => {
    const loadTodayStats = async () => {
      if (!studentId) return;
      
      try {
        const { supabase } = await import('../lib/supabase');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('student_id', studentId)
          .gte('started_at', today.toISOString())
          .eq('session_type', 'focus')
          .eq('completed', true);

        if (error) throw error;

        const stats = {
          focusSessions: data?.length || 0,
          totalMinutes: data?.reduce((sum: number, session: any) => sum + session.duration_minutes, 0) || 0,
          currentStreak: data?.length || 0
        };

        setTodayStats(stats);
        console.log('✅ Today stats loaded:', stats);
      } catch (error) {
        console.error('❌ Error loading today stats:', error);
      }
    };

    loadTodayStats();
  }, [studentId]);

  // Timer logic - KRITIK: Bu effect asla unmount olmamalı
  useEffect(() => {
    console.log('⏰ Timer effect - isRunning:', isRunning, 'timeLeft:', timeLeft);

    if (isRunning && timeLeft > 0) {
      console.log('✅ Starting interval');
      
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          console.log('⏰ Tick:', newTime);
          
          if (newTime <= 0) {
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => {
        console.log('🧹 Cleaning up interval');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      console.log('⏹️ Not running or completed');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRunning, timeLeft]);

  // Watch for timer completion
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      console.log('✅ Timer reached 0, completing...');
      handleTimerComplete();
    }
  }, [timeLeft, isRunning]);

  // Notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleTimerComplete = async () => {
    console.log('✅ Timer complete!');
    setIsRunning(false);
    playSound();
    showNotification();

    const currentStudentId = studentIdRef.current;

    if (mode === 'focus') {
      // Save session to database
      if (currentStudentId) {
        try {
          const { supabase } = await import('../lib/supabase');
          const startTime = new Date(Date.now() - settings.focusMinutes * 60 * 1000);
          
          const { error } = await supabase
            .from('pomodoro_sessions')
            .insert([{
              student_id: currentStudentId,
              session_type: 'focus',
              duration_minutes: settings.focusMinutes,
              completed: true,
              started_at: startTime.toISOString(),
              completed_at: new Date().toISOString()
            }]);

          if (error) throw error;
          console.log('✅ Pomodoro session saved');
        } catch (error) {
          console.error('❌ Error saving pomodoro session:', error);
        }
      }

      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      setTodayStats(prev => ({
        focusSessions: prev.focusSessions + 1,
        totalMinutes: prev.totalMinutes + settings.focusMinutes,
        currentStreak: prev.currentStreak + 1
      }));

      if (newCompletedSessions % settings.sessionsBeforeLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
    } else {
      setMode('focus');
      setTimeLeft(settings.focusMinutes * 60);
    }
  };

  const playSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'focus' ? '🎉 Pomodoro Tamamlandı!' : '☕ Mola Bitti!';
      const body = mode === 'focus' 
        ? 'Harika iş! Şimdi kısa bir mola zamanı.'
        : 'Mola bitti! Tekrar odaklanma zamanı.';
      
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const toggleTimer = () => {
    console.log('🎬 Toggle timer - current:', isRunning, '-> new:', !isRunning);
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    console.log('🔄 Reset timer');
    setIsRunning(false);
    const duration = mode === 'focus' 
      ? settings.focusMinutes 
      : mode === 'shortBreak' 
      ? settings.shortBreakMinutes 
      : settings.longBreakMinutes;
    setTimeLeft(duration * 60);
  };

  const skipToNext = () => {
    console.log('⏭️ Skip to next');
    handleTimerComplete();
  };

  const updateSettings = (newSettings: PomodoroSettings) => {
    console.log('⚙️ Update settings:', newSettings);
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    setIsRunning(false);
    
    if (mode === 'focus') {
      setTimeLeft(newSettings.focusMinutes * 60);
    } else if (mode === 'shortBreak') {
      setTimeLeft(newSettings.shortBreakMinutes * 60);
    } else {
      setTimeLeft(newSettings.longBreakMinutes * 60);
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        settings,
        isRunning,
        timeLeft,
        mode,
        completedSessions,
        todayStats,
        toggleTimer,
        resetTimer,
        skipToNext,
        updateSettings
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within PomodoroProvider');
  }
  return context;
}