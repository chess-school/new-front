import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppThemeProvider } from '@/theme';
import { AuthProvider } from '@/context/AuthContext.tsx';
import '@/styles'; 
import './index.css';
import './i18n'; 
import App from './App.tsx';

// Подстраховка от белого экрана после деплоя: у вернувшегося пользователя в кэше мог остаться
// старый index.html, ссылающийся на пропавший чанк. Vite шлёт 'vite:preloadError' при провале
// динамического импорта — один раз перезагружаемся на свежий index (гард от зацикливания).
window.addEventListener('vite:preloadError', () => {
  const KEY = 'reloaded-on-preload-error';
  try {
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
  } catch { /* приватный режим */ }
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AppThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AppThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);