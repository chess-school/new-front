import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, CircularProgress, FormControlLabel,
  IconButton, MenuItem, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import FirstPageRoundedIcon from '@mui/icons-material/FirstPageRounded';
import LastPageRoundedIcon from '@mui/icons-material/LastPageRounded';
import { Chess } from 'chess.js';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { EnginePanel } from '@/features/Chess/components/EnginePanel';
import { VariationTree } from '@/features/Chess/components/VariationTree';
import { PuzzleSourcePicker } from '@/features/Chess/components/PuzzleSourcePicker';
import { useGameTree } from '@/features/Chess/tree/useGameTree';
import { parsePgn, continuation } from '@/features/Chess/tree/gameTree';
import { AnalysisResult } from '@/features/Chess/engine/stockfish';
import { getPuzzleBooks, getPuzzleBook } from '@/api/digitizer';
import { getRandomPuzzle } from '@/api/puzzles';
import { Exercise, PuzzleBook, PuzzleBookSummary } from '@/types/PuzzleBook';
import { PuzzleSourceFilter } from '@/types/Puzzles';
import { LessonMaterial } from '../classroomApi';

// Темы задач (ключи Lichess) + ярлыки и пояснения для выпадашки. Пусто = любая тема.
const PUZZLE_THEMES: { key: string; label: string; desc?: string }[] = [
  { key: '', label: 'Любая тема' },
  { key: 'mate', label: 'Мат', desc: 'Поставить мат (число ходов не задано)' },
  { key: 'mateIn1', label: 'Мат в 1', desc: 'Объявить мат одним ходом' },
  { key: 'mateIn2', label: 'Мат в 2', desc: 'Форсированный мат в два хода' },
  { key: 'mateIn3', label: 'Мат в 3', desc: 'Форсированный мат в три хода' },
  { key: 'fork', label: 'Вилка', desc: 'Одна фигура одновременно нападает на две и более' },
  { key: 'pin', label: 'Связка', desc: 'Фигура не может уйти — за ней под ударом более ценная' },
  { key: 'skewer', label: 'Сквозной удар', desc: 'Связка наоборот: ценная фигура впереди, после её хода берём то, что за ней' },
  { key: 'discoveredAttack', label: 'Вскрытое нападение', desc: 'Отходя, фигура открывает удар другой своей фигуры' },
  { key: 'doubleCheck', label: 'Двойной шах', desc: 'Шах сразу двумя фигурами — король обязан ходить' },
  { key: 'sacrifice', label: 'Жертва', desc: 'Отдать материал ради атаки или решающей выгоды' },
  { key: 'deflection', label: 'Отвлечение', desc: 'Увести защищающую фигуру соперника с важного поля/линии' },
  { key: 'attraction', label: 'Завлечение', desc: 'Заманить фигуру соперника на невыгодное поле' },
  { key: 'hangingPiece', label: 'Висящая фигура', desc: 'Забрать незащищённую фигуру соперника' },
  { key: 'backRankMate', label: 'Мат по последней горизонтали', desc: 'Мат ладьёй/ферзём по 1-й или 8-й линии за «стенкой» пешек' },
  { key: 'promotion', label: 'Превращение пешки', desc: 'Провести пешку в ферзя (или другую фигуру)' },
  { key: 'endgame', label: 'Эндшпиль', desc: 'Окончание партии — на доске мало фигур' },
  { key: 'opening', label: 'Дебют', desc: 'Позиции из начала партии' },
  { key: 'middlegame', label: 'Миттельшпиль', desc: 'Позиции из середины игры' },
  { key: 'advantage', label: 'Достижение преимущества', desc: 'Найти ход, дающий ощутимый перевес' },
  { key: 'crushing', label: 'Разгром', desc: 'Найти ход с решающим, подавляющим перевесом' },
  { key: 'zugzwang', label: 'Цугцванг', desc: 'Любой ход соперника только ухудшает его позицию' },
];

