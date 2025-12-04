import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AuthUser } from './AuthContext';

interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
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

// Global state - React lifecycle'dan bağımsız
let timerInterval: number | null = null;
let currentTimeLeft = 1500;
let currentIsRunning = false;
let currentMode: 'focus' | 'shortBreak' | 'longBreak' = 'focus';
let currentCompletedSessions = 0;
let currentStudentId: string | undefined = undefined;
let currentSettings: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4
};

let stateUpdateCallbacks: {
  setTimeLeft?: (time: number) => void;
  setIsRunning?: (running: boolean) => void;
  setMode?: (mode: 'focus' | 'shortBreak' | 'longBreak') => void;
  setCompletedSessions?: (sessions: number) => void;
  setTodayStats?: (updater: (prev: any) => any) => void;
} = {};

function startGlobalTimer() {
  if (timerInterval) return;
  
  currentIsRunning = true;
  
  timerInterval = window.setInterval(() => {
    currentTimeLeft--;
    
    if (stateUpdateCallbacks.setTimeLeft) {
      stateUpdateCallbacks.setTimeLeft(currentTimeLeft);
    }
    
    if (currentTimeLeft <= 0) {
      completeTimer();
    }
  }, 1000);
}

function stopGlobalTimer() {
  currentIsRunning = false;
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  if (stateUpdateCallbacks.setIsRunning) {
    stateUpdateCallbacks.setIsRunning(false);
  }
}

async function completeTimer() {
  stopGlobalTimer();
  playSound();
  showNotification();
  
  if (currentMode === 'focus') {
    // Save to database
    if (currentStudentId) {
      try {
        const { supabase } = await import('../lib/supabase');
        const startTime = new Date(Date.now() - currentSettings.focusMinutes * 60 * 1000);
        
        const { error } = await supabase.from('pomodoro_sessions').insert([{
          student_id: currentStudentId,
          session_type: 'focus',
          duration_minutes: currentSettings.focusMinutes,
          completed: true,
          started_at: startTime.toISOString(),
          completed_at: new Date().toISOString()
        }]);
        
        if (error) {
          console.error('❌ Error saving session:', error);
        }
      } catch (error) {
        console.error('❌ Error saving session:', error);
      }
    }
    
    currentCompletedSessions++;
    
    if (stateUpdateCallbacks.setCompletedSessions) {
      stateUpdateCallbacks.setCompletedSessions(currentCompletedSessions);
    }
    
    if (stateUpdateCallbacks.setTodayStats) {
      stateUpdateCallbacks.setTodayStats((prev: any) => ({
        focusSessions: prev.focusSessions + 1,
        totalMinutes: prev.totalMinutes + currentSettings.focusMinutes,
        currentStreak: prev.currentStreak + 1
      }));
    }
    
    if (currentCompletedSessions % currentSettings.sessionsBeforeLongBreak === 0) {
      currentMode = 'longBreak';
      currentTimeLeft = currentSettings.longBreakMinutes * 60;
    } else {
      currentMode = 'shortBreak';
      currentTimeLeft = currentSettings.shortBreakMinutes * 60;
    }
  } else {
    currentMode = 'focus';
    currentTimeLeft = currentSettings.focusMinutes * 60;
  }
  
  if (stateUpdateCallbacks.setMode) {
    stateUpdateCallbacks.setMode(currentMode);
  }
  if (stateUpdateCallbacks.setTimeLeft) {
    stateUpdateCallbacks.setTimeLeft(currentTimeLeft);
  }
}

function playSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Ses çalınamazsa sessizce devam et
  }
}

function showNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(
      currentMode === 'focus' ? '🎉 Pomodoro Tamamlandı!' : '☕ Mola Bitti!',
      { body: currentMode === 'focus' ? 'Harika iş! Şimdi mola zamanı.' : 'Mola bitti! Tekrar odaklanma zamanı.' }
    );
  }
}

export function PomodoroProvider({ children, studentId }: { children: ReactNode; studentId?: string }) {
  const [isRunning, setIsRunning] = useState(currentIsRunning);
  const [timeLeft, setTimeLeft] = useState(currentTimeLeft);
  const [mode, setMode] = useState(currentMode);
  const [completedSessions, setCompletedSessions] = useState(currentCompletedSessions);
  const [settings, setSettings] = useState(currentSettings);
  const [todayStats, setTodayStats] = useState({
    focusSessions: 0,
    totalMinutes: 0,
    currentStreak: 0
  });
  
  // Update global values
  useEffect(() => {
    currentStudentId = studentId;
  }, [studentId]);
  
  useEffect(() => {
    currentSettings = settings;
  }, [settings]);
  
  // Register callbacks
  useEffect(() => {
    stateUpdateCallbacks = {
      setTimeLeft,
      setIsRunning,
      setMode,
      setCompletedSessions,
      setTodayStats
    };
  }, []);
  
  // Load today stats
  useEffect(() => {
    if (!studentId) return;
    
    const loadStats = async () => {
      try {
        const { supabase } = await import('../lib/supabase');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data } = await supabase
          .from('pomodoro_sessions')
          .select('*')
          .eq('student_id', studentId)
          .gte('started_at', today.toISOString())
          .eq('session_type', 'focus')
          .eq('completed', true);
        
        if (data) {
          setTodayStats({
            focusSessions: data.length,
            totalMinutes: data.reduce((sum: number, s: any) => sum + s.duration_minutes, 0),
            currentStreak: data.length
          });
        }
      } catch (e) {
        // Stats yüklenemezse devam et
      }
    };
    
    loadStats();
  }, [studentId]);
  
  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const toggleTimer = () => {
    if (currentIsRunning) {
      stopGlobalTimer();
      setIsRunning(false);
    } else {
      currentIsRunning = true;
      setIsRunning(true);
      startGlobalTimer();
    }
  };
  
  const resetTimer = () => {
    stopGlobalTimer();
    
    const duration = currentMode === 'focus' ? currentSettings.focusMinutes :
                     currentMode === 'shortBreak' ? currentSettings.shortBreakMinutes :
                     currentSettings.longBreakMinutes;
    
    currentTimeLeft = duration * 60;
    currentIsRunning = false;
    
    setTimeLeft(currentTimeLeft);
    setIsRunning(false);
  };
  
  const skipToNext = () => {
    stopGlobalTimer();
    completeTimer();
  };
  
  const updateSettings = (newSettings: PomodoroSettings) => {
    stopGlobalTimer();
    
    currentSettings = newSettings;
    setSettings(newSettings);
    localStorage.setItem('pomodoro-settings', JSON.stringify(newSettings));
    
    currentTimeLeft = newSettings.focusMinutes * 60;
    currentIsRunning = false;
    
    setTimeLeft(currentTimeLeft);
    setIsRunning(false);
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