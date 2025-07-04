import React from 'react';
import { Paper, Stack, Typography, Divider, Box, Switch, FormControlLabel } from '@mui/material';

interface AnalysisPanelProps {
  evaluation: string | null;
  depth: number;
  principalVariation: string; // Теперь это будет отформатированная строка SAN
  isAnalyzing: boolean;
  isEngineOn: boolean;
  onToggleEngine: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  evaluation,
  depth,
  principalVariation,
  isAnalyzing,
  isEngineOn,
  onToggleEngine,
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#FFD700' }}>
          {evaluation ?? <Typography component="span" color="text.secondary">...</Typography>}
        </Typography>
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
      <Box sx={{ minHeight: '4em', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <Typography variant="body1">
          {principalVariation || (isAnalyzing ? 'Analyzing...' : <Typography component="span" color="text.secondary">-</Typography>)}
        </Typography>
      </Box>
    </Paper>
  );
};