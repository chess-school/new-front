import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { alpha, Alert, Box, Button, Chip, CircularProgress, LinearProgress, Stack, Typography, Zoom } from '@mui/material';
import { keyframes } from '@mui/system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import MemoryIcon from '@mui/icons-material/Memory';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Chess, Square } from 'chess.js';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getPuzzleBook } from '@/api/digitizer';
import { useAuth } from '@/context/AuthContext';
import { PuzzleBook } from '@/types/PuzzleBook';
import { ChessBoard } from '@/features/Chess/components/ChessBoard';
import { ChessArena, ArenaPanel } from '@/features/Chess/components/ChessArena';
import { AskInChatButton } from '@/features/Chat';
import { EnginePanel } from '@/features/Chess/components/EnginePanel';
import { AnalysisBoard } from '@/features/Chess/components/AnalysisBoard';
import { useEngineAnalysis, useStockfishEngine } from '@/features/Chess/engine/useStockfish';
import { formatScore, pvToSan } from '@/features/Chess/engine/stockfish';
import { compareMove } from '@/features/Chess/engine/moveCheck';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import { ExerciseList } from '../components/ExerciseList';
import { ENGINE_ARROW } from '../components/boardStyle';
import { useSolveSession } from '../hooks/useSolveSession';
import { formatMoveNumber } from '../utils/pgnTree';

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