// Диапазоны сложности по рейтингу
const RATING_BANDS: { key: string; label: string; min?: number; max?: number }[] = [
  { key: '', label: 'Любая сложность' },
  { key: 'easy', label: 'Лёгкие (до 1200)', max: 1200 },
  { key: 'mid1', label: '1200–1600', min: 1200, max: 1600 },
  { key: 'mid2', label: '1600–2000', min: 1600, max: 2000 },
  { key: 'hard', label: '2000–2400', min: 2000, max: 2400 },
  { key: 'expert', label: 'Сложные (2400+)', min: 2400 },
];

// Меню выпадашек внутри плавающей панели. disablePortal — меню становится дочерним к панели и не
// уезжает под неё по z-index (панель выше дефолтного Modal). Тёмный фон — в стиле платформы.
const DARK_MENU_PROPS = {
  disablePortal: true,
  PaperProps: {
    sx: {
      maxHeight: 280,
      mt: 0.5,
      bgcolor: '#161b22',
      color: '#f0f6fc',
      border: '1px solid rgba(240,246,252,0.12)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
      '& .MuiMenuItem-root': {
        color: '#f0f6fc',
        whiteSpace: 'normal',
        '&:hover': { bgcolor: 'rgba(229,184,73,0.14)' },
        '&.Mui-selected': { bgcolor: 'rgba(229,184,73,0.22)' },
        '&.Mui-selected:hover': { bgcolor: 'rgba(229,184,73,0.30)' },
      },
    },
  },
};

// Аккуратные тёмные рамки полей ввода (без ярких/бордовых), акцент при фокусе
const DARK_FIELD_SX = {
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(240,246,252,0.18)' },
  '&:hover .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(240,246,252,0.30)' },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E5B849' },
};

export interface CoachEngineBinding {
  on: boolean;
  setOn: (v: boolean) => void;
  result: AnalysisResult | null;
  analyzing: boolean;
  name?: string;
  error?: string | null;
  /** Транслировать анализ движка (стрелки + оценку) всему классу */
  shareOn: boolean;
  setShareOn: (v: boolean) => void;
}

interface CoachToolsPanelProps {
  /** Текущая позиция на общей доске (её можно скопировать/анализировать) */
  fen: string;
  /** Может ли тренер сейчас менять доску (есть контроль хода) */
  canControl: boolean;
  /** Выставить позицию на общую доску (рассылается всем в классе через board:set) */
  onLoad: (fen: string) => void;
  /** Сбросить доску в начальную позицию */
  onReset: () => void;
  /** Отметить «что сейчас разбираем» (видно и ученику); null — убрать */
  onMaterial?: (material: LessonMaterial | null) => void;
  /** Запустить режим решения на общей доске: решение в UCI от startFen (ход решающей стороны первый) */
  onSolve?: (payload: { line: string[]; startFen: string; title: string }) => void;
  /** Комментарий классу (виден всем); null — убрать */
  onNote?: (note: string | null) => void;
  /** Доска сейчас в режиме решения — прячем движок (ответ не показываем) */
  solving?: boolean;
  engine: CoachEngineBinding;
}

// Главная линия решения в UCI из дерева (для книжных задач — из PGN)
const mainLineUci = (tree: ReturnType<typeof parsePgn>): string[] =>
  tree ? continuation(tree.tree, tree.tree.rootId).map((n) => n.uci).filter((u): u is string => !!u) : [];

const isValidFen = (fen: string): boolean => {
  try { new Chess(fen); return true; } catch { return false; }
};

// PGN решения упражнения с FEN-хедером — для разбора деревом вариантов (как в курсах/задачах).
const solutionPgn = (fen: string, solution: string) => `[SetUp "1"]\n[FEN "${fen}"]\n\n${solution}`;

/**
 * Инструменты тренера в интерактивном классе: движок (анализ текущей позиции, только у тренера),
 * загрузка любой позиции на общую доску (из книг-задачников, по FEN) и пошаговый разбор решения.
 * Любая загруженная позиция уходит всем ученикам через синхронную доску (board:set).
 */
