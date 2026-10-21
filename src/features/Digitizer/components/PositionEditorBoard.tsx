import React, { useState } from 'react';
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Chessboard } from 'react-chessboard';
import { ResizableBoard } from '@/features/Chess/components/ResizableBoard';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { Square } from 'chess.js';
import { useTranslation } from 'react-i18next';
import { boardStyleProps } from './boardStyle';

// Свободная расстановка: фигуры двигаются без проверки правил, сброс за доску — удаление,
// клик по полю с выбранной фигурой из палитры — установка
type Grid = (string | null)[][]; // [ранг 8..1][файл a..h], символ фигуры в нотации FEN

const FILES = 'abcdefgh';
const PALETTE = ['K', 'Q', 'R', 'B', 'N', 'P', 'k', 'q', 'r', 'b', 'n', 'p'] as const;
const GLYPHS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};
const ERASER = 'x';
const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const parsePlacement = (placement: string): Grid =>
  placement.split('/').slice(0, 8).map((rank) => {
    const row: (string | null)[] = [];
    for (const ch of rank) {
      if (/\d/.test(ch)) row.push(...Array<null>(Number(ch)).fill(null));
      else row.push(ch);
    }
    return row.slice(0, 8).concat(Array<null>(Math.max(0, 8 - row.length)).fill(null));
  });

const serializePlacement = (grid: Grid): string =>
  grid.map((row) => {
    let out = '';
    let empty = 0;
    for (const cell of row) {
      if (cell) {
        out += (empty || '') + cell;
        empty = 0;
      } else empty++;
    }
    return out + (empty || '');
  }).join('/');

const at = (grid: Grid, square: string) => grid[8 - Number(square[1])][FILES.indexOf(square[0])];
const put = (grid: Grid, square: string, piece: string | null) => {
  grid[8 - Number(square[1])][FILES.indexOf(square[0])] = piece;
};

// Права на рокировку остаются, только если король и ладья на исходных полях
const fixCastling = (grid: Grid, castling: string): string => {
  const rules: Record<string, [string, string, string, string]> = {
    K: ['e1', 'K', 'h1', 'R'], Q: ['e1', 'K', 'a1', 'R'], k: ['e8', 'k', 'h8', 'r'], q: ['e8', 'k', 'a8', 'r'],
  };
  const kept = castling.split('').filter((flag) => {
    const rule = rules[flag];
    return rule && at(grid, rule[0]) === rule[1] && at(grid, rule[2]) === rule[3];
  }).join('');
  return kept || '-';
};

const withGrid = (fen: string, edit: (grid: Grid) => void): string => {
  const parts = fen.trim().split(/\s+/);
  const grid = parsePlacement(parts[0] || '8/8/8/8/8/8/8/8');
  edit(grid);
  const [, turn = 'w', castling = '-', , halfmove = '0', fullmove = '1'] = parts;
  // После ручной правки взятие на проходе почти всегда невалидно — сбрасываем
  return [serializePlacement(grid), turn, fixCastling(grid, castling), '-', halfmove, fullmove].join(' ');
};

interface PositionEditorBoardProps {
  fen: string;
  onChange: (fen: string) => void;
  orientation: 'white' | 'black';
  /** Стрелки поверх доски (лучший ход движка) */
  arrows?: Arrow[];
}

export const PositionEditorBoard: React.FC<PositionEditorBoardProps> = ({ fen, onChange, orientation, arrows }) => {
  const { t } = useTranslation();
  const [tool, setTool] = useState<string | null>(null);

  const handleDrop = (source: Square, target: Square): boolean => {
    onChange(withGrid(fen, (grid) => {
      const piece = at(grid, source);
      put(grid, source, null);
      put(grid, target, piece);
    }));
    return true;
  };

  const handleDropOff = (source: Square) => {
    onChange(withGrid(fen, (grid) => put(grid, source, null)));
  };

  const handleSquareClick = (square: Square) => {
    if (!tool) return;
    onChange(withGrid(fen, (grid) => {
      const current = at(grid, square);
      // Повторный клик той же фигурой убирает её
      put(grid, square, tool === ERASER || current === tool ? null : tool);
    }));
  };

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <ResizableBoard reserveBottom={200}>
      <Chessboard
        id="position-editor"
        position={fen.split(' ')[0]}
        boardOrientation={orientation}
        onPieceDrop={handleDrop}
        onPieceDropOffBoard={handleDropOff}
        dropOffBoardAction="trash"
        onSquareClick={handleSquareClick}
        animationDuration={100}
        customArrows={arrows}
        {...boardStyleProps}
      />
      </ResizableBoard>
      </Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={tool}
        onChange={(_, value: string | null) => setTool(value)}
        sx={{ flexWrap: 'wrap', justifyContent: 'center', '& .MuiToggleButton-root': { color: 'text.primary', fontSize: 22, lineHeight: 1, px: 1, minWidth: 40 } }}
      >
        {PALETTE.map((piece) => (
          <ToggleButton key={piece} value={piece} aria-label={piece}>{GLYPHS[piece]}</ToggleButton>
        ))}
        <Tooltip title={t('digitizer.editor.eraser')}>
          <ToggleButton value={ERASER} aria-label="eraser">✕</ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" color="inherit" onClick={() => onChange(EMPTY_FEN)}>{t('digitizer.editor.clearBoard')}</Button>
        <Button size="small" variant="outlined" color="inherit" onClick={() => onChange(START_FEN)}>{t('digitizer.editor.startPosition')}</Button>
      </Box>
    </Stack>
  );
};
