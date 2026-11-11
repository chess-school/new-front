import React, { useMemo, useState, useEffect } from 'react';
import { Box, Stack, Typography, IconButton, Alert, Paper } from '@mui/material';
import FirstPageRounded from '@mui/icons-material/FirstPageRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import LastPageRounded from '@mui/icons-material/LastPageRounded';
import { useTranslation } from 'react-i18next';
import { Chess } from 'chess.js';

import { ChessBoard } from '@/features/Chess/components/ChessBoard';
import type { GameBlock } from '@/features/Courses/types/courseBlocks';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const noMove = (): boolean => false; // доска-обзор: ходы не принимаются

/** Разбор PGN в линейную последовательность позиций (главная линия). */
const parseGame = (pgn: string) => {
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    const headers = (g.header() ?? {}) as Record<string, string>;
    const start = headers.FEN || START_FEN;
    const verbose = g.history({ verbose: true }) as Array<{ san: string; from: string; to: string }>;
    const replay = new Chess(start);
    const positions = [start];
    const moves: { san: string; from: string; to: string }[] = [];
    for (const m of verbose) {
      replay.move(m.san);
      positions.push(replay.fen());
      moves.push({ san: m.san, from: m.from, to: m.to });
    }
    return { positions, moves, error: '' as string };
  } catch {
    return { positions: [START_FEN], moves: [] as { san: string; from: string; to: string }[], error: 'bad' };
  }
};

export const GameBlockPlayer: React.FC<{ block: GameBlock; onComplete?: () => void }> = ({ block, onComplete }) => {
  const { t } = useTranslation();
  const { positions, moves, error } = useMemo(() => parseGame(block.pgn), [block.pgn]);
  const [ply, setPly] = useState(0);

  // Досмотрел до конца — блок считается пройденным.
  useEffect(() => {
    if (moves.length > 0 && ply === moves.length) onComplete?.();
    // onComplete стабильна у родителя; завязываемся только на ply/длину
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, moves.length]);

  if (error || moves.length === 0) {
    return <Alert severity="warning">{t('coursePlayer.game.badPgn', 'This game could not be read.')}</Alert>;
  }

  const orientation = block.orientation ?? 'white';
  const fen = positions[ply];
  const lastMove = ply > 0 ? { from: moves[ply - 1].from, to: moves[ply - 1].to } : null;
  const clamp = (p: number) => Math.max(0, Math.min(moves.length, p));

  const meta = block.meta;
  const title = meta && (meta.white || meta.black)
    ? `${meta.white || '?'} — ${meta.black || '?'}${meta.event ? `, ${meta.event}` : ''}${meta.year ? ` (${meta.year})` : ''}`
    : '';

  return (
    <Stack spacing={2}>
      {title && <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        <Box sx={{ width: { xs: '100%', md: 380 }, maxWidth: 440, flexShrink: 0 }}>
          <ChessBoard fen={fen} onMove={noMove} boardOrientation={orientation} movable="both" lastMove={lastMove} coordinates="outside" />
          <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 1 }}>
            <IconButton size="small" onClick={() => setPly(0)} disabled={ply === 0} aria-label={t('coursePlayer.game.first', 'First move')}><FirstPageRounded /></IconButton>
            <IconButton size="small" onClick={() => setPly((p) => clamp(p - 1))} disabled={ply === 0} aria-label={t('coursePlayer.game.prev', 'Previous move')}><ChevronLeftRounded /></IconButton>
            <IconButton size="small" onClick={() => setPly((p) => clamp(p + 1))} disabled={ply === moves.length} aria-label={t('coursePlayer.game.next', 'Next move')}><ChevronRightRounded /></IconButton>
            <IconButton size="small" onClick={() => setPly(moves.length)} disabled={ply === moves.length} aria-label={t('coursePlayer.game.last', 'Last move')}><LastPageRounded /></IconButton>
          </Stack>
        </Box>

        <Paper variant="outlined" sx={{ flexGrow: 1, minWidth: 0, width: '100%', p: 1.5, maxHeight: 420, overflowY: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', columnGap: 1, rowGap: 0.25, alignItems: 'baseline' }}>
            {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, row) => {
              const wIdx = row * 2;
              const bIdx = wIdx + 1;
              const cell = (i: number) => {
                if (i >= moves.length) return <Box key={i} />;
                const active = ply === i + 1;
                return (
                  <Box
                    key={i}
                    component="button"
                    onClick={() => setPly(i + 1)}
                    sx={{
                      border: 0, bgcolor: active ? 'action.selected' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', px: 0.75, py: 0.25, borderRadius: 0.75,
                      fontFamily: 'monospace', fontSize: 14, fontWeight: active ? 700 : 400, color: 'text.primary',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {moves[i].san}
                  </Box>
                );
              };
              return (
                <React.Fragment key={row}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{row + 1}.</Typography>
                  {cell(wIdx)}
                  {cell(bIdx)}
                </React.Fragment>
              );
            })}
          </Box>
        </Paper>
      </Stack>
    </Stack>
  );
};

export default GameBlockPlayer;
