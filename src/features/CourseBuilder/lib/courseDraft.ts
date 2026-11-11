/**
 * Чистые иммутабельные хелперы черновика курса: CRUD глав и блоков + фабрики.
 * Редактор держит в стейте CourseContent и гоняет его через эти функции.
 */
import {
  COURSE_CONTENT_VERSION,
  type CourseContent,
  type CourseChapter,
  type CourseBlock,
  type CourseBlockType,
  type CoursePuzzle,
} from '@/features/Courses/types/courseBlocks';

/** Стартовая позиция для новой задачи-заготовки. */
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const newId = (): string => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
};

export const emptyContent = (): CourseContent => ({ version: COURSE_CONTENT_VERSION, chapters: [] });

export const newInlinePuzzle = (): CoursePuzzle => ({
  kind: 'inline',
  _id: newId(),
  title: '',
  fen: START_FEN,
  comment: '',
  hint: '',
  solution: '',
});

/** Фабрика блока по типу (Фаза A: text|puzzle|game). */
export const makeBlock = (type: CourseBlockType): CourseBlock => {
  const base = { id: newId(), title: '' };
  switch (type) {
    case 'text':
      return { ...base, type: 'text', body: '' };
    case 'puzzle':
      return { ...base, type: 'puzzle', source: 'manual', puzzles: [newInlinePuzzle()] };
    case 'game':
      return { ...base, type: 'game', pgn: '', study: 'free' };
    default:
      // blindfold/solveMode — резерв фаз C/E; до реализации не создаём
      return { ...base, type: 'text', body: '' };
  }
};

export const makeChapter = (title = ''): CourseChapter => ({ id: newId(), title, description: '', blocks: [] });

// --- главы ---------------------------------------------------------------------

export const addChapter = (c: CourseContent): CourseContent => ({
  ...c,
  chapters: [...c.chapters, makeChapter()],
});

export const updateChapter = (c: CourseContent, id: string, patch: Partial<CourseChapter>): CourseContent => ({
  ...c,
  chapters: c.chapters.map((ch) => (ch.id === id ? { ...ch, ...patch } : ch)),
});

export const removeChapter = (c: CourseContent, id: string): CourseContent => ({
  ...c,
  chapters: c.chapters.filter((ch) => ch.id !== id),
});

/** Сдвиг главы на dir (-1 вверх / +1 вниз), границы безопасны. */
export const moveChapter = (c: CourseContent, id: string, dir: -1 | 1): CourseContent => {
  const i = c.chapters.findIndex((ch) => ch.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= c.chapters.length) return c;
  const chapters = [...c.chapters];
  [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
  return { ...c, chapters };
};

// --- блоки ---------------------------------------------------------------------

const mapChapterBlocks = (
  c: CourseContent,
  chapterId: string,
  fn: (blocks: CourseBlock[]) => CourseBlock[],
): CourseContent => ({
  ...c,
  chapters: c.chapters.map((ch) => (ch.id === chapterId ? { ...ch, blocks: fn(ch.blocks) } : ch)),
});

export const addBlock = (c: CourseContent, chapterId: string, type: CourseBlockType): CourseContent =>
  mapChapterBlocks(c, chapterId, (blocks) => [...blocks, makeBlock(type)]);

export const updateBlock = (c: CourseContent, chapterId: string, block: CourseBlock): CourseContent =>
  mapChapterBlocks(c, chapterId, (blocks) => blocks.map((b) => (b.id === block.id ? block : b)));

export const removeBlock = (c: CourseContent, chapterId: string, blockId: string): CourseContent =>
  mapChapterBlocks(c, chapterId, (blocks) => blocks.filter((b) => b.id !== blockId));

export const moveBlock = (c: CourseContent, chapterId: string, blockId: string, dir: -1 | 1): CourseContent =>
  mapChapterBlocks(c, chapterId, (blocks) => {
    const i = blocks.findIndex((b) => b.id === blockId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return blocks;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

/**
 * Лёгкая клиентская валидация перед сохранением (зеркало бэка, чтобы не ловить 400):
 * глава без заголовка, пустой puzzle-блок/задача без FEN, game без PGN.
 * @returns список текстов проблем (пусто = можно сохранять)
 */
export const validateDraft = (c: CourseContent): string[] => {
  const problems: string[] = [];
  c.chapters.forEach((ch, ci) => {
    const label = `${ci + 1}. ${ch.title || '—'}`;
    if (!ch.title.trim()) problems.push(`Глава ${ci + 1}: нужен заголовок`);
    ch.blocks.forEach((b, bi) => {
      const where = `Глава «${label}», блок ${bi + 1}`;
      if (b.type === 'puzzle') {
        if (b.puzzles.length === 0) problems.push(`${where}: нет задач`);
        b.puzzles.forEach((p, pi) => {
          if (p.kind === 'inline' && !p.fen.trim()) problems.push(`${where}, задача ${pi + 1}: нужен FEN`);
        });
      }
      if (b.type === 'game' && !b.pgn.trim()) problems.push(`${where}: нужен PGN партии`);
    });
  });
  return problems;
};