export const CoachToolsPanel: React.FC<CoachToolsPanelProps> = ({ fen, canControl, onLoad, onReset, onMaterial, onSolve, onNote, solving, engine }) => {
  const { t } = useTranslation();

  const [fenInput, setFenInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const [books, setBooks] = useState<PuzzleBookSummary[]>([]);
  const [booksLoaded, setBooksLoaded] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);

  // Разбор решения — дерево вариантов (как в курсах/задачах): тренер кликает по ходам/вариантам,
  // каждая позиция уходит на общую доску всем. Решение видит только тренер.
  const [studyTitle, setStudyTitle] = useState<string | null>(null);
  const game = useGameTree();

  // Задачи по темам (из общей базы: Lichess / оцифрованные книги / все)
  const [pSource, setPSource] = useState<PuzzleSourceFilter>('lichess');
  const [pTheme, setPTheme] = useState('');
  const [pRating, setPRating] = useState('');
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);

  const loadBooks = useCallback(async () => {
    if (booksLoaded || loadingBooks) return;
    setLoadingBooks(true);
    try {
      setBooks(await getPuzzleBooks());
      setBooksLoaded(true);
    } catch {
      notification.error({ message: t('coachTools.booksError', { defaultValue: 'Не удалось загрузить список книг' }) });
    } finally {
      setLoadingBooks(false);
    }
  }, [booksLoaded, loadingBooks, t]);

  const selectBook = useCallback(async (id: string) => {
    setSelectedBookId(id);
    setBook(null);
    if (!id) return;
    setLoadingBook(true);
    try {
      setBook(await getPuzzleBook(id));
    } catch {
      notification.error({ message: t('coachTools.bookError', { defaultValue: 'Не удалось открыть книгу' }) });
    } finally {
      setLoadingBook(false);
    }
  }, [t]);

  const pushFen = useCallback((next: string) => {
    if (!canControl) {
      notification.warning({ message: t('coachTools.needControl', { defaultValue: 'Сначала верните себе ход, чтобы менять доску' }) });
      return;
    }
    if (!isValidFen(next)) {
      notification.error({ message: t('coachTools.badFen', { defaultValue: 'Некорректный FEN' }) });
      return;
    }
    onLoad(next);
  }, [canControl, onLoad, t]);

  const exerciseLabel = useCallback((ex: Exercise): LessonMaterial => ({
    title: book?.title || t('coachTools.exercise', { defaultValue: 'Упражнение' }),
    subtitle: ex.title || `${t('coachTools.exercise', { defaultValue: 'Упражнение' })} #${ex.number ?? ''}`.trim(),
  }), [book, t]);

  // Просто поставить позицию задачи на доску (без решения)
  const loadExercise = useCallback((ex: Exercise) => {
    setStudyTitle(null);
    pushFen(ex.fen);
    onMaterial?.(exerciseLabel(ex));
  }, [pushFen, onMaterial, exerciseLabel]);

  // Разбор: разобрать PGN-решение в дерево вариантов, курсор — в начальную позицию задачи.
  const studyExercise = useCallback((ex: Exercise) => {
    const parsed = ex.solution?.trim() ? parsePgn(solutionPgn(ex.fen, ex.solution)) : null;
    if (!parsed || parsed.tree.nodes[parsed.tree.rootId].children.length === 0) {
      notification.info({ message: t('coachTools.noSolution', { defaultValue: 'У этого упражнения нет разбора' }) });
      loadExercise(ex);
      return;
    }
    game.actions.reset(parsed.tree, parsed.tree.rootId);
    setStudyTitle(ex.title || `#${ex.number ?? ''}`);
    onMaterial?.(exerciseLabel(ex));
  }, [game.actions, loadExercise, onMaterial, exerciseLabel, t]);

  const closeStudy = useCallback(() => { setStudyTitle(null); game.actions.reset(); }, [game.actions]);

  // Решать упражнение: переключаем общую доску в режим решения (стартовая позиция + валидация по решению).
  const solveBookExercise = useCallback((ex: Exercise) => {
    const line = mainLineUci(ex.solution?.trim() ? parsePgn(solutionPgn(ex.fen, ex.solution)) : null);
    if (!line.length) {
      notification.info({ message: t('coachTools.noSolution', { defaultValue: 'У этого упражнения нет разбора' }) });
      loadExercise(ex);
      return;
    }
    const label = exerciseLabel(ex);
    onMaterial?.(label);
    onSolve?.({ line, startFen: ex.fen, title: label.subtitle || label.title });
  }, [onSolve, onMaterial, exerciseLabel, loadExercise, t]);

  // Случайная задача по теме/сложности/источнику — на доску всем, с решением в дереве разбора (у тренера).
  const loadRandomPuzzle = useCallback(async () => {
    if (!canControl) {
      notification.warning({ message: t('coachTools.needControl', { defaultValue: 'Сначала верните себе ход, чтобы менять доску' }) });
      return;
    }
    setLoadingPuzzle(true);
    try {
      const band = RATING_BANDS.find((b) => b.key === pRating);
      const puzzle = await getRandomPuzzle({
        source: pSource,
        ...(pTheme ? { theme: pTheme } : {}),
        ...(band?.min !== undefined ? { minRating: band.min } : {}),
        ...(band?.max !== undefined ? { maxRating: band.max } : {}),
      });
      // Позиция «надо найти ход»: у Lichess moves[0] — ход соперника (пропускаем, решаем с полухода 1).
      let startFen = puzzle.fen;
      let line = puzzle.moves;
      if (puzzle.startsWithOpponentMove && puzzle.moves.length) {
        const chess = new Chess(puzzle.fen);
        const m0 = puzzle.moves[0];
        chess.move({ from: m0.slice(0, 2), to: m0.slice(2, 4), promotion: m0[4] || 'q' });
        startFen = chess.fen();
        line = puzzle.moves.slice(1);
      }
      const themeLabel = PUZZLE_THEMES.find((th) => th.key === pTheme)?.label;
      onMaterial?.({
        title: t('coachTools.puzzleMaterial', { defaultValue: 'Задача' }) + (pTheme && themeLabel ? ` · ${themeLabel}` : ''),
        subtitle: t('coachTools.puzzleRating', { defaultValue: 'Рейтинг' }) + ` ${puzzle.rating}`,
      });
      if (line.length) onSolve?.({ line, startFen, title: (pTheme && themeLabel) || t('coachTools.puzzle', { defaultValue: 'Задача' }) });
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      notification.info({
        message: status === 404
          ? t('coachTools.noPuzzle', { defaultValue: 'По этим фильтрам задач не нашлось — ослабьте условия' })
          : t('coachTools.puzzleError', { defaultValue: 'Не удалось загрузить задачу' }),
      });
    } finally {
      setLoadingPuzzle(false);
    }
  }, [canControl, pSource, pTheme, pRating, onSolve, onMaterial, t]);

  // Пока идёт разбор — текущая позиция дерева едет на общую доску всем (если у тренера есть контроль).
  const studyFen = studyTitle ? game.fen : null;
  useEffect(() => {
    if (studyFen && canControl && studyFen !== fen) onLoad(studyFen);
  }, [studyFen, canControl, fen, onLoad]);

  const exercises = book?.exercises ?? [];

  const enginePanel = useMemo(() => (
    <EnginePanel
      enabled={engine.on}
      onToggle={engine.setOn}
      result={engine.result}
      analyzing={engine.analyzing}
      engineName={engine.name}
      error={engine.error}
      maxLines={3}
    />
  ), [engine]);

  return (
    <Box>
      {/* Движок / анализ — скрыт во время решения (в Solve Mode ответ не показываем) */}
      {!solving && (
        <Accordion disableGutters defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Stack direction="row" spacing={1} alignItems="center"><MemoryRoundedIcon fontSize="small" />
              <Typography fontWeight={600}>{t('coachTools.engine', { defaultValue: 'Движок и анализ' })}</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {enginePanel}
              <FormControlLabel
                control={<Switch size="small" checked={engine.shareOn} onChange={(_, v) => engine.setShareOn(v)} disabled={!engine.on} />}
                label={<Typography variant="body2">{t('coachTools.shareEngine', { defaultValue: 'Показать движок классу (стрелки и оценка видны всем)' })}</Typography>}
              />
              {onNote && (
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <TextField
                    size="small" fullWidth multiline maxRows={3}
                    label={t('coachTools.noteLabel', { defaultValue: 'Комментарий классу' })}
                    placeholder={t('coachTools.notePlaceholder', { defaultValue: 'Пояснение к позиции…' })}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                  />
                  <Button size="small" variant="outlined" disabled={!noteInput.trim()} onClick={() => { onNote(noteInput.trim()); setNoteInput(''); }}>
                    {t('coachTools.noteSend', { defaultValue: 'Классу' })}
                  </Button>
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Книги и задачи */}
      <Accordion disableGutters onChange={(_, expanded) => { if (expanded) void loadBooks(); }}>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Stack direction="row" spacing={1} alignItems="center"><MenuBookRoundedIcon fontSize="small" />
            <Typography fontWeight={600}>{t('coachTools.books', { defaultValue: 'Книги и задачи' })}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          {loadingBooks ? <CircularProgress size={20} /> : (
            <Stack spacing={1.5}>
              <TextField
                select size="small" fullWidth sx={DARK_FIELD_SX}
                label={t('coachTools.selectBook', { defaultValue: 'Задачник / книга' })}
                value={selectedBookId}
                onChange={(e) => void selectBook(e.target.value)}
                SelectProps={{ MenuProps: DARK_MENU_PROPS }}
              >
                <MenuItem value="">—</MenuItem>
                {books.map((b) => (
                  <MenuItem key={b._id} value={b._id}>{b.title} ({b.exercisesCount})</MenuItem>
                ))}
              </TextField>
              {booksLoaded && books.length === 0 && (
                <Typography variant="body2" color="text.secondary">{t('coachTools.noBooks', { defaultValue: 'Книг пока нет — создайте в разделе «Оцифровщик».' })}</Typography>
              )}

              {loadingBook && <CircularProgress size={20} />}
              {book && (
                <Box sx={{ maxHeight: 280, overflowY: 'auto', pr: 0.5 }}>
                  <Stack spacing={0.75}>
                    {exercises.map((ex, i) => (
                      <Stack key={ex._id} direction="row" alignItems="center" spacing={1}
                        sx={{ p: 0.75, borderRadius: 1, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                          {ex.number ?? i + 1}. {ex.title || t('coachTools.exercise', { defaultValue: 'Упражнение' })}
                        </Typography>
                        {ex.solution?.trim() ? (
                          <Button size="small" variant="contained" onClick={() => solveBookExercise(ex)}>
                            {t('coachTools.solve', { defaultValue: 'Решать' })}
                          </Button>
                        ) : (
                          <Button size="small" variant="outlined" onClick={() => loadExercise(ex)}>
                            {t('coachTools.toBoard', { defaultValue: 'На доску' })}
                          </Button>
                        )}
                        {ex.solution?.trim() && (
                          <Button size="small" onClick={() => studyExercise(ex)}>
                            {t('coachTools.study', { defaultValue: 'Разбор' })}
                          </Button>
                        )}
                      </Stack>
                    ))}
                    {exercises.length === 0 && (
                      <Typography variant="body2" color="text.secondary">{t('coachTools.emptyBook', { defaultValue: 'В книге нет упражнений' })}</Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Задачи по темам (общая база) */}
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Stack direction="row" spacing={1} alignItems="center"><ExtensionRoundedIcon fontSize="small" />
            <Typography fontWeight={600}>{t('coachTools.puzzles', { defaultValue: 'Задачи по темам' })}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.5}>
            <PuzzleSourcePicker value={pSource} onChange={setPSource} fullWidth />
            <TextField
              select size="small" fullWidth sx={DARK_FIELD_SX}
              label={t('coachTools.theme', { defaultValue: 'Тема' })}
              value={pTheme}
              onChange={(e) => setPTheme(e.target.value)}
              helperText={PUZZLE_THEMES.find((th) => th.key === pTheme)?.desc}
              SelectProps={{ MenuProps: DARK_MENU_PROPS, renderValue: (v) => PUZZLE_THEMES.find((th) => th.key === v)?.label ?? '' }}
            >
              {PUZZLE_THEMES.map((th) => (
                <MenuItem key={th.key || 'any'} value={th.key}>
                  <Stack>
                    <span>{th.label}</span>
                    {th.desc && <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'normal' }}>{th.desc}</Typography>}
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select size="small" fullWidth sx={DARK_FIELD_SX}
              label={t('coachTools.difficulty', { defaultValue: 'Сложность' })}
              value={pRating}
              onChange={(e) => setPRating(e.target.value)}
              SelectProps={{ MenuProps: DARK_MENU_PROPS }}
            >
              {RATING_BANDS.map((b) => <MenuItem key={b.key || 'any'} value={b.key}>{b.label}</MenuItem>)}
            </TextField>
            <Button
              variant="contained" size="small" startIcon={loadingPuzzle ? <CircularProgress size={16} color="inherit" /> : <ExtensionRoundedIcon />}
              disabled={loadingPuzzle} onClick={() => void loadRandomPuzzle()}
            >
              {t('coachTools.loadPuzzle', { defaultValue: 'Случайная задача — решать' })}
            </Button>
            <Typography variant="caption" color="text.secondary">
              {t('coachTools.puzzlesHint', { defaultValue: 'Доска перейдёт в режим решения: позиция, нужная сторона снизу, проверка ходов. Передайте ход ученику, чтобы он решал.' })}
            </Typography>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Позиция по FEN */}
      <Accordion disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
          <Stack direction="row" spacing={1} alignItems="center"><GridOnRoundedIcon fontSize="small" />
            <Typography fontWeight={600}>{t('coachTools.position', { defaultValue: 'Позиция (FEN)' })}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1}>
            <TextField
              size="small" fullWidth multiline minRows={2}
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              label="FEN"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="contained" disabled={!fenInput.trim()} onClick={() => pushFen(fenInput.trim())}>
                {t('coachTools.toBoard', { defaultValue: 'На доску' })}
              </Button>
              <Button size="small" variant="outlined" color="inherit" startIcon={<RestartAltRoundedIcon />} onClick={onReset}>
                {t('coachTools.startPos', { defaultValue: 'Начальная' })}
              </Button>
              <Tooltip title={t('coachTools.copyCurrent', { defaultValue: 'Скопировать текущий FEN' })}>
                <span>
                  <IconButton size="small" onClick={() => { setFenInput(fen); navigator.clipboard?.writeText(fen).catch(() => {}); }}>
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Разбор решения деревом вариантов (как в курсах/задачах) — виден только тренеру.
          Клик по ходу/варианту выставляет его позицию на общую доску всем в классе. */}
      {studyTitle && (
        <Box sx={{ mt: 1.5, p: 1, borderRadius: '10px', bgcolor: 'surface.raised', border: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
            <MenuBookRoundedIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1 }}>
              {t('coachTools.studying', { defaultValue: 'Разбор' })}: {studyTitle}
            </Typography>
            <Button size="small" color="inherit" onClick={closeStudy}>{t('coachTools.closeStudy', { defaultValue: 'Закрыть' })}</Button>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mb: 0.5 }}>
            <IconButton size="small" onClick={game.actions.toStart}><FirstPageRoundedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={game.actions.back}><NavigateBeforeRoundedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={game.actions.forward}><NavigateNextRoundedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={game.actions.toEnd}><LastPageRoundedIcon fontSize="small" /></IconButton>
            {!canControl && (
              <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                {t('coachTools.studyNeedControl', { defaultValue: 'Верните ход, чтобы вести разбор на доске' })}
              </Typography>
            )}
          </Stack>
          <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
            <VariationTree tree={game.tree} currentId={game.current.id} onSelect={game.actions.goTo} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CoachToolsPanel;
