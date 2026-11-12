import React, { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography, Button, Chip, Alert, LinearProgress } from '@mui/material';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import ReplayRounded from '@mui/icons-material/ReplayRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import NavigateNextRounded from '@mui/icons-material/NavigateNextRounded';
import { useTranslation } from 'react-i18next';
import type { Square } from 'chess.js';

import { ChessBoard } from '@/features/Chess/components/ChessBoard';
import { useSolveSession } from '@/features/Digitizer/hooks/useSolveSession';
import type { Exercise } from '@/types/PuzzleBook';
import type { PuzzleBlock } from '@/features/Courses/types/courseBlocks';

// Кольцо вокруг клетки фигуры + мягкая заливка — видно из-под фигуры (точка-по-центру пряталась под ней).
const HINT_STYLE: React.CSSProperties = { boxShadow: 'inset 0 0 0 4px rgba(88,166,255,0.95)', backgroundColor: 'rgba(88,166,255,0.25)' };

/** Один блок задач: ученик решает задачи по очереди; блок «пройден», когда решена последняя. */
export const PuzzleBlockPlayer: React.FC<{ block: PuzzleBlock; onComplete?: () => void }> = ({ block, onComplete }) => {
  const { t } = useTranslation();

  // Фаза A: играем только inline-задачи (ref на базу — фаза B).
  const exercises = useMemo<Exercise[]>(
    () => block.puzzles.filter((p) => p.kind === 'inline') as unknown as Exercise[],
    [block.puzzles],
  );
  // Позиция внутри блока переживает перезагрузку (ученик продолжает, а не начинает с 1/7).
  const storageKey = `cpz:${block.id}`;
  const [idx, setIdx] = useState(() => {
    const v = Number(localStorage.getItem(storageKey));
    return Number.isInteger(v) && v > 0 && v < exercises.length ? v : 0;
  });
  const [wrong, setWrong] = useState(false);
  const current = exercises[idx];

  useEffect(() => { try { localStorage.setItem(storageKey, String(idx)); } catch { /* quota */ } }, [idx, storageKey]);

  const s = useSolveSession(current);

  if (exercises.length === 0) {
    return <Alert severity="info">{t('coursePlayer.puzzle.empty', 'No solvable puzzles in this block yet.')}</Alert>;
  }

  const orientation = s.playerColor === 'b' ? 'black' : 'white';
  const solved = s.status === 'solved' || s.status === 'noSolution';
  const isLast = idx >= exercises.length - 1;

  const handleMove = (from: Square, to: Square, promotion?: string): boolean => {
    const verdict = s.tryMove(from, to, promotion);
    if (verdict === 'wrong') { setWrong(true); setTimeout(() => setWrong(false), 900); }
    return verdict === 'correct';
  };

  const next = () => {
    if (isLast) { try { localStorage.removeItem(storageKey); } catch { /* ignore */ } onComplete?.(); return; }
    setIdx((i) => i + 1);
    setWrong(false);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Chip size="small" color="default" label={t('coursePlayer.puzzle.counter', 'Puzzle {{n}} / {{total}}', { n: idx + 1, total: exercises.length })} />
        <Chip size="small" variant="outlined" label={orientation === 'white' ? t('coursePlayer.puzzle.whiteToMove', 'White to move') : t('coursePlayer.puzzle.blackToMove', 'Black to move')} />
        {s.mistakes > 0 && <Chip size="small" color="error" variant="outlined" label={t('coursePlayer.puzzle.mistakes', 'Mistakes: {{n}}', { n: s.mistakes })} />}
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <Box sx={{ width: { xs: '100%', md: 380 }, maxWidth: 440, flexShrink: 0 }}>
          <ChessBoard
            fen={s.fen}
            onMove={handleMove}
            boardOrientation={orientation}
            movable={orientation}
            coordinates="outside"
            customSquareStyles={s.hintSquare ? { [s.hintSquare]: HINT_STYLE } : undefined}
          />
        </Box>

        <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          {current?.title && <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{current.title}</Typography>}

          {s.status === 'noSolution' && (
            <Alert severity="warning">{t('coursePlayer.puzzle.noSolution', 'This puzzle has no recorded solution — skip ahead.')}</Alert>
          )}
          {wrong && <Alert severity="error" sx={{ py: 0.25 }}>{t('coursePlayer.puzzle.wrong', 'Not the move — try again.')}</Alert>}
          {s.status === 'opponent' && <Typography variant="body2" color="text.secondary">{t('coursePlayer.puzzle.opponent', 'Opponent replies…')}</Typography>}

          {solved ? (
            <Alert icon={<CheckCircleRounded fontSize="inherit" />} severity="success">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{t('coursePlayer.puzzle.solved', 'Solved!')}</Typography>
              {current?.comment && <Typography variant="body2" sx={{ mt: 0.5 }}>{current.comment}</Typography>}
            </Alert>
          ) : (
            current?.comment ? (
              <Typography variant="body2" color="text.secondary">{current.comment}</Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">{t('coursePlayer.puzzle.prompt', 'Find the best move.')}</Typography>
            )
          )}

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {!solved && (
              <Button size="small" variant="outlined" startIcon={<LightbulbOutlined />} onClick={s.showHint} disabled={s.status !== 'playing'}>
                {t('coursePlayer.puzzle.hint', 'Hint')}
              </Button>
            )}
            <Button size="small" variant="text" startIcon={<ReplayRounded />} onClick={s.reset}>
              {t('coursePlayer.puzzle.retry', 'Restart')}
            </Button>
            {solved && (
              <Button size="small" variant="contained" endIcon={<NavigateNextRounded />} onClick={next}>
                {isLast ? t('coursePlayer.puzzle.finishBlock', 'Finish') : t('coursePlayer.puzzle.next', 'Next puzzle')}
              </Button>
            )}
          </Stack>

          {current?.hint && !solved && s.usedHint && (
            <Typography variant="caption" color="text.secondary">{t('coursePlayer.puzzle.hintText', 'Hint')}: {current.hint}</Typography>
          )}
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={(idx + (solved ? 1 : 0)) / exercises.length * 100}
        aria-label={t('coursePlayer.puzzle.progress', 'Puzzle block progress')}
        sx={{ borderRadius: 1 }}
      />
    </Stack>
  );
};

export default PuzzleBlockPlayer;
