import React from 'react';
import { Box } from '@mui/material';
import { MoveNode, MoveTree, formatMoveNumber, nagToSymbol } from '../utils/pgnTree';

interface MoveTreeViewProps {
  tree: MoveTree;
  activeId?: number | null;
  onSelect?: (node: MoveNode) => void;
}

const commentSx = { color: 'text.secondary', fontStyle: 'italic', mx: 0.5 };

// Рендерит линию: ход, его комментарий, затем варианты-альтернативы следующему ходу в скобках
const Line: React.FC<{ first: MoveNode; siblings: MoveNode[]; depth: number } & Omit<MoveTreeViewProps, 'tree'>> = ({
  first, siblings, depth, activeId, onSelect,
}) => {
  const items: React.ReactNode[] = [];
  let node: MoveNode | undefined = first;
  let alternatives = siblings;
  let showNumber = true;

  while (node) {
    const current: MoveNode = node;
    if (current.commentBefore) {
      items.push(<Box component="span" key={`cb${current.id}`} sx={commentSx}>{current.commentBefore}</Box>);
    }
    items.push(
      <Box
        component="span"
        key={current.id}
        onClick={() => onSelect?.(current)}
        sx={{
          cursor: onSelect ? 'pointer' : 'default',
          px: 0.5,
          borderRadius: 1,
          bgcolor: current.id === activeId ? 'action.selected' : 'transparent',
          color: current.id === activeId ? 'primary.main' : 'inherit',
          fontWeight: current.id === activeId || depth === 0 ? 700 : 'normal',
          '&:hover': onSelect ? { bgcolor: 'action.hover' } : undefined,
        }}
      >
        {(current.color === 'w' || showNumber) && `${formatMoveNumber(current)} `}
        {current.san}
        {current.nags.map(nagToSymbol).join('')}
      </Box>,
    );
    showNumber = false;
    if (current.comment) {
      items.push(<Box component="span" key={`c${current.id}`} sx={commentSx}>{current.comment}</Box>);
      showNumber = true;
    }
    for (const alt of alternatives) {
      items.push(
        <Box component="span" key={`v${alt.id}`} sx={{ color: 'text.secondary', display: depth === 0 ? 'block' : 'inline', pl: depth === 0 ? 2 : 0 }}>
          ({' '}
          <Line first={alt} siblings={[]} depth={depth + 1} activeId={activeId} onSelect={onSelect} />
          {' '})
        </Box>,
      );
      showNumber = true;
    }
    alternatives = current.children.slice(1);
    node = current.children[0];
  }
  return <>{items}</>;
};

export const MoveTreeView: React.FC<MoveTreeViewProps> = ({ tree, activeId, onSelect }) => {
  if (tree.roots.length === 0) {
    return tree.comment ? <Box sx={commentSx}>{tree.comment}</Box> : null;
  }
  return (
    <Box sx={{ lineHeight: 1.9, fontSize: 14 }}>
      {tree.comment && <Box component="span" sx={commentSx}>{tree.comment}</Box>}
      <Line first={tree.roots[0]} siblings={tree.roots.slice(1)} depth={0} activeId={activeId} onSelect={onSelect} />
    </Box>
  );
};
