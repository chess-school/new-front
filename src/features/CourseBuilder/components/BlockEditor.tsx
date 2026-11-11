import React, { useMemo } from 'react';
import {
  Box, Stack, Paper, TextField, Typography, IconButton, Button, ToggleButton,
  ToggleButtonGroup, Tooltip, Divider,
} from '@mui/material';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useTranslation } from 'react-i18next';

import type { CourseBlock, PuzzleBlock, GameBlock, TextBlock, CoursePuzzle } from '@/features/Courses/types/courseBlocks';
import { newInlinePuzzle } from '../lib/courseDraft';
import { PuzzleSourceDialogs } from './PuzzleSourceDialogs';

const LIGHT = '#E9EDF2';
const DARK = '#6E7F95';

/** Мини-превью позиции; пустой/битый FEN → заглушка. */
const BoardPreview: React.FC<{ fen: string; orientation?: 'white' | 'black'; size?: number }> = ({ fen, orientation = 'white', size = 200 }) => {
  const ok = useMemo(() => {
    try { new Chess(fen); return true; } catch { return false; }
  }, [fen]);
  if (!ok) return (
    <Box sx={{ width: size, height: size, display: 'grid', placeItems: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary">—</Typography>
    </Box>
  );
  return (
    <Box sx={{ width: size }}>
      <Chessboard
        position={fen}
        boardWidth={size}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        showBoardNotation
        customDarkSquareStyle={{ backgroundColor: DARK }}
        customLightSquareStyle={{ backgroundColor: LIGHT }}
        customBoardStyle={{ borderRadius: 6 }}
      />
    </Box>
  );
};

/** Переключить сторону хода в FEN (поле №2) — удобство при вводе задачи. */
const setSideToMove = (fen: string, color: 'w' | 'b'): string => {
  const parts = fen.split(' ');
  if (parts.length < 2) return fen;
  parts[1] = color;
  return parts.join(' ');
};
const sideToMove = (fen: string): 'w' | 'b' => (fen.split(' ')[1] === 'b' ? 'b' : 'w');

// --------------------------------------------------------------- text

const TextBlockEditor: React.FC<{ block: TextBlock; onChange: (b: TextBlock) => void }> = ({ block, onChange }) => {
  const { t } = useTranslation();
  return (
    <TextField
      label={t('courses.block.text.body', 'Text (Markdown)')}
      value={block.body}
      onChange={(e) => onChange({ ...block, body: e.target.value })}
      multiline
      minRows={4}
      fullWidth
      size="small"
      placeholder={t('courses.block.text.placeholder', 'Theory, instructions, context…')}
    />
  );
};

// --------------------------------------------------------------- puzzle

const PuzzleRow: React.FC<{
  puzzle: CoursePuzzle;
  index: number;
  onChange: (p: CoursePuzzle) => void;
  onRemove: () => void;
}> = ({ puzzle, index, onChange, onRemove }) => {
  const { t } = useTranslation();
  if (puzzle.kind !== 'inline') {
    return (
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {t('courses.block.puzzle.ref', 'Reference to base puzzle')}: {puzzle.puzzleId}
        </Typography>
      </Paper>
    );
  }
  const p = puzzle;
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
        <BoardPreview fen={p.fen} orientation={sideToMove(p.fen) === 'b' ? 'black' : 'white'} size={168} />
        <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">#{index + 1}</Typography>
            <TextField
              label={t('courses.block.puzzle.puzzleTitle', 'Puzzle title')}
              value={p.title}
              onChange={(e) => onChange({ ...p, title: e.target.value })}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Tooltip title={t('common.delete', 'Delete')}>
              <IconButton size="small" onClick={onRemove}><DeleteOutlineRounded fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
          <TextField
            label="FEN"
            value={p.fen}
            onChange={(e) => onChange({ ...p, fen: e.target.value })}
            size="small"
            fullWidth
            sx={{ '& input': { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              exclusive
              size="small"
              value={sideToMove(p.fen)}
              onChange={(_, c: 'w' | 'b' | null) => c && onChange({ ...p, fen: setSideToMove(p.fen, c) })}
            >
              <ToggleButton value="w">{t('courses.block.puzzle.white', 'White')}</ToggleButton>
              <ToggleButton value="b">{t('courses.block.puzzle.black', 'Black')}</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">{t('courses.block.puzzle.toMove', 'to move')}</Typography>
          </Stack>
          <TextField
            label={t('courses.block.puzzle.solution', 'Solution (PGN from FEN)')}
            value={p.solution}
            onChange={(e) => onChange({ ...p, solution: e.target.value })}
            size="small"
            fullWidth
            placeholder="14. Bf5! g6 15. Bh3"
            sx={{ '& input, & textarea': { fontFamily: 'monospace', fontSize: 13 } }}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              label={t('courses.block.puzzle.comment', 'Comment')}
              value={p.comment}
              onChange={(e) => onChange({ ...p, comment: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              label={t('courses.block.puzzle.hint', 'Hint')}
              value={p.hint}
              onChange={(e) => onChange({ ...p, hint: e.target.value })}
              size="small"
              fullWidth
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

const PuzzleBlockEditor: React.FC<{ block: PuzzleBlock; onChange: (b: PuzzleBlock) => void }> = ({ block, onChange }) => {
  const { t } = useTranslation();
  const setPuzzle = (i: number, p: CoursePuzzle) =>
    onChange({ ...block, puzzles: block.puzzles.map((x, idx) => (idx === i ? p : x)) });
  const removePuzzle = (i: number) =>
    onChange({ ...block, puzzles: block.puzzles.filter((_, idx) => idx !== i) });
  const addPuzzle = () => onChange({ ...block, puzzles: [...block.puzzles, newInlinePuzzle()] });

  return (
    <Stack spacing={1.5}>
      {block.puzzles.map((p, i) => (
        <PuzzleRow
          key={p.kind === 'inline' ? p._id : `ref-${i}`}
          puzzle={p}
          index={i}
          onChange={(np) => setPuzzle(i, np)}
          onRemove={() => removePuzzle(i)}
        />
      ))}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button size="small" startIcon={<AddRounded />} onClick={addPuzzle} variant="outlined">
          {t('courses.block.puzzle.add', 'Add puzzle')}
        </Button>
        <PuzzleSourceDialogs onAdd={(added) => onChange({ ...block, puzzles: [...block.puzzles, ...added] })} />
      </Stack>
    </Stack>
  );
};

// --------------------------------------------------------------- game

const GameBlockEditor: React.FC<{ block: GameBlock; onChange: (b: GameBlock) => void }> = ({ block, onChange }) => {
  const { t } = useTranslation();
  const { fen, error } = useMemo(() => {
    if (!block.pgn.trim()) return { fen: '', error: '' };
    try {
      const g = new Chess();
      g.loadPgn(block.pgn);
      return { fen: g.fen(), error: '' };
    } catch {
      return { fen: '', error: t('courses.block.game.badPgn', 'PGN not recognised') };
    }
  }, [block.pgn, t]);

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
      <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
        <TextField
          label={t('courses.block.game.pgn', 'Game PGN')}
          value={block.pgn}
          onChange={(e) => onChange({ ...block, pgn: e.target.value })}
          multiline
          minRows={6}
          fullWidth
          size="small"
          error={!!error}
          helperText={error || t('courses.block.game.pgnHint', 'Paste a full game — the student analyses it on the board.')}
          sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13 } }}
        />
        <Stack direction="row" spacing={2} alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">{t('courses.block.game.orientation', 'Orientation')}</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={block.orientation ?? 'white'}
              onChange={(_, v: 'white' | 'black' | null) => v && onChange({ ...block, orientation: v })}
            >
              <ToggleButton value="white">{t('courses.block.puzzle.white', 'White')}</ToggleButton>
              <ToggleButton value="black">{t('courses.block.puzzle.black', 'Black')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Divider flexItem orientation="vertical" />
          <Typography variant="caption" color="text.secondary">
            {t('courses.block.game.studyFree', 'Study mode: free analysis')}
          </Typography>
        </Stack>
      </Stack>
      {fen && <BoardPreview fen={fen} orientation={block.orientation ?? 'white'} size={220} />}
    </Stack>
  );
};

// --------------------------------------------------------------- dispatch

export const BlockEditor: React.FC<{ block: CourseBlock; onChange: (b: CourseBlock) => void }> = ({ block, onChange }) => {
  if (block.type === 'text') return <TextBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'puzzle') return <PuzzleBlockEditor block={block} onChange={onChange} />;
  if (block.type === 'game') return <GameBlockEditor block={block} onChange={onChange} />;
  return null;
};

export default BlockEditor;
