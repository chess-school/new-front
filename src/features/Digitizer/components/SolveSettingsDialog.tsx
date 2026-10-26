import React, { useEffect, useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, IconButton, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { DEFAULT_SOLVE_SETTINGS, SolveSettings } from '@/types/PuzzleBook';

interface Props {
  open: boolean;
  value?: SolveSettings;
  saving?: boolean;
  onClose: () => void;
  onSave: (next: SolveSettings) => void;
}

// Подпись настройки + «?»-кнопка с пояснением — чтобы тренеру было максимально ясно, на что влияет
const Label: React.FC<{ text: string; help: string }> = ({ text, help }) => (
  <Stack direction="row" alignItems="center" spacing={0.5}>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{text}</Typography>
    <Tooltip title={help} enterTouchDelay={0} arrow>
      <IconButton size="small" sx={{ color: 'text.secondary', p: 0.25 }} aria-label={help}>
        <HelpOutlineIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  </Stack>
);

/**
 * Диалог «Настройки решения» (шестерёнка в редакторе задачника).
 * Тренер меняет правила; если ничего не трогает — действуют дефолты (строгий режим).
 */
export const SolveSettingsDialog: React.FC<Props> = ({ open, value, saving = false, onClose, onSave }) => {
  const { t } = useTranslation();
  const [s, setS] = useState<SolveSettings>({ ...DEFAULT_SOLVE_SETTINGS, ...value });

  // При каждом открытии подтягиваем актуальные значения книги
  useEffect(() => {
    if (open) setS({ ...DEFAULT_SOLVE_SETTINGS, ...value });
  }, [open, value]);

  const num = (raw: string, lo: number, hi: number) => {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n)) return lo;
    return Math.min(hi, Math.max(lo, n));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('digitizer.solveSettings.title', { defaultValue: 'Solving rules' })}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="caption" color="text.secondary">
            {t('digitizer.solveSettings.intro', { defaultValue: 'These rules apply to every student solving this set. Leave them as is to use the strict defaults.' })}
          </Typography>

          {/* Подсказки */}
          <FormControlLabel
            sx={{ ml: 0, justifyContent: 'space-between', width: '100%' }}
            labelPlacement="start"
            control={<Switch checked={s.hintsEnabled} onChange={(e) => setS((p) => ({ ...p, hintsEnabled: e.target.checked }))} />}
            label={<Label text={t('digitizer.solveSettings.hintsEnabled', { defaultValue: 'Allow hints' })} help={t('digitizer.solveSettings.hintsEnabledHelp', { defaultValue: 'If off, students never get a hint button — they must find the move themselves.' })} />}
          />

          <Box sx={{ opacity: s.hintsEnabled ? 1 : 0.5, pointerEvents: s.hintsEnabled ? 'auto' : 'none' }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Label text={t('digitizer.solveSettings.unlockMinutes', { defaultValue: 'Unlock hint after, min' })} help={t('digitizer.solveSettings.unlockMinutesHelp', { defaultValue: 'A hint becomes available once the student has spent this many minutes on the puzzle. 0 = available immediately.' })} />
                <TextField
                  type="number" size="small" value={s.hintUnlockMinutes}
                  onChange={(e) => setS((p) => ({ ...p, hintUnlockMinutes: num(e.target.value, 0, 180) }))}
                  inputProps={{ min: 0, max: 180, style: { width: 64, textAlign: 'center' } }}
                />
              </Stack>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Label text={t('digitizer.solveSettings.unlockMistakes', { defaultValue: 'or after N mistakes' })} help={t('digitizer.solveSettings.unlockMistakesHelp', { defaultValue: 'A hint also unlocks once the student makes this many wrong moves on the puzzle (whichever comes first).' })} />
                <TextField
                  type="number" size="small" value={s.hintUnlockMistakes}
                  onChange={(e) => setS((p) => ({ ...p, hintUnlockMistakes: num(e.target.value, 0, 50) }))}
                  inputProps={{ min: 0, max: 50, style: { width: 64, textAlign: 'center' } }}
                />
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Показать решение */}
          <FormControlLabel
            sx={{ ml: 0, justifyContent: 'space-between', width: '100%' }}
            labelPlacement="start"
            control={<Switch checked={s.allowShowSolution} onChange={(e) => setS((p) => ({ ...p, allowShowSolution: e.target.checked }))} />}
            label={<Label text={t('digitizer.solveSettings.allowShowSolution', { defaultValue: 'Allow "give up & show solution"' })} help={t('digitizer.solveSettings.allowShowSolutionHelp', { defaultValue: 'If off, there is no way to reveal the answer — the student must solve it. If on, a discreet “give up” button appears.' })} />}
          />

          {/* Имена игроков */}
          <FormControlLabel
            sx={{ ml: 0, justifyContent: 'space-between', width: '100%' }}
            labelPlacement="start"
            control={<Switch checked={s.showPlayerNames} onChange={(e) => setS((p) => ({ ...p, showPlayerNames: e.target.checked }))} />}
            label={<Label text={t('digitizer.solveSettings.showPlayerNames', { defaultValue: 'Show player names' })} help={t('digitizer.solveSettings.showPlayerNamesHelp', { defaultValue: 'Name plates above/below the board. Turn off if the names could hint at the answer (famous games).' })} />}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
        <Button onClick={() => onSave(s)} variant="contained" disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}>
          {t('common.save', { defaultValue: 'Save' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
