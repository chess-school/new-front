import { useEffect } from 'react';
import { GameTreeApi } from './useGameTree';

/**
 * Клавиатура, как на Lichess: ← / → — назад/вперёд по линии, ↑ / ↓ — соседний вариант,
 * Home / End — к началу / в конец. Не мешает полям ввода.
 */
export const useTreeKeyboard = (game: GameTreeApi, enabled = true) => {
  const { back, forward, sibling, toStart, toEnd } = game.actions;
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (e: KeyboardEvent) => {
      // Цель может быть не элементом (window, document) — тогда это не поле ввода
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable || el.getAttribute('role') === 'slider')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft') back();
      else if (e.key === 'ArrowRight') forward();
      else if (e.key === 'ArrowUp') sibling(-1);
      else if (e.key === 'ArrowDown') sibling(1);
      else if (e.key === 'Home') toStart();
      else if (e.key === 'End') toEnd();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, back, forward, sibling, toStart, toEnd]);
};
