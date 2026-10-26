export type DigitizeTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DigitizeTaskCreated {
  task_id: string;
  status: DigitizeTaskStatus;
}

/** PGN-глава, уже готовая, пока книга ещё обрабатывается */
export interface ReadyChapter {
  filename: string;
  first_page: number | null;
  last_page: number | null;
  positions: number;
}

export interface DigitizeTask {
  task_id: string;
  status: DigitizeTaskStatus;
  progress_percent: number;
  current_page: number;
  total_pages: number;
  processed_positions_count: number;
  positions: number;
  files: string[];
  ready_chapters: ReadyChapter[];
  summary?: Record<string, unknown> | null;
  error?: string | null;
}

/** Результат создания задачника из задачи или добавления в него новых глав */
export interface CourseSyncResult {
  _id: string;
  title: string;
  exercisesCount: number;
  added: number;
  /** Для каждой импортированной главы — индекс её первого упражнения в задачнике */
  chapters: { filename: string; firstIndex: number; exercisesCount: number }[];
  complete: boolean;
}

export interface ExerciseMeta {
  white?: string;
  black?: string;
  site?: string;
  year?: string;
  opening?: string;
  source?: string;
}

export interface Exercise {
  _id: string;
  number?: number;
  title: string;
  fen: string;
  comment: string;
  hint: string;
  /** Ходы решения в PGN (с вариантами и комментариями) от позиции fen */
  solution: string;
  meta?: ExerciseMeta;
  /** Рейтинг сложности задачи (Glicko/Elo-подобный), по умолчанию 1500 */
  rating?: number;
}

export type PuzzleBookStatus = 'draft' | 'published';

/** Область видимости задачника (Module 1): черновик / приватный / групповой / публичный */
export type PuzzleBookVisibility = 'draft' | 'private' | 'group' | 'public';

/** Настройки режима решения — тренер задаёт их для задачника (с дефолтами). */
export interface SolveSettings {
  /** Доступны ли подсказки ученику */
  hintsEnabled: boolean;
  /** Через сколько минут открывается подсказка */
  hintUnlockMinutes: number;
  /** После скольки ошибок открывается подсказка */
  hintUnlockMistakes: number;
  /** Можно ли «сдаться» и посмотреть решение */
  allowShowSolution: boolean;
  /** Показывать имена игроков у доски */
  showPlayerNames: boolean;
}

export const DEFAULT_SOLVE_SETTINGS: SolveSettings = {
  hintsEnabled: true,
  hintUnlockMinutes: 10,
  hintUnlockMistakes: 5,
  allowShowSolution: false,
  showPlayerNames: true,
};

export interface PuzzleBookSummary {
  _id: string;
  title: string;
  description: string;
  status: PuzzleBookStatus;
  /** Область видимости (Module 1). Отсутствует у легаси-задачников. */
  visibility?: PuzzleBookVisibility;
  isArchived?: boolean;
  /** Сколько ученикам/группам выдан индивидуальный доступ (для бейджей) */
  allowedUsersCount?: number;
  allowedGroupsCount?: number;
  exercisesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PuzzleBook extends Omit<PuzzleBookSummary, 'exercisesCount'> {
  exercises: Exercise[];
  solveSettings?: SolveSettings;
  /** ID учеников с индивидуальным доступом (visibility === 'private') */
  allowedUsers?: string[];
  /** ID групп с доступом (visibility === 'group') */
  allowedGroups?: string[];
}

export type ExerciseUpdate = Partial<Pick<Exercise, 'title' | 'fen' | 'comment' | 'hint' | 'solution'>>;

/** Одна попытка решения, отправляемая на бэкенд для статистики */
export interface ExerciseAttemptInput {
  exerciseId: string;
  solved: boolean;
  timeTakenSeconds: number;
  attemptsCount: number;
  usedHint: boolean;
}

/**
 * Пересчёт рейтингов после попытки (возвращает бэкенд).
 * userDelta может быть отрицательным; puzzleDelta — противоположного знака.
 */
export interface AttemptRatingResult {
  success: boolean;
  userDelta: number;
  puzzleDelta: number;
  userRating: number;
  userRatingBefore: number;
  puzzleRating: number;
  puzzleRatingBefore: number;
}

/** Ответ на POST /puzzle-books/:bookId/attempts */
export interface RecordAttemptResponse {
  ok: true;
  rating?: AttemptRatingResult;
}

/** Строка статистики по одному ученику в задачнике */
export interface BookStatsStudentRow {
  student: { _id: string; firstName: string; lastName: string; email: string; uuid?: string };
  solvedCount: number;
  exercisesAttempted: number;
  attempts: number;
  totalMistakes: number;
  totalTimeSeconds: number;
  hintsUsed: number;
  lastActivity: string | null;
}

export interface BookStats {
  totalExercises: number;
  students: BookStatsStudentRow[];
}
