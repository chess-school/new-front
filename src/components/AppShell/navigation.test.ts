import { describe, expect, it } from 'vitest';
import { isItemActive, NAV_GROUPS, visibleNav } from './navigation';

const keys = (groups: ReturnType<typeof visibleNav>) => groups.flatMap((g) => g.items.map((i) => i.key));
const item = (key: string) => NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === key)!;

describe('меню по ролям (новая IA)', () => {
  it('гость: только открытые тренировки/анализ, без ученических и тренерских разделов', () => {
    const k = keys(visibleNav(null, false));
    expect(k).toEqual(expect.arrayContaining(['puzzles', 'rating', 'survival', 'blindfold', 'analysis', 'database']));
    expect(k).not.toContain('books');       // student
    expect(k).not.toContain('myCourses');   // student
    expect(k).not.toContain('students');    // coach
    expect(k).not.toContain('puzzleBooksCoach');
  });

  it('ученик (USER): игра, задачи, курсы/книги/анализ, мой клуб — без тренерских инструментов', () => {
    const k = keys(visibleNav({ roles: ['USER'] }, true));
    expect(k).toEqual(expect.arrayContaining(['play', 'myGames', 'puzzles', 'myCourses', 'books', 'analysis', 'myClasses', 'schedule']));
    for (const coachOnly of ['students', 'review', 'courses', 'puzzleBooksCoach', 'coachApplications', 'clubLeads']) {
      expect(k).not.toContain(coachOnly);
    }
  });

  it('тренер: ученическое + клуб/занятия/инструменты, но без админ-раздела', () => {
    for (const roles of [['USER', 'COACH'], ['coach']]) {
      const k = keys(visibleNav({ roles }, true));
      expect(k).toEqual(expect.arrayContaining(['students', 'groups', 'clubLeads', 'lessonsCoach', 'review', 'courses', 'puzzleBooksCoach', 'clubWebsite']));
      expect(k).not.toContain('coachApplications'); // только ADMIN
    }
  });

  it('ADMIN: видит раздел «Администрирование» (coach applications)', () => {
    expect(keys(visibleNav({ roles: ['ADMIN'] }, true))).toContain('coachApplications');
    expect(keys(visibleNav({ roles: ['USER', 'COACH'] }, true))).not.toContain('coachApplications');
  });

  it('роли без входа не дают доступа (протухший пользователь в состоянии)', () => {
    expect(keys(visibleNav({ roles: ['ADMIN'] }, false))).not.toContain('students');
    expect(keys(visibleNav({ roles: ['ADMIN'] }, false))).not.toContain('coachApplications');
  });

  it('пустые группы не показываются (гость не видит тренерских групп)', () => {
    const groupKeys = visibleNav(null, false).map((g) => g.key);
    for (const coachGroup of ['people', 'lessons', 'tools', 'club', 'admin', 'consoleTop']) {
      expect(groupKeys).not.toContain(coachGroup);
    }
  });

  it('Inbox и Profile убраны из сайдбара', () => {
    const all = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.key));
    expect(all).not.toContain('inbox');
    expect(all).not.toContain('profile');
    expect(all).not.toContain('home'); // старая группа «School» убрана
  });
});

describe('активный пункт', () => {
  it('префикс пути', () => {
    expect(isItemActive(item('books'), '/books/123/solve')).toBe(true);
    expect(isItemActive(item('puzzles'), '/puzzles-extra')).toBe(false);
    expect(isItemActive(item('myCourses'), '/my-courses')).toBe(true);
  });

  it('«Puzzle books» (тренер) активен на оцифровщике и редакторе книги', () => {
    expect(isItemActive(item('puzzleBooksCoach'), '/digitizer')).toBe(true);
    expect(isItemActive(item('puzzleBooksCoach'), '/digitizer/books/b1/edit')).toBe(true);
  });

  it('«Review work» активен только на вкладке homework', () => {
    expect(isItemActive(item('review'), '/inbox', '?tab=homework')).toBe(true);
    expect(isItemActive(item('review'), '/inbox')).toBe(false);
  });

  it('«Schedule» активен и на новом /schedule, и на старом /students-shedule', () => {
    expect(isItemActive(item('schedule'), '/schedule')).toBe(true);
    expect(isItemActive(item('schedule'), '/students-shedule')).toBe(true);
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
