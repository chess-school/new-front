import { createContext, useContext, useEffect } from 'react';
import { useThemeStore } from './themeStore';

// 1. Создаем контекст
const ThemeContext = createContext({ toggleTheme: () => {}, mode: 'light' });

// 2. Провайдер темы
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode: theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. Кастомный хук для использования темы
export const useTheme = () => useContext(ThemeContext);
