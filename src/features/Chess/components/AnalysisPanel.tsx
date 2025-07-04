// src/features/Chess/components/AnalysisPanel.tsx

import React from 'react';
import { Paper, Stack, Typography, Divider, Box, Switch, FormControlLabel } from '@mui/material';
import { VariationLine } from './variationLine'; // <-- Импортируем новый компонент
import { Square } from 'chess.js';

interface AnalysisPanelProps {
  evaluation: string | null;
  depth: number;
  principalVariation: string; // Это будет raw UCI-строка
  isAnalyzing: boolean;
  isEngineOn: boolean;
  onToggleEngine: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // --- Новые props для интерактивности ---
  startFenForPV: string;
  onVariationMoveHover: (from: Square, to: Square) => void;
  onVariationMoveLeave: () => void;
  onVariationMoveClick: (fen: string) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  evaluation,
  depth,
  principalVariation,
  isAnalyzing,
  isEngineOn,
  onToggleEngine,
  // --- Новые props ---
  startFenForPV,
  onVariationMoveHover,
  onVariationMoveLeave,
  onVariationMoveClick,
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" spacing={1}>
            <Stack alignItems="flex-end">
                <Typography variant="body2" color="text.secondary">Depth: {depth}</Typography>
                <Typography variant="body2" color="text.secondary">SF 16</Typography>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={isEngineOn}
                  onChange={onToggleEngine}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#FFD700',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#FFD700',
                    },
                  }}
                />
              }
              label=""
              sx={{ mr: 0 }}
            />
        </Stack>
      </Stack>
      <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
      <Box sx={{ minHeight: '4em' }}>
        {isEngineOn ? (
            <VariationLine
                uciLine={principalVariation}
                startFen={startFenForPV}
                onMoveHover={onVariationMoveHover}
                onMoveLeave={onVariationMoveLeave}
                onMoveClick={onVariationMoveClick}
            />
        ) : (
            <Typography component="span" color="text.secondary">-</Typography>
        )}
        {isAnalyzing && !principalVariation && (
            <Typography>Analyzing...</Typography>
        )}
      </Box>
    </Paper>
  );
};