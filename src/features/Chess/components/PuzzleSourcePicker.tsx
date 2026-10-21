import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import AllInclusiveRoundedIcon from '@mui/icons-material/AllInclusiveRounded';
import { useTranslation } from 'react-i18next';
import { PUZZLE_SOURCES, PuzzleSourceFilter } from '@/types/Puzzles';

interface PuzzleSourcePickerProps {
  value: PuzzleSourceFilter;
  onChange: (value: PuzzleSourceFilter) => void;
  disabled?: boolean;
  /** Растянуть на всю ширину (в боковой панели, на телефоне) */
  fullWidth?: boolean;
}

const ICONS: Record<PuzzleSourceFilter, React.ReactElement> = {
  lichess: <PublicRoundedIcon fontSize="small" />,
  book: <MenuBookRoundedIcon fontSize="small" />,
  all: <AllInclusiveRoundedIcon fontSize="small" />,
};

/** Источник задач для любого режима: Lichess / из оцифрованных книг / все */
export const PuzzleSourcePicker: React.FC<PuzzleSourcePickerProps> = ({ value, onChange, disabled, fullWidth }) => {
  const { t } = useTranslation();
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      disabled={disabled}
      fullWidth={fullWidth}
      onChange={(_, next: PuzzleSourceFilter | null) => { if (next) onChange(next); }}
      sx={{
        bgcolor: 'surface.raised',
        p: 0.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        '& .MuiToggleButton-root': { border: 0, borderRadius: '8px !important', px: 1.75, gap: 0.75, fontWeight: 600 },
      }}
    >
      {PUZZLE_SOURCES.map((s) => (
        <ToggleButton key={s} value={s}>{ICONS[s]}{t(`puzzles.source.${s}`)}</ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
