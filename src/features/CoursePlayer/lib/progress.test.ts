import { describe, it, expect } from 'vitest';
import { courseProgressStats } from './progress';
import type { CourseChapter } from '@/features/Courses/types/courseBlocks';

const chapters = (ids: string[][]): CourseChapter[] =>
  ids.map((blockIds, i) => ({
    id: `ch${i}`,
    title: `Chapter ${i}`,
    blocks: blockIds.map((id) => ({ id, type: 'text', body: '' })),
  }));

describe('courseProgressStats (E3: удалённые блоки не учитываются, процент ≤ 100)', () => {
  it('считает только пройденные блоки, существующие в курсе', () => {
    const ch = chapters([['a', 'b'], ['c']]); // 3 блока
    const done = new Set(['a', 'c']);
    expect(courseProgressStats(ch, done)).toEqual({ completed: 2, total: 3, percent: 67 });
  });

  it('игнорирует id удалённых блоков в done (баг 150% не воспроизводится)', () => {
    const ch = chapters([['a', 'b']]); // осталось 2 блока
    const done = new Set(['a', 'b', 'STALE-удалённый']); // 3 отметки, одна — на удалённый блок
    const s = courseProgressStats(ch, done);
    expect(s).toEqual({ completed: 2, total: 2, percent: 100 });
    expect(s.percent).toBeLessThanOrEqual(100);
  });

  it('после удаления пройденного блока доля падает, не превышая 100%', () => {
    const before = courseProgressStats(chapters([['a', 'b', 'c']]), new Set(['a', 'b', 'c']));
    expect(before.percent).toBe(100);
    // Удалили блок c из курса, но отметка о нём осталась в done
    const after = courseProgressStats(chapters([['a', 'b']]), new Set(['a', 'b', 'c']));
    expect(after).toEqual({ completed: 2, total: 2, percent: 100 });
  });

  it('пустой курс → 0% без деления на ноль', () => {
    expect(courseProgressStats([], new Set(['x']))).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});
