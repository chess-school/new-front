import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, CircularProgress, FormControlLabel, IconButton, Paper, Stack,
  Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SaveIcon from '@mui/icons-material/Save';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chessboard } from 'react-chessboard';
import { ResizableBoard } from '@/features/Chess/components/ResizableBoard';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { Square } from 'chess.js';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getPuzzleBook, updateExercise, updatePuzzleBook } from '@/api/digitizer';
import { Exercise, ExerciseUpdate, PuzzleBook } from '@/types/PuzzleBook';
import { ExerciseList } from '../components/ExerciseList';
import { MoveTreeView } from '../components/MoveTreeView';
import { PositionEditorBoard } from '../components/PositionEditorBoard';
import { boardStyleProps, ENGINE_ARROW } from '../components/boardStyle';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { EnginePanel } from '@/features/Chess/components/EnginePanel';
import { useEngineAnalysis, useStockfishEngine } from '@/features/Chess/engine/useStockfish';
import { checkSolution, SolutionMoveCheck } from '@/features/Chess/engine/moveCheck';
import { getMainline, MoveNode, parseSolution, setSideToMove, sideToMove, validateFen } from '../utils/pgnTree';

type Draft = Required<ExerciseUpdate>;

const toDraft = (exercise: Exercise): Draft => ({
  title: exercise.title,
  fen: exercise.fen,
  comment: exercise.comment || '',
  hint: exercise.hint || '',
  solution: exercise.solution || '',
});

