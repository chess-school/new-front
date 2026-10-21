import React from 'react';
import { Stack, IconButton, Button, CircularProgress } from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import InsightsIcon from '@mui/icons-material/Insights';
import { useTranslation } from 'react-i18next';

interface ControlPanelProps {
  isAnalyzing: boolean;
  currentMoveIndex: number;
  historyLength: number;
  onAnalyze: () => void;
  onGoToMove: (index: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isAnalyzing,
  currentMoveIndex,
  historyLength,
  onAnalyze,
  onGoToMove,
}) => {
  const { t } = useTranslation();
  return (
    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
      <IconButton aria-label="start" onClick={() => onGoToMove(0)} disabled={currentMoveIndex === 0}><SkipPreviousIcon /></IconButton>
      <IconButton aria-label="back" onClick={() => onGoToMove(currentMoveIndex - 1)} disabled={currentMoveIndex === 0}><ArrowLeftIcon /></IconButton>
      <Button
        variant="contained"
        onClick={onAnalyze}
        disabled={isAnalyzing}
        startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <InsightsIcon />}
      >
        {t('chessGame.analysis.button')}
      </Button>
      <IconButton aria-label="forward" onClick={() => onGoToMove(currentMoveIndex + 1)} disabled={currentMoveIndex === historyLength}><ArrowRightIcon /></IconButton>
      <IconButton aria-label="end" onClick={() => onGoToMove(historyLength)} disabled={currentMoveIndex === historyLength}><SkipNextIcon /></IconButton>
    </Stack>
  );
};