// Решённые задания запоминаются в браузере ученика
const solvedKey = (bookId: string) => `puzzleBook.solved.${bookId}`;
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

  const index = Math.max(0, Math.min(Number(searchParams.get('ex')) || 0, (book?.exercises.length ?? 1) - 1));
  const exercise = book?.exercises[index];
  const session = useSolveSession(exercise);

  useEffect(() => {
    setLoading(true);
    getPuzzleBook(bookId)
      .then(setBook)
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [bookId]);

  const selectExercise = useCallback((i: number) => {
    setSearchParams({ ex: String(i) }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (session.status !== 'solved' || !exercise || solved.has(exercise._id)) return;
    const next = new Set(solved).add(exercise._id);
    setSolved(next);
    try {
      localStorage.setItem(solvedKey(bookId), JSON.stringify([...next]));
    } catch {
      // хранилище недоступно — прогресс останется только до перезагрузки
    }
  }, [session.status, exercise, solved, bookId]);

  // --- Stockfish: создаётся по первому запросу (оценка / подсказка / разбор хода), уничтожается при уходе ---
  const [showEval, setShowEval] = useState(false);
  const [evalRefresh, setEvalRefresh] = useState(0);
  const [engineHint, setEngineHint] = useState<{ from: Square; to: Square; san: string; score: string } | null>(null);
  const [engineBusy, setEngineBusy] = useState(false);
  const [moveCheck, setMoveCheck] = useState<{ text: string; severity: 'info' | 'warning' } | null>(null);
  const checkSeq = useRef(0);
  // Разбор: после решения, после «Показать решение» или если эталонного решения нет
  const [revealed, setRevealed] = useState(false);
  const analysisMode = session.status === 'solved' || session.status === 'noSolution' || revealed;
  const fenRef = useRef(session.fen);
  fenRef.current = session.fen;
  const { engine, ensure } = useStockfishEngine(showEval);
  // Только оценка, без линий: линия движка раскрыла бы решение
  const { result: evalResult, analyzing } = useEngineAnalysis(engine, session.fen, { enabled: showEval && !analysisMode, depth: 14, refreshKey: evalRefresh });

  useEffect(() => { setEngineHint(null); }, [session.fen]);
  useEffect(() => { setMoveCheck(null); checkSeq.current++; setRevealed(false); }, [exercise?._id]);

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

  /** Ход не совпал с книгой: движок говорит, насколько он хуже лучшего (или не хуже — тогда это сильная альтернатива) */
  const explainWrongMove = async (fenBefore: string, fenAfter: string, mover: 'w' | 'b') => {
    const seq = ++checkSeq.current;
    setMoveCheck({ text: t('engine.checkingMove'), severity: 'info' });
    const cmp = await compareMove(ensure(), fenBefore, fenAfter, mover, 12);
    if (seq !== checkSeq.current) return; // ученик уже сделал следующий ход или сменил задачу
    setEvalRefresh((k) => k + 1); // разбор прервал живую оценку — перезапускаем её
    if (!cmp) { setMoveCheck(null); return; }
    setMoveCheck(cmp.alsoStrong
      ? { text: t('engine.alsoStrong', { played: cmp.playedScore }), severity: 'info' }
      : { text: t('engine.worse', { played: cmp.playedScore, best: cmp.bestScore }), severity: 'warning' });
  };

  const handleMove = (from: Square, to: Square, promotion?: string): boolean => {
    const fenBefore = session.fen;
    // Позиция после хода — для разбора движком, если ход не совпадёт с книгой
    let fenAfter: string | null = null;
    try {
      const probe = new Chess(fenBefore);
      if (probe.move(promotion ? { from, to, promotion } : { from, to })) fenAfter = probe.fen();
    } catch {
      fenAfter = null;
    }
    const verdict = session.tryMove(from, to, promotion);
    if (verdict === 'wrong') {
      setShake((n) => n + 1);
      notification.error({ message: t('digitizer.solve.wrongMove'), description: undefined, duration: 2 });
      if (fenAfter) explainWrongMove(fenBefore, fenAfter, session.playerColor);
    } else if (verdict === 'correct') {
      checkSeq.current++;
      setMoveCheck(null);
    }
    return verdict === 'correct';
  };

  /** Лучший ход движка стрелкой и оценка — по запросу ученика */
  const showEngineHint = async () => {
    const fen = session.fen;
    setEngineBusy(true);
    const result = await ensure().analyze(fen, { depth: 14 });
    setEngineBusy(false);
    setEvalRefresh((k) => k + 1);
    if (fenRef.current !== fen || !result.bestMove || !result.lines[0]) return;
    setEngineHint({
      from: result.bestMove.slice(0, 2) as Square,
      to: result.bestMove.slice(2, 4) as Square,
      san: pvToSan(fen, [result.bestMove], 1),
      score: formatScore(result.lines[0]),
    });
  };

  const hintStyles = useMemo(
    () => (session.hintSquare ? { [session.hintSquare]: { boxShadow: `inset 0 0 0 4px ${tokens.accent.gold}` } } : {}),
    [session.hintSquare],
  );
  const engineArrows = useMemo<Arrow[]>(
    () => (engineHint ? [[engineHint.from, engineHint.to, ENGINE_ARROW]] : []),
    [engineHint],
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
  const players = meta.white && meta.black ? `${meta.white} – ${meta.black}` : '';
  const gameInfo = [players, meta.site, meta.year].filter(Boolean).join(', ');
  const solvedTotal = book.exercises.filter((e) => solved.has(e._id)).length;
  const orientation = session.playerColor === 'w' ? 'white' : 'black';
  const statusText = {
    playing: session.movesPlayed === 0
      ? t(session.playerColor === 'w' ? 'digitizer.solve.whiteToMove' : 'digitizer.solve.blackToMove')
      : t('digitizer.solve.correctContinue'),
    opponent: t('digitizer.solve.opponentThinking'),
    solved: t('digitizer.solve.solved'),
    noSolution: t('digitizer.solve.noSolution'),
  }[session.status];
  const statusTone = session.status === 'solved' ? 'success' : session.status === 'noSolution' ? 'info' : 'primary';

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
          customArrows={engineArrows}
          lastMove={lastMove}
          premoves
          premoveKey={exercise._id}
        />
      <Zoom in={session.status === 'solved'}>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <CheckCircleIcon sx={{ fontSize: 140, color: 'success.main', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.6))' }} />
        </Box>
      </Zoom>
    </Box>
  );

  // Всегда на виду: название, партия, статус решения
  const header = (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="h2">{exercise.title}</Typography>
          {gameInfo && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{gameInfo}</Typography>}
        </Box>
        <Chip size="small" variant="outlined" label={`${index + 1} / ${book.exercises.length}`} sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }} />
      </Stack>
      <Box
        role="status"
        data-testid="solve-status"
        sx={(theme) => ({
          mt: 1.5, px: 1.5, py: 1, borderRadius: 2, fontWeight: 600,
          color: `${statusTone}.main`,
          bgcolor: alpha(theme.palette[statusTone].main, 0.12),
          border: `1px solid ${alpha(theme.palette[statusTone].main, 0.3)}`,
        })}
      >
        {statusText}
      </Box>
      {/* Подсказка разбора — в шапке: в разборе первая вкладка — ходы, а не упражнение */}
      {analysisMode && <Alert severity="info" sx={{ mt: 1.5 }}>{t('digitizer.solve.analysisHint')}</Alert>}
    </Box>
  );

  const exercisePanel = (
    <Stack spacing={2}>
      {exercise.comment && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{exercise.comment}</Typography>}
      {session.lastNode?.comment && (
        <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {formatMoveNumber(session.lastNode)} {session.lastNode.san}: {session.lastNode.comment}
        </Typography>
      )}
      {moveCheck && <Alert severity={moveCheck.severity} data-testid="move-check">{moveCheck.text}</Alert>}
      {engineHint && (
        <Alert severity="info" icon={<MemoryIcon />}>
          {t('engine.bestMoveHint', { move: engineHint.san, score: engineHint.score })}
        </Alert>
      )}
      {session.hintSquare && exercise.hint && <Alert severity="info" icon={<LightbulbOutlinedIcon />}>{exercise.hint}</Alert>}
      {session.mistakes > 0 && (
        <Typography variant="body2" color="error.main">{t('digitizer.solve.mistakes', { count: session.mistakes })}</Typography>
      )}
      <Box sx={{ display: analysisMode ? 'none' : 'block' }}>
        {/* maxLines 0: только число — линии движка раскрыли бы решение */}
        <EnginePanel
          enabled={showEval}
          onToggle={setShowEval}
          result={evalResult}
          analyzing={analyzing}
          engineName={engine?.name}
          error={engine?.error}
          maxLines={0}
        />
      </Box>
    </Stack>
  );

  // Решение — только после решения / «Показать решение», иначе оно раскрыло бы задачу
  const solutionPanel = analysisMode ? (
    session.mainline.length > 0 ? (
      <Box data-testid="solution-line" sx={{ lineHeight: 2 }}>
        {session.mainline.map((node) => (
          <Box component="span" key={node.id} sx={{ mr: 0.75 }}>
            {(node.color === 'w' || node.ply === 0) && (
              <Box component="span" sx={{ color: 'text.disabled', mr: 0.5 }}>{formatMoveNumber(node)}</Box>
            )}
            <Box component="span" sx={{ fontWeight: 700 }}>{node.san}</Box>
            {node.comment && <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 0.5 }}>{node.comment}</Box>}
          </Box>
        ))}
      </Box>
    ) : <Typography color="text.secondary">{t('digitizer.solve.noSolution')}</Typography>
  ) : (
    <Stack alignItems="center" spacing={1} sx={{ py: 3, textAlign: 'center' }}>
      <LockOutlinedIcon sx={{ color: 'text.disabled' }} />
      <Typography variant="body2" color="text.secondary">
        {t('digitizer.solve.solutionLocked', 'The solution opens once you solve the exercise or press “Show solution”.')}
      </Typography>
    </Stack>
  );

  const panels: ArenaPanel[] = [
    { key: 'exercise', label: t('digitizer.solve.tabs.exercise', 'Exercise'), icon: <ExtensionOutlinedIcon />, content: exercisePanel },
    { key: 'solution', label: t('digitizer.solve.tabs.solution', 'Solution'), icon: <TimelineIcon />, content: solutionPanel },
    {
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
    },
  ];

  const controls = (
    <Stack spacing={1}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, auto)', md: 'repeat(2, 1fr)' }, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LightbulbOutlinedIcon />}
          onClick={session.showHint}
          disabled={session.status !== 'playing' || analysisMode}
        >
          {t('digitizer.solve.hint')}
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={engineBusy ? <CircularProgress size={16} /> : <MemoryIcon />}
          onClick={showEngineHint}
          disabled={engineBusy || session.status === 'opponent' || analysisMode}
        >
          {t('engine.showBestMove')}
        </Button>
        {!analysisMode && solutionUci.length > 0 && (
          <Button variant="outlined" color="warning" startIcon={<VisibilityOutlinedIcon />} onClick={() => setRevealed(true)} disabled={session.status === 'opponent'}>
            {t('digitizer.solve.showSolution')}
          </Button>
        )}
        <Button variant="outlined" color="inherit" startIcon={<ReplayIcon />} onClick={() => { setRevealed(false); session.reset(); }}>
          {t('digitizer.solve.restart')}
        </Button>
      </Box>
      {/* Вопрос тренеру по этому упражнению — диалог с темой «книга / упражнение» */}
      {!isStaff && (
        <AskInChatButton size="small" sx={{ alignSelf: 'flex-start' }}
          context={{ kind: 'book', refId: `${book._id}:${exercise._id}`, title: `${book.title} — ${exercise.title}`.slice(0, 200) }} />
      )}
      <Button
        variant="contained"
        color="success"
        size="large"
        endIcon={<ArrowForwardIcon />}
        disabled={!hasNext || !analysisMode}
        onClick={() => selectExercise(index + 1)}
        fullWidth
      >
        {t('digitizer.solve.next')}
      </Button>
      {hasNext && !analysisMode && (
        <Button size="small" color="inherit" sx={{ color: 'text.secondary', alignSelf: 'center' }} onClick={() => selectExercise(index + 1)}>
          {t('digitizer.solve.skip')}
        </Button>
      )}
    </Stack>
  );

  return (
    <PageContainer dense>
      <PageHeader dense
        eyebrow={t('digitizer.books.heading')}
        title={book.title}
        subtitle={(
          <Stack component="span" direction="row" spacing={1.5} alignItems="center" sx={{ display: 'inline-flex' }}>
            <span>{t('digitizer.solve.progress', { solved: solvedTotal, total: book.exercises.length })}</span>
            <LinearProgress
              variant="determinate"
              value={book.exercises.length ? (solvedTotal / book.exercises.length) * 100 : 0}
              color="success"
              sx={{ width: 120, height: 6 }}
              aria-hidden
            />
          </Stack>
        )}
        actions={isStaff && (
          <Button component={RouterLink} to={`/digitizer/books/${book._id}/edit?ex=${index}`} startIcon={<EditIcon />} variant="outlined" color="inherit">
            {t('digitizer.solve.openEditor')}
          </Button>
        )}
      />
      {analysisMode ? (
        // Разбор: доска разбора сама раскладывает арену, панели задачника — дополнительными вкладками
        <AnalysisBoard
          variant="arena"
          startFen={exercise.fen}
          moves={solutionUci}
          initialPly={session.status === 'solved' ? solutionUci.length : session.movesPlayed}
          orientation={orientation}
          engine={engine}
          engineOn={showEval}
          onToggleEngine={setShowEval}
          header={header}
          extraPanels={panels}
          extraControls={controls}
          comments={solutionComments}
        />
      ) : (
      <ChessArena
        board={board}
        showEval={showEval}
        evalResult={evalResult}
        orientation={orientation}
        header={header}
        panels={panels}
        controls={controls}
      />
      )}
    </PageContainer>
  );
};
