import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { alpha, Alert, Box, Button, Chip, CircularProgress, IconButton, LinearProgress, Stack, Tooltip, Typography, Zoom } from '@mui/material';
import { keyframes } from '@mui/system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Chess, Square } from 'chess.js';
import { useTranslation } from 'react-i18next';

import { getPuzzleBook } from '@/api/digitizer';
import { useAuth } from '@/context/AuthContext';
import { AttemptRatingResult, DEFAULT_SOLVE_SETTINGS, PuzzleBook } from '@/types/PuzzleBook';
import { ChessBoard } from '@/features/Chess/components/ChessBoard';
import { ResizableBoard } from '@/features/Chess/components/ResizableBoard';
import { ArenaPanel } from '@/features/Chess/components/ChessArena';
import { MobMascot, MascotMood } from '@/features/Chess/components/MobMascot';
import { AnalysisBoard } from '@/features/Chess/components/AnalysisBoard';
import { useStockfishEngine } from '@/features/Chess/engine/useStockfish';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import { ExerciseList } from '../components/ExerciseList';
import { useSolveSession } from '../hooks/useSolveSession';
import { saveExerciseStats } from '../utils/exerciseStats';

// Условия разблокировки подсказки и прочие правила решения задаёт тренер (book.solveSettings).
// Секундомер в формате MM:SS
const formatClock = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const successGlow = keyframes`
  0%   { box-shadow: 0 0 0 0 ${alpha(tokens.accent.emerald, 0.85)}; }
  70%  { box-shadow: 0 0 0 18px ${alpha(tokens.accent.emerald, 0)}; }
  100% { box-shadow: 0 0 0 0 ${alpha(tokens.accent.emerald, 0)}; }
`;
const wrongShake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
`;

// Облачко-реплика маскота: подсказка/комментарий «из клюва». Появляется только когда есть что сказать.
const SpeechBubble: React.FC<{ children: React.ReactNode; tone?: 'default' | 'error' | 'success' }> = ({ children, tone = 'default' }) => {
  const borderColor = tone === 'error' ? 'error.main' : tone === 'success' ? 'success.main' : 'divider';
  return (
    <Box
      sx={(theme) => ({
        position: 'relative', maxWidth: 300, alignSelf: 'stretch',
        bgcolor: 'background.paper', color: 'text.primary',
        border: 1, borderColor, borderRadius: 2, px: 1.75, py: 1.25, boxShadow: 4,
        '&::before': { content: '""', position: 'absolute', left: 26, bottom: -11, width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `10px solid ${theme.palette.divider}` },
        '&::after': { content: '""', position: 'absolute', left: 27, bottom: -9, width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `9px solid ${theme.palette.background.paper}` },
      })}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{children}</Typography>
    </Box>
  );
};

// Плавный «набег» числа от from к to за duration мс (requestAnimationFrame, с ease-out).
const useCountUp = (from: number, to: number, duration = 900): number => {
  const [value, setValue] = useState(to);
  useEffect(() => {
    if (from === to) { setValue(to); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration]);
  return value;
};

// Карточка изменения рейтинга после попытки: крупная анимированная дельта игрока + новый рейтинг задачи.
const RatingChange: React.FC<{ rating: AttemptRatingResult }> = ({ rating }) => {
  const { t } = useTranslation();
  const animated = useCountUp(rating.userRatingBefore, rating.userRating);
  const up = rating.userDelta >= 0;
  const deltaColor = up ? 'success.main' : 'error.main';
  const puzzleUp = rating.puzzleDelta >= 0;
  return (
    <Box data-testid="rating-change" sx={{ mt: 1, width: '100%', maxWidth: 300 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="center" spacing={1}>
        <Typography variant="body2" color="text.secondary">
          {t('digitizer.solve.yourRating', 'Your rating')}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {animated}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: deltaColor, fontVariantNumeric: 'tabular-nums' }}>
          {up ? '+' : '−'}{Math.abs(rating.userDelta)}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.25 }}>
        {t('digitizer.solve.puzzleRatingNow', {
          defaultValue: 'Puzzle rating: {{rating}} ({{sign}}{{delta}})',
          rating: rating.puzzleRating,
          sign: puzzleUp ? '+' : '−',
          delta: Math.abs(rating.puzzleDelta),
        })}
      </Typography>
    </Box>
  );
};

// Решённые задания запоминаются в браузере ученика
const solvedKey = (bookId: string) => `puzzleBook.solved.${bookId}`;
// Последнее открытое задание в книге — чтобы в следующий раз продолжить с места, где остановились
const lastPosKey = (bookId: string) => `puzzleBook.lastExercise.${bookId}`;
const loadSolved = (bookId: string): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(solvedKey(bookId)) || '[]'));
  } catch {
    return new Set();
  }
};

export const BookSolvePage: React.FC = () => {
  const { t } = useTranslation();
  const { bookId = '' } = useParams<{ bookId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isStaff = !!user?.roles?.some((role) => role === 'COACH' || role === 'ADMIN');

  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState<Set<string>>(() => loadSolved(bookId));
  const [shake, setShake] = useState(0);
  // Переворот доски — настройка вида (в TopBar), сохраняется между заданиями
  const [flip, setFlip] = useState(false);
  // Инлайновая обратная связь по последнему ходу (мягко-красная) — вместо всплывающего тоста
  const [feedback, setFeedback] = useState<'wrong' | null>(null);
  // Последний пересчёт рейтингов (user/puzzle) с бэкенда — показываем в баннере результата
  const [ratingResult, setRatingResult] = useState<AttemptRatingResult | null>(null);

  const index = Math.max(0, Math.min(Number(searchParams.get('exercise')) || 0, (book?.exercises.length ?? 1) - 1));
  const exercise = book?.exercises[index];
  const session = useSolveSession(exercise);

  useEffect(() => {
    setLoading(true);
    getPuzzleBook(bookId)
      .then(setBook)
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [bookId]);

  // Меняем один параметр, не затирая остальные (номер задания ↔ вкладка)
  const patchParams = useCallback((mutate: (p: URLSearchParams) => void) => {
    setSearchParams((prev) => { const p = new URLSearchParams(prev); mutate(p); return p; }, { replace: true });
  }, [setSearchParams]);
  const selectExercise = useCallback((i: number) => {
    patchParams((p) => p.set('exercise', String(i)));
    // Запоминаем позицию, чтобы при следующем открытии книги продолжить с этого задания
    try { localStorage.setItem(lastPosKey(bookId), String(i)); } catch { /* хранилище недоступно */ }
  }, [patchParams, bookId]);

  // Открыли книгу без явного ?exercise= — продолжаем с последнего задания ученика (прямую ссылку уважаем)
  const restoredFor = useRef<string | null>(null);
  useEffect(() => {
    if (loading || !book || restoredFor.current === bookId) return;
    restoredFor.current = bookId;
    if (searchParams.get('exercise') !== null) return;
    let saved = 0;
    try { saved = Number(localStorage.getItem(lastPosKey(bookId))); } catch { saved = 0; }
    const target = Number.isFinite(saved) && saved > 0 ? Math.min(saved, book.exercises.length - 1) : 0;
    if (target > 0) patchParams((p) => p.set('exercise', String(target)));
  }, [loading, book, bookId, searchParams, patchParams]);

  useEffect(() => {
    if (session.status !== 'solved' || !exercise || solved.has(exercise._id)) return;
    const next = new Set(solved).add(exercise._id);
    setSolved(next);
    try {
      localStorage.setItem(solvedKey(bookId), JSON.stringify([...next]));
    } catch {
      // хранилище недоступно — прогресс останется только до перезагрузки
    }
    // Фиксируем метрику решения для модуля статистики и забираем пересчёт рейтингов
    void saveExerciseStats(bookId, {
      exerciseId: exercise._id,
      timeTakenSeconds: session.elapsedSeconds,
      attemptsCount: session.mistakes,
      usedHint: session.usedHint,
      solvedAt: new Date().toISOString(),
      solved: true,
    }).then((rating) => { if (rating) setRatingResult(rating); });
  }, [session.status, session.elapsedSeconds, session.mistakes, session.usedHint, exercise, solved, bookId]);

  // --- Stockfish: нужен только в режиме разбора (после решения) — для оценки и линий движка на доске разбора.
  // Во время решения движок и любые подсказки-читы полностью скрыты.
  const [showEval, setShowEval] = useState(false);
  // Ученик «сдался» (если тренер разрешил показ решения) — открываем разбор досрочно
  const [revealed, setRevealed] = useState(false);
  // Явно открыл разбор ПОСЛЕ самостоятельного решения (кнопка «Разбор»)
  const [studying, setStudying] = useState(false);
  // Разбор (движок + решение) — после самостоятельного решения, после сдачи (если разрешена) или если нет эталона
  const analysisMode = revealed || studying || session.status === 'noSolution';
  const { engine } = useStockfishEngine(showEval);
  // Новое задание — обратная связь и разбор сброшены
  useEffect(() => { setRevealed(false); setStudying(false); setFeedback(null); setRatingResult(null); }, [exercise?._id]);

  // Линия решения в UCI — для доски разбора
  const solutionUci = useMemo(() => {
    if (!exercise) return [];
    const uci: string[] = [];
    for (const node of session.mainline) {
      try {
        const m = new Chess(node.parent ? node.parent.fen : exercise.fen).move(node.san);
        uci.push(`${m.from}${m.to}${m.promotion ?? ''}`);
      } catch {
        break;
      }
    }
    return uci;
  }, [session.mainline, exercise]);

  // Комментарии книги к ходам решения — в разборе под ходами, как на Lichess
  const solutionComments = useMemo(() => {
    const result: Record<number, string> = {};
    session.mainline.slice(0, solutionUci.length).forEach((node) => {
      const add = (ply: number, text?: string) => {
        if (text?.trim()) result[ply] = result[ply] ? `${result[ply]}
