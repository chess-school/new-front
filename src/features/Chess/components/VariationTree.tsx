import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GameTree, moveGlyph, TreeNode } from '../tree/gameTree';
import { nagToSymbol } from '@/features/Digitizer/utils/pgnTree';
import { GLYPH_COLORS } from '../tree/glyphColors';
import { tokens } from '@/theme/tokens';

interface VariationTreeProps {
  tree: GameTree;
  currentId: string;
  onSelect: (id: string) => void;
  /** data-testid контейнера (для совместимости со старым списком ходов) */
  testId?: string;
}

/**
 * Нотация с вариантами в стиле Lichess: главная линия — в две колонки; варианты и комментарии
 * прерывают её отдельными блоками под своим ходом, вложенные варианты — в скобках.
 */
export const VariationTree: React.FC<VariationTreeProps> = ({ tree, currentId, onSelect, testId = 'variation-tree' }) => {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLElement | null>(null);
  useEffect(() => { activeRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [currentId]);

  const root = tree.nodes[tree.rootId];
  const node = (id: string) => tree.nodes[id];

  /** Ход: SAN + глиф хода + прочие глифы (оценка позиции) */
  const move = (n: TreeNode, opts: { number?: string; cell?: boolean }) => {
    const active = n.id === currentId;
    const glyph = moveGlyph(n);
    const extra = n.nags.map(nagToSymbol).filter((sym) => sym && sym !== glyph).join(' ');
    return (
      <Box
        key={`m${n.id}`}
        component="span"
        role="button"
        tabIndex={-1}
        ref={active ? (el: HTMLElement | null) => { activeRef.current = el; } : undefined}
        onClick={() => onSelect(n.id)}
        aria-current={active ? 'step' : undefined}
        data-node={n.id}
        sx={{
          display: opts.cell ? 'flex' : 'inline-flex', alignItems: 'baseline', gap: 0.25, cursor: 'pointer',
          px: opts.cell ? 1 : 0.5, py: opts.cell ? 0.5 : 0.1, minHeight: opts.cell ? 30 : undefined, borderRadius: 1,
          fontWeight: active ? 700 : opts.cell ? 500 : 400,
          color: active ? 'primary.main' : 'text.primary',
          bgcolor: active ? tokens.accent.goldSoft : 'transparent',
          boxShadow: active ? 'inset 0 0 0 1px rgba(227,179,65,0.35)' : 'none',
          '&:hover': { bgcolor: active ? tokens.accent.goldSoft : 'action.hover' },
        }}
      >
        {opts.number && <Box component="span" sx={{ color: 'text.disabled', fontFamily: tokens.font.mono, fontSize: '0.8em' }}>{opts.number}</Box>}
        <span>{n.san}</span>
        {glyph && <Box component="span" sx={{ color: GLYPH_COLORS[glyph], fontWeight: 700 }}>{glyph}</Box>}
        {extra && <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.85em' }}>{extra}</Box>}
      </Box>
    );
  };

  const commentText = (n: TreeNode, inline: boolean) => n.comment && (
    <Box key={`c${n.id}`} component={inline ? 'span' : 'div'} data-testid="move-comment" onClick={() => onSelect(n.id)}
      sx={inline
        ? { color: 'text.secondary', fontStyle: 'italic', mx: 0.5, cursor: 'pointer' }
        : {
          gridColumn: '1 / -1', mx: 0.5, my: 0.25, px: 1.25, py: 0.75, cursor: 'pointer', borderLeft: `2px solid ${tokens.accent.gold}`,
          borderRadius: '0 6px 6px 0', bgcolor: 'surface.raised', color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.45,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
      {n.comment}
    </Box>
  );

  /** Линия варианта в строку: «2... Nc6 3. Bb5 (3. Bc4 Bc5) a6» */
  const inlineLine = (startId: string): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    let id: string | undefined = startId;
    let needNumber = true;
    while (id) {
      const n: TreeNode = node(id);
      const number = n.color === 'w' ? `${n.moveNumber}.` : needNumber ? `${n.moveNumber}...` : undefined;
      out.push(move(n, { number }));
      needNumber = false;
      if (n.comment) { out.push(commentText(n, true)); needNumber = true; }
      const parent = n.parentId ? node(n.parentId) : null;
      if (parent && parent.children[0] === id && parent.children.length > 1) {
        for (const alt of parent.children.slice(1)) {
          out.push(
            <Box key={`v${alt}`} component="span" sx={{ color: 'text.secondary' }}>
              {' ('}{inlineLine(alt)}{') '}
            </Box>,
          );
        }
        needNumber = true;
      }
      id = n.children[0];
    }
    return out;
  };

  /** Блок вариантов к ходу главной линии — под ним, с отступом */
  const variationsBlock = (parent: TreeNode) => (
    <Box key={`vb${parent.id}`} sx={{ gridColumn: '1 / -1', ml: 1.5, my: 0.25, pl: 1.25, borderLeft: 1, borderColor: 'divider', fontSize: '0.88rem', lineHeight: 1.9 }}>
      {parent.children.slice(1).map((alt) => (
        <Box key={`vl${alt}`} data-testid="variation-line">{inlineLine(alt)}</Box>
      ))}
    </Box>
  );

  // Главная линия в две колонки; комментарий или варианты после хода белых
  // переносят ход чёрных на новую строку с «N...»
  const rows: React.ReactNode[] = [];
  if (root.comment) rows.push(commentText(root, false));
  const number = (n: TreeNode, black: boolean) => (
    <Box key={`n${n.id}`} sx={{ color: 'text.disabled', textAlign: 'right', pr: 1, fontFamily: tokens.font.mono, fontSize: '0.8rem' }}>
      {n.moveNumber}.{black ? '..' : ''}
    </Box>
  );
  let id: string | undefined = root.children[0];
  let column: 'w' | 'b' = 'w'; // какая колонка следующая
  while (id) {
    const n: TreeNode = node(id);
    const parent = node(n.parentId!);
    if (n.color === 'w') {
      rows.push(number(n, false), move(n, { cell: true }));
      column = 'b';
    } else {
      if (column === 'w') rows.push(number(n, true), <span key={`gap${n.id}`} />);
      rows.push(move(n, { cell: true }));
      column = 'w';
    }
    const interrupt = !!n.comment || parent.children.length > 1;
    if (interrupt) {
      if (column === 'b') rows.push(<span key={`pad${n.id}`} />);
      if (parent.children.length > 1) rows.push(variationsBlock(parent));
      if (n.comment) rows.push(commentText(n, false));
      column = 'w';
    }
    id = n.children[0];
  }
  // Незакрытая строка (последний ход — белых)
  if (column === 'b') rows.push(<span key="tail" />);

  if (!root.children.length) {
    return (
      <Box data-testid={testId}>
        {root.comment && commentText(root, false)}
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          {t('chessGame.noMoves', 'Make a move on the board or load a PGN')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box data-testid={testId} sx={{ display: 'grid', gridTemplateColumns: '2.75rem 1fr 1fr', alignItems: 'center', rowGap: 0.25, columnGap: 0.5, fontSize: '0.95rem' }}>
      {rows}
    </Box>
  );
};
