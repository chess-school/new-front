import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { AppThemeProvider } from '@/theme';
import { AuthForm } from './AuthForm';

// API не вызываем (сабмита в тесте нет) — но мок на всякий случай
vi.mock('@/api/login', () => ({ loginUser: vi.fn() }));
vi.mock('@/api/register/register', () => ({ registerUser: vi.fn() }));

const authValue = {
  user: null, loading: false, isAuthenticated: false,
  login: vi.fn(async () => ({} as never)), logout: vi.fn(), refetchUser: vi.fn(async () => {}),
} as never;

const renderForm = (mode: 'login' | 'register') => render(
  <AuthContext.Provider value={authValue}>
    <AppThemeProvider>
      <MemoryRouter><AuthForm mode={mode} /></MemoryRouter>
    </AppThemeProvider>
  </AuthContext.Provider>,
);

describe('AuthForm — тёмная тема сохраняется, поля активны и вводимы', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({ lng: 'ru', resources: { ru: { translation: {} } }, interpolation: { escapeValue: false } });
    Object.defineProperty(window, 'matchMedia', {
      writable: true, value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }),
    });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('флаг тёмной темы не сбрасывается на светлую при открытии формы', () => {
    localStorage.setItem('mob-theme', 'dark');
    renderForm('register');
    // Тема применена и НЕ сброшена в light
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('mob-theme')).toBe('dark');
  });

  it('регистрация: все поля присутствуют, активны (не disabled/readOnly) и принимают ввод', async () => {
    localStorage.setItem('mob-theme', 'dark');
    renderForm('register');

    const inputs = Array.from(document.querySelectorAll('.auth-form-body input')) as HTMLInputElement[];
    // Имя, Фамилия, Email, Пароль
    expect(inputs.length).toBeGreaterThanOrEqual(4);
    inputs.forEach((i) => {
      expect(i.disabled).toBe(false);
      expect(i.readOnly).toBe(false);
    });

    // Клик фокусирует поле, текст вводится
    const email = inputs.find((i) => i.type === 'email' || i.getAttribute('type') === 'text') ?? inputs[0];
    fireEvent.change(email, { target: { value: 'student@example.com' } });
    await waitFor(() => expect(email.value).toBe('student@example.com'));

    const password = inputs.find((i) => i.type === 'password');
    expect(password).toBeTruthy();
    fireEvent.change(password!, { target: { value: 'Passw0rd!' } });
    await waitFor(() => expect(password!.value).toBe('Passw0rd!'));
  });
});