${text.trim()}` : text.trim();
      };
      add(node.ply, node.commentBefore);
      add(node.ply + 1, node.comment);
    });
    return result;
  }, [session.mainline, solutionUci.length]);

  const handleMove = (from: Square, to: Square, promotion?: string): boolean => {
    const verdict = session.tryMove(from, to, promotion);
    if (verdict === 'wrong') {
      setShake((n) => n + 1);
      setFeedback('wrong');
    } else if (verdict === 'correct') {
      setFeedback(null);
    }
    return verdict === 'correct';
  };

  // «Сдаться» (доступно, только если тренер разрешил показ решения): открываем разбор + фиксируем попытку
  const giveUp = useCallback(() => {
    setRevealed(true);
    if (exercise) {
      void saveExerciseStats(bookId, {
        exerciseId: exercise._id,
        timeTakenSeconds: session.elapsedSeconds,
        attemptsCount: session.mistakes,
        usedHint: session.usedHint,
        solvedAt: new Date().toISOString(),
        solved: false,
      }).then((rating) => { if (rating) setRatingResult(rating); });
    }
  }, [bookId, exercise, session.elapsedSeconds, session.mistakes, session.usedHint]);

  const hintStyles = useMemo(
    () => (session.hintSquare ? { [session.hintSquare]: { boxShadow: `inset 0 0 0 4px ${tokens.accent.gold}` } } : {}),
    [session.hintSquare],
  );

  // Последний сыгранный ход решения — подсветка полей
  const lastMove = useMemo(() => {
    const node = session.lastNode;
    if (!node || !exercise) return null;
    try {
      const m = new Chess(node.parent ? node.parent.fen : exercise.fen).move(node.san);
      return { from: m.from, to: m.to };
    } catch {
      return null;
    }
  }, [session.lastNode, exercise]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  }
  if (!book || !exercise) {
    return (
      <PageContainer dense>
        <Alert severity="info">{t('digitizer.solve.notFound')}</Alert>
      </PageContainer>
    );
  }

  const hasNext = index < book.exercises.length - 1;
  const meta = exercise.meta || {};
  const whiteName = meta.white?.trim();
  const blackName = meta.black?.trim();
  const hasPlayers = !!(whiteName || blackName);
  // Турнирная инфа (место/год) — ОТДЕЛЬНО от имён игроков: имена идут табличками у доски
  const eventInfo = [meta.site, meta.year].filter(Boolean).join(', ');
  const solvedTotal = book.exercises.filter((e) => solved.has(e._id)).length;
  const baseOrientation = session.playerColor === 'w' ? 'white' : 'black';
  const orientation: 'white' | 'black' = flip ? (baseOrientation === 'white' ? 'black' : 'white') : baseOrientation;
  // Сдался (revealed), задача не решена и не «без решения» — отдельный статус разбора
  const revealedOnly = revealed && session.status !== 'solved' && session.status !== 'noSolution';
  const statusText = revealedOnly
    ? t('digitizer.solve.revealed', { defaultValue: 'Solution revealed — explore it below.' })
    : {
        playing: session.movesPlayed === 0
          ? t(session.playerColor === 'w' ? 'digitizer.solve.whiteToMove' : 'digitizer.solve.blackToMove')
          : t('digitizer.solve.correctContinue'),
        opponent: t('digitizer.solve.opponentThinking'),
        solved: t('digitizer.solve.solved'),
        noSolution: t('digitizer.solve.noSolution'),
      }[session.status];
  const statusTone = session.status === 'solved' ? 'success' : (session.status === 'noSolution' || revealedOnly) ? 'info' : 'primary';

  // Правила решения, заданные тренером (с дефолтами, если книга старая/без настроек)
  const S = { ...DEFAULT_SOLVE_SETTINGS, ...(book.solveSettings || {}) };
  // Подсказка: разрешена тренером И (прошло N минут ИЛИ сделано N ошибок)
  const hintSeconds = S.hintUnlockMinutes * 60;
  const hintUnlocked = S.hintsEnabled && (session.elapsedSeconds >= hintSeconds || session.mistakes >= S.hintUnlockMistakes);
  const hintMinutesLeft = Math.max(1, Math.ceil((hintSeconds - session.elapsedSeconds) / 60));

  // Доска: решение или разбор; анимации «верно»/«ошибка» и галочка поверх
  const board = (
    <Box
      key={`${exercise._id}-${shake}`}
      sx={{
        position: 'relative',
        borderRadius: '10px',
        animation: session.status === 'solved'
          ? `${successGlow} 1.2s ease-out 2`
          : shake > 0 ? `${wrongShake} 0.3s ease-in-out` : 'none',
      }}
    >
        <ChessBoard
          fen={session.fen}
          onMove={handleMove}
          boardOrientation={orientation}
          customSquareStyles={hintStyles}
          lastMove={lastMove}
          premoves
          premoveKey={exercise._id}
          coordinates="outside"
        />
      <Zoom in={session.status === 'solved'}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <CheckCircleIcon sx={{ fontSize: 140, color: 'success.main', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.6))' }} />
        </Box>
      </Zoom>
    </Box>
  );

  // --- Маскот-ассистент: настроение, облачко-реплика и плашка хода ---
  let mascotMood: MascotMood = 'waiting';
  let bubble: { text: React.ReactNode; tone: 'default' | 'error' | 'success' } | null = null;
  let bannerTitle = '';
  let bannerSubtitle = '';
  let bannerColor = 'primary.main';
  if (session.status === 'solved') {
    mascotMood = 'happy';
    bannerTitle = t('digitizer.solve.solvedTitle', { defaultValue: 'Solved!' });
    bannerColor = 'success.main';
    bubble = { text: t('digitizer.solve.cheerSolved', { defaultValue: 'Excellent! Puzzle solved 🎉' }), tone: 'success' };
  } else if (session.status === 'opponent') {
    bannerTitle = t('digitizer.solve.opponentThinking');
  } else {
    // playing
    if (feedback === 'wrong') {
      mascotMood = 'thinking';
      bubble = { text: t('digitizer.solve.cheerWrong', { defaultValue: 'Not that move — try again.' }), tone: 'error' };
    } else if (session.hintSquare && exercise.hint) {
      mascotMood = 'teaching';
      bubble = { text: exercise.hint, tone: 'default' };
    } else if (session.lastNode?.comment) {
      mascotMood = 'teaching';
      bubble = { text: session.lastNode.comment, tone: 'default' };
    }
    bannerTitle = session.movesPlayed === 0
      ? t('digitizer.solve.yourMove', { defaultValue: 'Your move' })
      : t('digitizer.solve.keepGoing', { defaultValue: 'Correct — keep going!' });
    bannerSubtitle = session.movesPlayed === 0
      ? t(session.playerColor === 'w' ? 'digitizer.solve.findBestWhite' : 'digitizer.solve.findBestBlack',
          { defaultValue: session.playerColor === 'w' ? 'Find the best move for White' : 'Find the best move for Black' })
      : '';
    if (feedback === 'wrong') bannerColor = 'error.main';
  }

  const timerChip = (
    <Chip size="small" variant="outlined" icon={<AccessTimeRoundedIcon />}
      label={formatClock(session.elapsedSeconds)} data-testid="solve-timer"
      color={session.status === 'solved' ? 'success' : 'default'}
      sx={{ fontVariantNumeric: 'tabular-nums' }} />
  );

  // Плавающий ассистент справа от доски: облачко → маскот → плашка хода → таймер
  const assistant = (
    <Stack alignItems="center" spacing={1.5} sx={{ width: '100%', maxWidth: 300, mx: 'auto', position: { md: 'sticky' }, top: { md: 16 } }}>
      {bubble && <SpeechBubble tone={bubble.tone}>{bubble.text}</SpeechBubble>}
      <MobMascot mood={mascotMood} size={140} />
      <Box sx={{ textAlign: 'center', px: 1 }} role="status" data-testid="solve-status">
        <Typography variant="h6" sx={{ fontWeight: 800, color: bannerColor, lineHeight: 1.2 }}>{bannerTitle}</Typography>
        {bannerSubtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{bannerSubtitle}</Typography>}
      </Box>
      {ratingResult && <RatingChange rating={ratingResult} />}
      {timerChip}
    </Stack>
  );

  // Таблички имён игроков — над и под доской (как в вьюере партий); белые/чёрные по ориентации
  const renderPlate = (color: 'white' | 'black') => {
    const name = color === 'white'
      ? (whiteName || t('digitizer.solve.white', { defaultValue: 'White' }))
      : (blackName || t('digitizer.solve.black', { defaultValue: 'Black' }));
    return (
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 0.5, py: 0.25, minWidth: 0 }}>
        <Box sx={{ width: 13, height: 13, borderRadius: '50%', flexShrink: 0, bgcolor: color === 'white' ? '#EADECA' : '#1A1A1A', border: '1px solid', borderColor: 'rgba(255,255,255,0.3)' }} />
        <Typography variant="body2" noWrap sx={{ fontWeight: 700, minWidth: 0 }}>{name}</Typography>
      </Stack>
    );
  };

  // Нижний микро-бар: лёгкие ghost-кнопки под доской (без гигантских заливок)
  const ghostSx = { color: 'text.secondary', textTransform: 'none', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } } as const;
  const bottomActions = (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="center" alignItems="center" sx={{ rowGap: 0.5 }}>
      {session.status !== 'solved' ? (
        <>
          {S.hintsEnabled && (
            <Tooltip
              title={hintUnlocked ? '' : t('digitizer.solve.hintLocked', { minutes: hintMinutesLeft, mistakes: S.hintUnlockMistakes, current: session.mistakes, defaultValue: 'Hint unlocks in {{minutes}} min or after {{mistakes}} mistakes (so far: {{current}}).' })}
              disableHoverListener={hintUnlocked}
            >
              <span>
                <Button size="small" startIcon={<LightbulbOutlinedIcon />} sx={ghostSx} data-testid="hint-button"
                  onClick={session.showHint} disabled={!hintUnlocked || session.status !== 'playing'}>
                  {t('digitizer.solve.hint')}
                </Button>
              </span>
            </Tooltip>
          )}
          {S.allowShowSolution && (
            <Button size="small" startIcon={<FlagOutlinedIcon />} sx={ghostSx} data-testid="give-up-button"
              onClick={giveUp} disabled={session.status === 'opponent'}>
              {t('digitizer.solve.skip')}
            </Button>
          )}
        </>
      ) : (
        <>
          <Button size="small" variant="contained" color="primary" endIcon={<ArrowForwardIcon />} data-testid="next-button"
            disabled={!hasNext} onClick={() => selectExercise(index + 1)}>
            {t('digitizer.solve.next')}
          </Button>
          {solutionUci.length > 0 && (
            <Button size="small" startIcon={<VisibilityOutlinedIcon />} sx={ghostSx} data-testid="study-button" onClick={() => setStudying(true)}>
              {t('digitizer.solve.review', { defaultValue: 'Review' })}
            </Button>
          )}
        </>
      )}
      <Button size="small" startIcon={<ReplayIcon />} sx={ghostSx}
        onClick={() => { session.reset(); setFeedback(null); }}>
        {t('digitizer.solve.restart')}
      </Button>
      <Tooltip title={t('digitizer.solve.flip', { defaultValue: 'Flip board' })}>
        <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={() => setFlip((f) => !f)}
          aria-label={t('digitizer.solve.flip', { defaultValue: 'Flip board' })}>
          <CachedRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  // Вторичная «стеклянная» кнопка (Редактор): прозрачная с тонкой обводкой
  const glassBtnSx = { borderColor: '#2C3545', color: 'text.primary', '&:hover': { borderColor: 'primary.main', bgcolor: alpha(tokens.accent.gold, 0.06) } } as const;

  // Список всех задач — инструмент тренера для быстрого переключения на уроке; ученику не показываем
  const listPanel: ArenaPanel = {
    key: 'list',
    label: t('digitizer.solve.tabs.list', 'List'),
    icon: <FormatListBulletedIcon />,
    content: (
      <ExerciseList
        bare
        exercises={book.exercises}
        selectedIndex={index}
        onSelect={selectExercise}
        summary={t('digitizer.solve.progress', { solved: solvedTotal, total: book.exercises.length })}
        maxHeight="none"
        renderBadge={(e) => (solved.has(e._id)
          ? <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
          : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.disabled' }} />)}
      />
    ),
  };

  // Разбор (после сдачи / по кнопке «Разбор»): лёгкая шапка + навигация к следующей задаче
  const analysisHeader = (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: `${statusTone}.main`, minWidth: 0 }}>{statusText}</Typography>
        {timerChip}
      </Stack>
      {S.showPlayerNames && hasPlayers && (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {(whiteName || t('digitizer.solve.white', { defaultValue: 'White' }))} – {(blackName || t('digitizer.solve.black', { defaultValue: 'Black' }))}
        </Typography>
      )}
      {eventInfo && <Typography variant="caption" color="text.secondary">{eventInfo}</Typography>}
      {ratingResult && <RatingChange rating={ratingResult} />}
      <Alert severity="info">{t('digitizer.solve.analysisHint')}</Alert>
    </Stack>
  );
  const analysisControls = (
    <Stack spacing={1}>
      <Button fullWidth variant="contained" color="primary" endIcon={<ArrowForwardIcon />} disabled={!hasNext}
        onClick={() => selectExercise(index + 1)} data-testid="next-button">
        {t('digitizer.solve.next')}
      </Button>
      <Button size="small" startIcon={<ReplayIcon />} sx={{ color: 'text.secondary', alignSelf: 'center' }}
        onClick={() => { setRevealed(false); setStudying(false); session.reset(); setFeedback(null); }}>
        {t('digitizer.solve.restart')}
      </Button>
    </Stack>
  );

  // Верхний бар: слева — назад + глава + счётчик 2/24 + тонкая полоса; справа — редактор (ТОЛЬКО тренер)
  const topBar = (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 1.5, md: 2 }, minHeight: 44 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
        <Tooltip title={t('digitizer.solve.back', { defaultValue: 'Back to books' })}>
          <IconButton component={RouterLink} to="/books" size="small" sx={{ color: 'text.secondary', flexShrink: 0 }}
            aria-label={t('digitizer.solve.back', { defaultValue: 'Back to books' })}>
            <ArrowBackRoundedIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, minWidth: 0, flexShrink: 1 }}>{book.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {index + 1} / {book.exercises.length}
        </Typography>
        {typeof exercise.rating === 'number' && (
          <Chip
            size="small"
            variant="outlined"
            data-testid="puzzle-rating"
            label={t('digitizer.solve.puzzleRating', {
              defaultValue: 'Puzzle #{{number}} · Rating: {{rating}}',
              number: exercise.number ?? index + 1,
              rating: exercise.rating,
            })}
            sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums', borderColor: alpha(tokens.accent.gold, 0.5), color: 'text.secondary' }}
          />
        )}
        <LinearProgress
          variant="determinate"
          value={book.exercises.length ? (solvedTotal / book.exercises.length) * 100 : 0}
          sx={{ width: { xs: 48, sm: 110 }, height: 5, borderRadius: 3, flexShrink: 0, bgcolor: 'surface.overlay',
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }}
          aria-label={t('digitizer.solve.progress', { solved: solvedTotal, total: book.exercises.length })}
        />
      </Stack>
      {/* Служебный функционал — только тренеру; ученик не отвлекается */}
      {isStaff && (
        <Button component={RouterLink} to={`/digitizer/books/${book._id}/edit?exercise=${index}`}
          startIcon={<EditIcon />} variant="outlined" size="small" sx={{ ...glassBtnSx, flexShrink: 0 }}>
          {t('digitizer.solve.openEditor')}
        </Button>
      )}
    </Stack>
  );

  return (
    <PageContainer dense>
      {topBar}
      {/* Светлая подложка-«сцена» — доска парит на ней, а не на почти чёрном фоне */}
      <Box sx={{ borderRadius: 4, p: { xs: 1.5, md: 3 }, background: 'linear-gradient(180deg, #1C2430 0%, #141A24 100%)', border: '1px solid', borderColor: 'rgba(255,255,255,0.05)' }}>
      {analysisMode ? (
        // Разбор: доска разбора сама раскладывает арену; тренеру — список задач доп. вкладкой
        <AnalysisBoard
          variant="arena"
          startFen={exercise.fen}
          moves={solutionUci}
          initialPly={session.status === 'solved' ? solutionUci.length : session.movesPlayed}
          orientation={orientation}
          engine={engine}
          engineOn={showEval}
          onToggleEngine={setShowEval}
          header={analysisHeader}
          extraPanels={isStaff ? [listPanel] : []}
          extraControls={analysisControls}
          comments={solutionComments}
        />
      ) : (
        // Фокус-доска + плавающий ассистент: без тяжёлой правой карточки, чистый тёмный фон
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 300px' }, gap: { xs: 2, md: 4 }, alignItems: 'start', justifyItems: 'center' }}>
          <Stack alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
            {/* Имена игроков — табличками над/под доской (если тренер не скрыл), шириной с доску */}
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%' }}>
              {S.showPlayerNames && hasPlayers && renderPlate(orientation === 'white' ? 'black' : 'white')}
              <ResizableBoard reserveBottom={150}>{board}</ResizableBoard>
              {S.showPlayerNames && hasPlayers && renderPlate(orientation === 'white' ? 'white' : 'black')}
            </Box>
            {eventInfo && <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{eventInfo}</Typography>}
            {bottomActions}
          </Stack>
          {assistant}
        </Box>
      )}
      </Box>
    </PageContainer>
  );
};
