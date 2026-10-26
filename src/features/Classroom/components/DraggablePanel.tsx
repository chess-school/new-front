import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, IconButton, Paper, Stack, Typography } from '@mui/material';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

interface DraggablePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Стартовая позиция (px от левого/верхнего края). По умолчанию — правый верх. */
  defaultPos?: { x: number; y: number };
  width?: number;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Плавающее окно, которое можно таскать за шапку по экрану (position: fixed).
 * Используется для инструментов тренера в классе — чтобы не занимать колонку и не мешать доске.
 */
export const DraggablePanel: React.FC<DraggablePanelProps> = ({ title, onClose, children, defaultPos, width = 380 }) => {
  const [pos, setPos] = useState(() => defaultPos ?? {
    x: typeof window !== 'undefined' ? Math.max(12, window.innerWidth - width - 24) : 24,
    y: 88,
  });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const w = window.innerWidth, h = window.innerHeight;
    setPos({
      x: clamp(e.clientX - drag.current.dx, 8 - width + 60, w - 60),
      y: clamp(e.clientY - drag.current.dy, 8, h - 60),
    });
  }, [width]);

  const endDrag = useCallback(() => { drag.current = null; }, []);

  // Если окно ушло за край после ресайза вьюпорта — подтянуть обратно
  useEffect(() => {
    const onResize = () => setPos((p) => ({
      x: clamp(p.x, 8 - width + 60, window.innerWidth - 60),
      y: clamp(p.y, 8, window.innerHeight - 60),
    }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width]);

  return (
    <Paper
      elevation={12}
      sx={{
        position: 'fixed', left: pos.x, top: pos.y, width, maxWidth: 'calc(100vw - 16px)',
        zIndex: (theme) => theme.zIndex.modal + 1, borderRadius: '12px', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 32px)',
      }}
    >
      <Stack
        direction="row" alignItems="center" spacing={0.5}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        sx={{ px: 1, py: 0.75, bgcolor: 'surface.raised', borderBottom: 1, borderColor: 'divider', cursor: 'move', touchAction: 'none', userSelect: 'none' }}
      >
        <DragIndicatorRoundedIcon fontSize="small" color="disabled" />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }} noWrap>{title}</Typography>
        <IconButton size="small" onClick={onClose} aria-label="close"><CloseRoundedIcon fontSize="small" /></IconButton>
      </Stack>
      <Box sx={{ p: 1.5, overflowY: 'auto', position: 'relative' }}>{children}</Box>
    </Paper>
  );
};

export default DraggablePanel;
