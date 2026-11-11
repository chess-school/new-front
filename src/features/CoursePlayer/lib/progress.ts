import type { CourseChapter } from '@/features/Courses/types/courseBlocks';

export interface CourseProgressStats {
  completed: number;
  total: number;
  percent: number;
}

/**
 * Прогресс ученика по курсу. Считаем ТОЛЬКО блоки, реально существующие в курсе сейчас:
 * `done` может содержать id блоков, удалённых после прохождения — иначе доля превышала бы 100%
 * (баг E3 «150%»). Поэтому процент гарантированно ≤ 100.
 */
export const courseProgressStats = (chapters: CourseChapter[], done: Set<string>): CourseProgressStats => {
  const blockIds = new Set(chapters.flatMap((ch) => ch.blocks.map((b) => b.id)));
  const total = blockIds.size;
  let completed = 0;
  done.forEach((id) => { if (blockIds.has(id)) completed += 1; });
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
};
