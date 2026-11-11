/**
 * Схема контента курса-конструктора (Фаза A).
 *
 * Курс = упорядоченные ГЛАВЫ (chapters), глава = упорядоченные типизированные
 * БЛОКИ (blocks). Каждый тип блока — обёртка над уже существующим движком:
 *   - text   → теория (markdown)
 *   - puzzle → solve-сессия (переиспользует BookSolve: fen+solution из Exercise)
 *   - game   → доска-анализ (PGN + аннотации, как SavedGame)
 *
 * Union намеренно открыт под следующие фазы:
 *   - 'base'-источник у puzzle (ссылки на задачи базы 150k) — Фаза B
 *   - 'blindfold' блок — Фаза C
 *   - 'solveMode' блок (survival/rush по теме) — Фаза E
 *
 * Хранится в Course.modules (Json) в форме CourseContent. Старые плоские курсы
 * (lessons[{contentType,content}]) адаптируются на чтении — см. migration-слой.
 */
import type { Exercise, SolveSettings } from '@/types/PuzzleBook';

/** Версия формата контента — страховка миграций (bump при несовместимых правках). */
export const COURSE_CONTENT_VERSION = 1 as const;

/** Тип блока главы. Фаза A: text | puzzle | game; остальное — резерв. */
export type CourseBlockType =
  | 'text'
  | 'puzzle'
  | 'game'
  // --- планируемые (не реализованы в Фазе A) ---
  | 'blindfold' // Фаза C
  | 'solveMode'; // Фаза E

/** Общая обёртка любого блока. */
export interface CourseBlockBase {
  /** Стабильный id блока (nanoid) — ключ прогресса ученика и reorder. */
  id: string;
  type: CourseBlockType;
  /** Необязательный заголовок блока в оглавлении главы. */
  title?: string;
}

/** Текст/теория: markdown-тело. */
export interface TextBlock extends CourseBlockBase {
  type: 'text';
  body: string;
}

/** Откуда взяты задачи блока (для редактора и аналитики). */
export type PuzzleBlockSource = 'pdf' | 'board' | 'base' | 'manual';

/**
 * Одна задача внутри блока. Либо встроенная (inline — как Exercise из книги:
 * из PDF / с доски / вручную), либо ССЫЛКА на задачу базы 150k (Фаза B).
 */
export type CoursePuzzle =
  | ({ kind: 'inline' } & Exercise)
  | { kind: 'ref'; puzzleId: string }; // Фаза B

/** Блок «реши задачи» — переиспользует solve-сессию BookSolve. */
export interface PuzzleBlock extends CourseBlockBase {
  type: 'puzzle';
  source: PuzzleBlockSource;
  puzzles: CoursePuzzle[];
  /** Переопределение настроек решения для блока (иначе — дефолты курса). */
  solveSettings?: SolveSettings;
}

/** Аннотация хода на доске-анализе (форма совпадает с SavedGame.annotations). */
export interface GameAnnotation {
  /** Идентификатор хода в дереве вариантов (путь/ply), как в useGameTree. */
  moveId: string;
  comment?: string;
  arrows?: string[]; // ["e2e4", ...]
  squares?: string[]; // ["e4", ...]
}

/** Как ученик изучает партию: свободный анализ или «угадай ход». */
export type GameStudyMode = 'free' | 'guessMove';

/** Блок «разбери партию» — переиспользует доску-анализ. */
export interface GameBlock extends CourseBlockBase {
  type: 'game';
  /** Полная партия / дерево вариантов в PGN. */
  pgn: string;
  annotations?: GameAnnotation[];
  study: GameStudyMode;
  orientation?: 'white' | 'black';
  meta?: { white?: string; black?: string; event?: string; year?: string; eco?: string };
}

/** Любой блок главы (Фаза A). */
export type CourseBlock = TextBlock | PuzzleBlock | GameBlock;

/** Глава курса — упорядоченный список блоков. */
export interface CourseChapter {
  id: string;
  title: string;
  description?: string;
  blocks: CourseBlock[];
}

/** Строгая форма Course.modules (Json) для курсов-конструкторов. */
export interface CourseContent {
  version: typeof COURSE_CONTENT_VERSION;
  chapters: CourseChapter[];
}

// --- тайп-гарды (дискриминация union по полю type) -----------------------------

export const isTextBlock = (b: CourseBlock): b is TextBlock => b.type === 'text';
export const isPuzzleBlock = (b: CourseBlock): b is PuzzleBlock => b.type === 'puzzle';
export const isGameBlock = (b: CourseBlock): b is GameBlock => b.type === 'game';

export const isInlinePuzzle = (
  p: CoursePuzzle,
): p is { kind: 'inline' } & Exercise => p.kind === 'inline';
