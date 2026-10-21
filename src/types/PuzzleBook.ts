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
}

export type PuzzleBookStatus = 'draft' | 'published';

export interface PuzzleBookSummary {
  _id: string;
  title: string;
  description: string;
  status: PuzzleBookStatus;
  exercisesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PuzzleBook extends Omit<PuzzleBookSummary, 'exercisesCount'> {
  exercises: Exercise[];
}

export type ExerciseUpdate = Partial<Pick<Exercise, 'title' | 'fen' | 'comment' | 'hint' | 'solution'>>;
