import { describe, expect, it } from 'vitest';
import { isItemActive, NAV_GROUPS, visibleNav } from './navigation';

const keys = (groups: ReturnType<typeof visibleNav>) => groups.flatMap((g) => g.items.map((i) => i.key));
const item = (key: string) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === key)!;

describe('меню по ролям', () => {
  it('гость: школа и открытые тренировки, без книг и личного раздела', () => {
    const k = keys(visibleNav(null, false));
    expect(k).toEqual(expect.arrayContaining(['home', 'about', 'coaches', 'puzzles', 'rating', 'survival', 'analysis']));
    expect(k).not.toContain('books');
    expect(k).not.toContain('profile');
    expect(k).not.toContain('digitizer');
  });

  it('ученик (USER): книги, задачи, анализ, профиль и домашка — без инструментов тренера', () => {
    const k = keys(visibleNav({ roles: ['USER'] }, true));
    expect(k).toEqual(expect.arrayContaining(['books', 'puzzles', 'analysis', 'profile', 'schedule', 'inbox']));
    for (const coachOnly of ['students', 'review', 'digitizer', 'courseBuilder']) expect(k).not.toContain(coachOnly);
  });

  it('тренер и админ: всё ученическое + оцифровщик, конструктор курсов и проверка работ', () => {
    for (const roles of [['USER', 'COACH'], ['ADMIN'], ['coach']]) {
      const k = keys(visibleNav({ roles }, true));
      expect(k).toEqual(expect.arrayContaining(['books', 'puzzles', 'analysis', 'profile', 'students', 'review', 'digitizer', 'courseBuilder']));
    }
  });

  it('роли без входа не дают доступа (протухший пользователь в состоянии)', () => {
    expect(keys(visibleNav({ roles: ['ADMIN'] }, false))).not.toContain('digitizer');
  });

  it('пустые группы не показываются', () => {
    expect(visibleNav(null, false).map((g) => g.key)).not.toContain('coach');
  });
});

describe('активный пункт', () => {
  it('префикс пути, но главная — только точно', () => {
    expect(isItemActive(item('books'), '/books/123/solve')).toBe(true);
    expect(isItemActive(item('home'), '/books')).toBe(false);
    expect(isItemActive(item('home'), '/')).toBe(true);
    expect(isItemActive(item('puzzles'), '/puzzles-extra')).toBe(false);
  });

  it('оцифровщик / конструктор курсов / проверка работ различаются по адресу', () => {
    expect(isItemActive(item('digitizer'), '/digitizer')).toBe(true);
    expect(isItemActive(item('courseBuilder'), '/digitizer/books/b1/edit')).toBe(true);
    expect(isItemActive(item('digitizer'), '/digitizer/books/b1/edit')).toBe(false);
    expect(isItemActive(item('courseBuilder'), '/digitizer', '', '#library')).toBe(true);
    expect(isItemActive(item('review'), '/inbox', '?tab=homework')).toBe(true);
    expect(isItemActive(item('inbox'), '/inbox', '?tab=homework')).toBe(false);
    expect(isItemActive(item('inbox'), '/inbox')).toBe(true);
  });

  it('каждый пункт меню ведёт на существующий роут App.tsx', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const app = fs.readFileSync(path.resolve(__dirname, '../../App.tsx'), 'utf8');
    const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
    for (const nav of NAV_GROUPS.flatMap((g) => g.items)) {
      const p = nav.to.split(/[?#]/)[0];
      const ok = routes.some((r) => r === p || (r.includes(':') && new RegExp(`^${r.replace(/:[^/]+/g, '[^/]+')}$`).test(`${p}/x`)));
      expect(ok, `${nav.key} -> ${nav.to}`).toBe(true);
    }
  });
});
