import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AppThemeProvider } from '@/theme';
import { PageRenderer } from './PageRenderer';
import { pickText, SiteBlock } from './pagesApi';

const renderPage = (blocks: SiteBlock[]) => render(
  <AppThemeProvider>
    <MemoryRouter><PageRenderer blocks={blocks} /></MemoryRouter>
  </AppThemeProvider>,
);

describe('pickText — выбор языка с фолбэком', () => {
  it('берёт текущий язык, иначе en, иначе первый непустой', () => {
    expect(pickText({ pl: 'Cześć', uk: 'Привіт', en: 'Hi' }, 'uk')).toBe('Привіт');
    expect(pickText({ pl: 'Cześć', en: 'Hi' }, 'uk')).toBe('Hi');        // нет uk → en
    expect(pickText({ pl: 'Cześć' }, 'en')).toBe('Cześć');               // нет en → первый непустой
    expect(pickText(undefined, 'en')).toBe('');
  });
});

describe('PageRenderer — безопасный рендер блоков', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: {} } }, interpolation: { escapeValue: false } });
  });
  afterEach(() => cleanup());

  it('рендерит заголовок, текст и цитату на текущем языке', () => {
    renderPage([
      { type: 'heading', props: { text: { en: 'Our club', pl: 'Nasz klub' }, level: 1 } },
      { type: 'text', props: { text: { en: 'Welcome to the club.' } } },
      { type: 'quote', props: { text: { en: 'Chess is life.' }, author: 'Fischer' } },
    ]);
    expect(screen.getByText('Our club')).toBeTruthy();
    expect(screen.getByText('Welcome to the club.')).toBeTruthy();
    expect(screen.getByText('Chess is life.')).toBeTruthy();
    expect(screen.getByText('— Fischer')).toBeTruthy();
  });

  it('видео рендерит iframe на youtube-nocookie по videoId', () => {
    const { container } = renderPage([{ type: 'video', props: { provider: 'youtube', videoId: 'dQw4w9WgXcQ' } }]);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('пустой список блоков ничего не рендерит', () => {
    const { container } = renderPage([]);
    expect(container.textContent).toBe('');
  });
});
