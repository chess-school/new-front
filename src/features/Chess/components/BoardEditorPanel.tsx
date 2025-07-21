import React, { useState, useEffect } from 'react';
import { Paper, Stack, Typography, Divider, Button, TextField, Box } from '@mui/material';
import { Piece } from 'chess.js';
import { useTranslation } from 'react-i18next';
import { notification } from 'antd';

// Типы для пропсов
interface BoardEditorPanelProps {
  fen: string;
  actions: {
    resetGame: () => void;
    clearBoard: () => void;
    setFen: (fen: string) => boolean;
  };
  onApply: (fen: string) => void;
  onCancel: () => void;
  onPieceSelect: (piece: Piece | null) => void;
}

// Маленький внутренний компонент для палитры фигур
const PiecePalette: React.FC<{ color: 'w' | 'b', onSelect: (piece: Piece) => void }> = ({ color, onSelect }) => {
  const pieces = ['k', 'q', 'r', 'b', 'n', 'p'] as const;
  return (
    <Paper sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.1)', display: 'inline-flex', gap: 1 }}>
      {pieces.map(p => {
        const pieceObject: Piece = { type: p, color };
        const pieceSymbol = color === 'w' ? p.toUpperCase() : p;
        const imgUrl = `/pieces/${color}${pieceSymbol}.svg`; // Убедитесь, что у вас есть изображения фигур в public/pieces

        return (
          <Box
            key={p}
            onClick={() => onSelect(pieceObject)}
            sx={{
              width: 40,
              height: 40,
              backgroundImage: `url(${imgUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              cursor: 'pointer',
              borderRadius: '4px',
              '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.3)' },
            }}
          />
        );
      })}
    </Paper>
  );
};


export const BoardEditorPanel: React.FC<BoardEditorPanelProps> = ({ fen, actions, onApply, onCancel, onPieceSelect }) => {
  const { t } = useTranslation();
  const [currentFen, setCurrentFen] = useState(fen);

  // Синхронизируем состояние FEN в поле ввода с реальным состоянием доски
  useEffect(() => {
    setCurrentFen(fen);
  }, [fen]);

  const handleFenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFen(event.target.value);
  };

  const applyFenFromInput = () => {
    if (!actions.setFen(currentFen)) {
      notification.error({
          message: t('chessGame.invalidFen'),
          description: undefined
      });
    }
  };

  return (
    <Stack spacing={2} sx={{ height: '100%' }}>
      <Typography variant="h6">Position Editor</Typography>
      
      {/* Палитры фигур */}
      <Stack spacing={1} alignItems="center">
        <PiecePalette color="w" onSelect={onPieceSelect} />
        <Typography color="text.secondary">Click a piece to select it as a brush, then click on the board.</Typography>
        <PiecePalette color="b" onSelect={onPieceSelect} />
      </Stack>

      <Divider sx={{ my: 1 }} />
      
      {/* Быстрые действия */}
      <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={actions.clearBoard} fullWidth>{t('chessGame.clearBoard', 'Clear Board')}</Button>
          <Button variant="outlined" onClick={actions.resetGame} fullWidth>{t('chessGame.initialPosition', 'Initial Position')}</Button>
      </Stack>
      
      {/* FEN-строка */}
      <TextField
          label="FEN String"
          fullWidth
          multiline
          maxRows={2}
          variant="filled"
          value={currentFen}
          onChange={handleFenChange}
          onBlur={applyFenFromInput}
          sx={{ '& .MuiFilledInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
      />
      
      {/* Основные кнопки */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 'auto' }}>
          <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          <Button variant="contained" onClick={() => onApply(fen)} sx={{ bgcolor: '#FFD700', color: 'black' }}>
            Apply & Close
          </Button>
      </Stack>
    </Stack>
  );
};