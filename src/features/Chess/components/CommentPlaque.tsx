import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import { useTranslation } from 'react-i18next';
import { TreeNode } from '../tree/gameTree';
import { tokens } from '@/theme/tokens';

interface CommentPlaqueProps {
  /** Текущий узел дерева (его комментарий и показываем) */
  node: TreeNode;
}

/**
 * Плашка с комментарием к выбранному ходу — под доской / вверху панели разбора.
 * Ничего не рендерит, если у текущего хода нет комментария.
 */
export const CommentPlaque: React.FC<CommentPlaqueProps> = ({ node }) => {
  const { t } = useTranslation();
  if (!node.comment) return null;
  const label = node.san
    ? `${node.moveNumber}${node.color === 'w' ? '.' : '...'} ${node.san}`
    : t('analysisBoard.annotation.startPosition', 'Starting position');

  return (
    <Paper
      elevation={0}
      data-testid="comment-plaque"
      sx={{
        px: 1.5, py: 1, borderLeft: `3px solid ${tokens.accent.gold}`, borderRadius: '0 8px 8px 0',
        bgcolor: 'surface.raised',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <ChatBubbleOutlineRoundedIcon sx={{ fontSize: '1rem', color: tokens.accent.gold, mt: '2px' }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block' }}>
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.45 }}
          >
            {node.comment}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};
