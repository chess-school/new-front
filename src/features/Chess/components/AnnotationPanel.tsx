import React from 'react';
import { Box, IconButton, Stack, TextField, ToggleButton, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import VerticalAlignTopRoundedIcon from '@mui/icons-material/VerticalAlignTopRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import SubdirectoryArrowLeftRoundedIcon from '@mui/icons-material/SubdirectoryArrowLeftRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { exitVariation, isMainline, MOVE_GLYPHS } from '../tree/gameTree';
import { GameTreeApi } from '../tree/useGameTree';
import { GLYPH_COLORS } from '../tree/glyphColors';

const GLYPH_FALLBACK: Record<string, string> = {
  good: 'Good move', brilliant: 'Brilliant move', interesting: 'Interesting move',
  dubious: 'Dubious move', mistake: 'Mistake', blunder: 'Blunder',
};

interface AnnotationPanelProps {
  game: GameTreeApi;
  /** Показывать поле комментария (в компактных разборах можно скрыть) */
  withComment?: boolean;
}

/**
 * Аннотация текущего хода: глифы (! !! !? ?! ? ??), комментарий и правка дерева —
 * «Сделать главным вариантом», «Поднять вариант», «Удалить ветку», «Подняться на уровень вверх».
 */
export const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ game, withComment = true }) => {
  const { t } = useTranslation();
  const { tree, current, actions } = game;
  const atRoot = current.id === tree.rootId;
  const onMainline = isMainline(tree, current.id);
  const canExit = exitVariation(tree, current.id) !== null;
  const label = atRoot ? '' : `${current.moveNumber}${current.color === 'w' ? '.' : '...'} ${current.san}`;

  const treeAction = (key: string, fallback: string, icon: React.ReactElement, onClick: () => void, disabled: boolean) => (
    <Tooltip title={t(`analysisTree.${key}`, fallback)}>
      <span>
        <IconButton size="small" aria-label={t(`analysisTree.${key}`, fallback)} onClick={onClick} disabled={disabled} data-action={key}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Stack spacing={1} data-testid="annotation-panel">
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Stack direction="row" spacing={0.5} role="group" aria-label={t('analysisTree.glyphs', 'Move annotation')}>
          {MOVE_GLYPHS.map((g) => {
            const on = current.nags.includes(g.nag);
            return (
              <Tooltip key={g.nag} title={t(`analysisTree.glyph.${g.key}`, GLYPH_FALLBACK[g.key])}>
                <span>
                  <ToggleButton
                    value={g.nag}
                    selected={on}
                    disabled={atRoot}
                    size="small"
                    aria-label={`${g.symbol} ${t(`analysisTree.glyph.${g.key}`, GLYPH_FALLBACK[g.key])}`}
                    onChange={() => actions.nag(g.nag)}
                    sx={{
                      minWidth: 34, px: 0.75, py: 0.25, fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.4,
                      color: GLYPH_COLORS[g.symbol],
                      '&.Mui-selected': { color: '#0d1117', bgcolor: GLYPH_COLORS[g.symbol], '&:hover': { bgcolor: GLYPH_COLORS[g.symbol] } },
                    }}
                  >
                    {g.symbol}
                  </ToggleButton>
                </span>
              </Tooltip>
            );
          })}
        </Stack>
        <Stack direction="row" spacing={0.25}>
          {treeAction('makeMainline', 'Make main line', <VerticalAlignTopRoundedIcon fontSize="small" />, actions.mainline, onMainline)}
          {treeAction('promote', 'Promote variation', <ArrowUpwardRoundedIcon fontSize="small" />, actions.promote, onMainline)}
          {treeAction('exitVariation', 'Up one level (exit variation)', <SubdirectoryArrowLeftRoundedIcon fontSize="small" />, actions.up, !canExit)}
          {treeAction('deleteBranch', 'Delete branch from here', <DeleteOutlineRoundedIcon fontSize="small" />, actions.remove, atRoot)}
        </Stack>
      </Stack>
      {withComment && (
        <Box>
          <TextField
            key={`comment-${current.id}`}
            size="small" multiline maxRows={4} fullWidth
            defaultValue={current.comment ?? ''}
            onBlur={(e) => { if ((e.target.value || '') !== (current.comment ?? '')) actions.comment(e.target.value, current.id); }}
            placeholder={atRoot
              ? t('chessGame.commentStart', 'Comment on the starting position…')
              : t('chessGame.commentMove', { move: label, defaultValue: 'Comment on {{move}}…' })}
            inputProps={{ 'aria-label': t('chessGame.commentLabel', 'Move comment') }}
          />
        </Box>
      )}
    </Stack>
  );
};