export const BookEditorPage: React.FC = () => {
  const { t } = useTranslation();
  const { bookId = '' } = useParams<{ bookId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [book, setBook] = useState<PuzzleBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewNode, setPreviewNode] = useState<MoveNode | null>(null);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  const index = Math.max(0, Math.min(Number(searchParams.get('ex')) || 0, (book?.exercises.length ?? 1) - 1));
  const exercise = book?.exercises[index];

  useEffect(() => {
    setLoading(true);
    getPuzzleBook(bookId)
      .then(setBook)
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [bookId]);

  // Новое упражнение — свежий черновик, доска со стороны того, кто ходит
  useEffect(() => {
    if (!exercise) return;
    setDraft(toDraft(exercise));
    setPreviewNode(null);
    setOrientation(sideToMove(exercise.fen) === 'w' ? 'white' : 'black');
  }, [exercise]);

  const isDirty = useMemo(() => {
    if (!exercise || !draft) return false;
    const saved = toDraft(exercise);
    return (Object.keys(saved) as (keyof Draft)[]).some((key) => saved[key] !== draft[key]);
  }, [exercise, draft]);

  // Не теряем правки при закрытии/перезагрузке вкладки (useBlocker недоступен с <BrowserRouter>)
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const fenError = draft ? validateFen(draft.fen) : null;
  const parsed = useMemo(
    () => (draft && !fenError ? parseSolution(draft.fen, draft.solution) : null),
    [draft, fenError],
  );

  // --- Stockfish: живой анализ показанной позиции (стартовой или выбранного хода решения) ---
  const [engineOn, setEngineOn] = useState(() => {
    try { return localStorage.getItem('editor.engineOn') === '1'; } catch { return false; }
  });
  const toggleEngine = (on: boolean) => {
    setEngineOn(on);
    try { localStorage.setItem('editor.engineOn', on ? '1' : '0'); } catch { /* хранилище недоступно */ }
  };
  const [engineRefresh, setEngineRefresh] = useState(0);
  const [solutionCheck, setSolutionCheck] = useState<{ results: SolutionMoveCheck[]; done: number; total: number; running: boolean } | null>(null);
  const checkRun = useRef(0);
  const { engine, ensure } = useStockfishEngine(engineOn);
  const shownFen = previewNode ? previewNode.fen : draft && !fenError ? draft.fen : null;
  const { result: engineResult, analyzing } = useEngineAnalysis(engine, shownFen, {
    enabled: engineOn && !solutionCheck?.running, depth: 16, multiPv: 3, refreshKey: engineRefresh,
  });
  const bestArrow = useMemo<Arrow[]>(() => {
    const best = engineOn && engineResult?.fen === shownFen ? engineResult?.bestMove : null;
    return best ? [[best.slice(0, 2) as Square, best.slice(2, 4) as Square, ENGINE_ARROW]] : [];
  }, [engineOn, engineResult, shownFen]);

  // Проверка устаревает при любой правке позиции/решения или смене упражнения
  useEffect(() => { checkRun.current++; setSolutionCheck(null); }, [draft?.fen, draft?.solution, exercise?._id]);

  /** Сверка каждого хода решающей стороны в главной линии с лучшим ходом движка */
  const runSolutionCheck = async () => {
    if (!draft || !parsed || parsed.error) return;
    const run = ++checkRun.current;
    const mainline = getMainline(parsed.tree);
    setSolutionCheck({ results: [], done: 0, total: mainline.filter((n) => n.color === sideToMove(draft.fen)).length, running: true });
    const results = await checkSolution(ensure(), draft.fen, mainline, sideToMove(draft.fen), {
      depth: 14,
      isCancelled: () => run !== checkRun.current,
      onProgress: (done, total) => { if (run === checkRun.current) setSolutionCheck((c) => c && { ...c, done, total }); },
    });
    if (run !== checkRun.current) return;
    setSolutionCheck((c) => c && { ...c, results, running: false });
    setEngineRefresh((k) => k + 1);
  };
  const nodeById = useMemo(() => {
    const map = new Map<number, MoveNode>();
    const walk = (nodes: MoveNode[]) => nodes.forEach((n) => { map.set(n.id, n); walk(n.children); });
    if (parsed) walk(parsed.tree.roots);
    return map;
  }, [parsed]);

  // Значки в списке: есть решение / нет решения / решение не разбирается
  const solutionState = useMemo(() => {
    const state = new Map<string, 'ok' | 'empty' | 'error'>();
    book?.exercises.forEach((e) => {
      if (!e.solution?.trim()) state.set(e._id, 'empty');
      else state.set(e._id, parseSolution(e.fen, e.solution).error ? 'error' : 'ok');
    });
    return state;
  }, [book]);

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const selectExercise = useCallback((i: number) => {
    if (i === index) return;
    if (isDirty && !window.confirm(t('digitizer.editor.unsavedConfirm'))) return;
    setSearchParams({ ex: String(i) }, { replace: true });
  }, [index, isDirty, setSearchParams, t]);

  const handleSave = async () => {
    if (!book || !exercise || !draft) return;
    setSaving(true);
    try {
      const saved = await updateExercise(book._id, exercise._id, draft);
      setBook((b) => b && { ...b, exercises: b.exercises.map((e) => (e._id === saved._id ? saved : e)) });
      notification.success({ message: t('digitizer.editor.saved'), description: undefined, duration: 2 });
    } catch {
      // ошибку уже показал перехватчик axios
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (published: boolean) => {
    if (!book) return;
    try {
      const updated = await updatePuzzleBook(book._id, { status: published ? 'published' : 'draft' });
      setBook((b) => b && { ...b, status: updated.status });
    } catch {
      // ошибку уже показал перехватчик axios
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>;
  }
  if (!book || !exercise || !draft) {
    return (
      <PageContainer dense>
        <Alert severity="info">{t('digitizer.solve.notFound')}</Alert>
      </PageContainer>
    );
  }

  const solutionError = parsed?.error;
  const canSave = isDirty && !fenError && !solutionError && !!draft.title.trim() && !saving;

  return (
    <PageContainer maxWidth={1440}>
      <Button component={RouterLink} to="/digitizer#library" size="small" color="inherit" startIcon={<ArrowBackRoundedIcon />} sx={{ color: 'text.secondary', mb: 1, ml: -1 }}>
        {t('digitizer.title')}
      </Button>
      <PageHeader dense
        title={book.title}
        subtitle={t('digitizer.editor.subtitle', { count: book.exercises.length, defaultValue: '{{count}} exercises · edit positions, hints and solutions' })}
        actions={(
          <>
            <FormControlLabel
              control={<Switch checked={book.status === 'published'} onChange={(e) => togglePublished(e.target.checked)} color="success" />}
              label={book.status === 'published' ? t('digitizer.status.published') : t('digitizer.status.draft')}
              sx={{ mr: 1 }}
            />
            <Button component={RouterLink} to={`/books/${book._id}/solve?ex=${index}`} variant="outlined" color="inherit" startIcon={<PlayArrowIcon />}>
              {t('digitizer.editor.trySolve')}
            </Button>
          </>
        )}
      />

      <Box sx={{ display: 'grid', gap: 3, alignItems: 'start', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.1fr) minmax(0, 1fr)' } }}>
        {/* Левая колонка: доска, движок, проверка решения */}
        <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, position: { md: 'sticky' }, top: { md: 84 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {previewNode ? t('digitizer.editor.previewMove', { move: previewNode.san }) : t('digitizer.editor.editPosition')}
            </Typography>
            <Tooltip title={t('digitizer.editor.flip')}>
              <IconButton onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))} aria-label={t('digitizer.editor.flip')}>
                <SwapVertIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          {previewNode ? (
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ResizableBoard reserveBottom={180}>
                  <Chessboard
                    id="solution-preview"
                    position={previewNode.fen}
                    boardOrientation={orientation}
                    arePiecesDraggable={false}
                    customArrows={bestArrow}
                    {...boardStyleProps}
                  />
                </ResizableBoard>
              </Box>
              <Button variant="outlined" color="inherit" onClick={() => setPreviewNode(null)}>{t('digitizer.editor.backToStart')}</Button>
            </Stack>
          ) : (
            <PositionEditorBoard fen={draft.fen} onChange={(fen) => update({ fen })} orientation={orientation} arrows={bestArrow} />
          )}
          <Box sx={{ mt: 2 }}>
            <EnginePanel
              enabled={engineOn}
              onToggle={toggleEngine}
              result={engineResult?.fen === shownFen ? engineResult : null}
              analyzing={analyzing}
              engineName={engine?.name}
              error={engine?.error}
            />
          </Box>
          {parsed && !parsed.error && parsed.tree.roots.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={runSolutionCheck}
                disabled={!!solutionCheck?.running}
                startIcon={solutionCheck?.running ? <CircularProgress size={14} /> : <FactCheckOutlinedIcon />}
              >
                {solutionCheck?.running
                  ? t('engine.checkingSolution', { done: solutionCheck.done, total: solutionCheck.total })
                  : t('engine.checkSolution')}
              </Button>
              {solutionCheck && !solutionCheck.running && (
                <Stack spacing={0.5} sx={{ mt: 1 }} data-testid="solution-check">
                  {solutionCheck.results.length === 0 && <Typography variant="body2" color="text.secondary">{t('engine.checkInterrupted')}</Typography>}
                  {solutionCheck.results.map((r) => (
                    <Stack
                      key={r.nodeId}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      onClick={() => setPreviewNode(nodeById.get(r.nodeId) ?? null)}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, px: 0.75, py: 0.25 }}
                    >
                      {r.dubious
                        ? <WarningAmberIcon fontSize="small" sx={{ color: 'warning.main' }} />
                        : <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />}
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {r.dubious
                          ? t('engine.dubiousMove', { played: r.comparison.playedScore, best: r.comparison.bestScore, move: r.comparison.bestMoveSan })
                          : t('engine.goodMove', { played: r.comparison.playedScore })}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Paper>

        {/* Правая колонка: задания книги и поля текущего */}
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <ExerciseList
            title={t('digitizer.exercises')}
            summary={`${index + 1} / ${book.exercises.length}`}
            exercises={book.exercises}
            selectedIndex={index}
            onSelect={selectExercise}
            maxHeight={260}
            renderBadge={(e) => {
              const state = solutionState.get(e._id);
              if (state === 'ok') return <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />;
              if (state === 'error') return <ErrorOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />;
              return <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
            }}
          />

          <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack spacing={2.25}>
              <TextField label={t('digitizer.editor.exerciseTitle')} value={draft.title} onChange={(e) => update({ title: e.target.value })} size="small" />

              <TextField
                label="FEN"
                value={draft.fen}
                onChange={(e) => { update({ fen: e.target.value }); setPreviewNode(null); }}
                size="small"
                error={!!fenError}
                helperText={fenError || ' '}
                sx={{ '& input': { fontFamily: 'monospace', fontSize: 13 } }}
              />
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                <Typography variant="body2" color="text.secondary">{t('digitizer.editor.sideToMove')}</Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={sideToMove(draft.fen)}
                  onChange={(_, color: 'w' | 'b' | null) => color && update({ fen: setSideToMove(draft.fen, color) })}
                >
                  <ToggleButton value="w">{t('digitizer.editor.white')}</ToggleButton>
                  <ToggleButton value="b">{t('digitizer.editor.black')}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <TextField label={t('digitizer.editor.comment')} value={draft.comment} onChange={(e) => update({ comment: e.target.value })} multiline minRows={2} maxRows={6} />
              <TextField
                label={t('digitizer.editor.hint')}
                value={draft.hint}
                onChange={(e) => update({ hint: e.target.value })}
                multiline
                minRows={1}
                maxRows={4}
                helperText={t('digitizer.editor.hintHelp')}
              />
              <TextField
                label={t('digitizer.editor.solution')}
                value={draft.solution}
                onChange={(e) => { update({ solution: e.target.value }); setPreviewNode(null); }}
                multiline
                minRows={3}
                maxRows={10}
                placeholder="14. Bf5! g6 (14... Ne4 15. Nxe4) 15. Bh3"
                helperText={t('digitizer.editor.solutionHelp')}
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
              />
              {solutionError && <Alert severity="error">{solutionError}</Alert>}
              {parsed && parsed.tree.roots.length > 0 && (
                <Box sx={{ bgcolor: 'surface.raised', border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, maxHeight: 260, overflowY: 'auto' }}>
                  <Typography variant="caption" color="text.secondary">{t('digitizer.editor.moveTree')}</Typography>
                  <MoveTreeView tree={parsed.tree} activeId={previewNode?.id} onSelect={setPreviewNode} />
                </Box>
              )}

              <Button
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                disabled={!canSave}
                onClick={handleSave}
              >
                {t('digitizer.editor.save')}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </PageContainer>
  );
};
