import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        } else {
          const colorScheme: ColorSchemeName = Appearance.getColorScheme();
          setIsDark(colorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        const colorScheme: ColorSchemeName = Appearance.getColorScheme();
        setIsDark(colorScheme === 'dark');
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const saveTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };

    saveTheme();
  }, [isDark, isLoaded]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
