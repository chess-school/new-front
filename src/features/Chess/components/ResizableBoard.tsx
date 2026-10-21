import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Box, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { tokens } from '@/theme/tokens';
import { BOARD_DEFAULT, BOARD_MAX, BOARD_MIN, clampBoard, setBoardSize, useBoardSize } from './boardSize';


const STEP = 16;

// Размер доски, как на Lichess: тянется за правый нижний угол, один на все страницы
// (задачи, анализ, задачник, редактор) и запоминается в браузере.

interface ResizableBoardProps {
  children: React.ReactNode;
  /** Максимальная ширина в px (родитель знает, сколько места после панели); иначе — ширина контейнера */
  maxWidth?: number;
  /** Отступ снизу, который должен остаться видимым под доской (кнопки и т. п.), px */
  reserveBottom?: number;
  /** Без ручки: доска на всю ширину (телефон) */
  disabled?: boolean;
  /** Фактический размер — например, чтобы шкала оценки была той же высоты */
  onSize?: (px: number) => void;
}

/**
 * Квадратный контейнер доски с ручкой изменения размера в правом нижнем углу.
 * Размер ограничен шириной контейнера и высотой экрана — доска всегда целиком в поле зрения.
 * Двойной клик по ручке возвращает размер по умолчанию; с клавиатуры — стрелки.
 */
export const ResizableBoard: React.FC<ResizableBoardProps> = ({ children, maxWidth, reserveBottom = 16, disabled = false, onSize }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  // Телефон/планшет: без ручки, доска на всю ширину контейнера
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const off = disabled || !wide;
  const outer = useRef<HTMLDivElement | null>(null);
  const preferredSize = useBoardSize();
  const [live, setLive] = useState<number | null>(null); // размер во время перетаскивания
  const [space, setSpace] = useState({ width: BOARD_MAX, height: BOARD_MAX });

  // Сколько места есть: ширина контейнера и высота от верха доски до низа экрана
  const measure = useCallback(() => {
    const el = outer.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const width = maxWidth ?? (el.parentElement?.clientWidth || rect.width);
    const height = window.innerHeight - Math.min(top, window.innerHeight * 0.5) - reserveBottom;
    setSpace((s) => (s.width === width && s.height === height ? s : { width, height }));
  }, [maxWidth, reserveBottom]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver !== 'undefined' && outer.current?.parentElement ? new ResizeObserver(measure) : null;
    if (ro && outer.current?.parentElement) ro.observe(outer.current.parentElement);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [measure]);

  const limit = Math.max(BOARD_MIN, Math.floor(Math.min(space.width, space.height)));
  const size = clampBoard(live ?? preferredSize, BOARD_MIN, limit);

  useEffect(() => { if (!off) onSize?.(size); }, [size, off, onSize]);

  // Последний размер перетаскивания — в ref: pointerup может прийти до перерисовки после pointermove
  const drag = useRef<{ x: number; y: number; size: number; last: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, size, last: size };
    setLive(size);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    // Диагональ: тянем вправо-вниз — больше, влево-вверх — меньше
    const delta = (e.clientX - start.x + (e.clientY - start.y)) / 2;
    if (!Number.isFinite(delta)) return;
    start.last = clampBoard(start.size + delta, BOARD_MIN, limit);
    setLive(start.last);
  };
  const finish = () => {
    const start = drag.current;
    if (!start) return;
    drag.current = null;
    setBoardSize(start.last);
    setLive(null);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowUp: STEP, ArrowRight: STEP, ArrowDown: -STEP, ArrowLeft: -STEP }[e.key];
    if (!delta) return;
    e.preventDefault();
    e.stopPropagation(); // стрелки не должны листать ходы в разборе
    setBoardSize(clampBoard(size + delta, BOARD_MIN, limit));
  };

  if (off) return <Box sx={{ width: '100%', aspectRatio: '1 / 1' }}>{children}</Box>;

  return (
    <Box ref={outer} data-testid="resizable-board" data-size={size}
      sx={{ position: 'relative', width: size, height: size, flexShrink: 0, '&:hover .board-resize-handle': { opacity: 1 } }}>
      {children}
      <Tooltip title={t('board.resize', 'Drag to resize the board (double-click to reset)')} placement="right" enterDelay={600}>
        <Box
          className="board-resize-handle"
          role="slider"
          tabIndex={0}
          aria-label={t('board.resizeLabel', 'Board size')}
          aria-valuemin={BOARD_MIN}
          aria-valuemax={limit}
          aria-valuenow={Math.round(size)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
          onDoubleClick={() => setBoardSize(BOARD_DEFAULT)}
          onKeyDown={onKeyDown}
          sx={{
            position: 'absolute', right: -10, bottom: -10, width: 22, height: 22, zIndex: 2,
            cursor: 'nwse-resize', touchAction: 'none', borderRadius: '6px',
            opacity: live !== null ? 1 : 0.55, transition: 'opacity .15s ease',
            // Три диагональные риски, как у Lichess
            background: `linear-gradient(135deg, transparent 45%, ${tokens.accent.gold} 45%, ${tokens.accent.gold} 52%, transparent 52%, transparent 62%, ${tokens.accent.gold} 62%, ${tokens.accent.gold} 69%, transparent 69%, transparent 79%, ${tokens.accent.gold} 79%, ${tokens.accent.gold} 86%, transparent 86%)`,
            '&:focus-visible': { outline: `2px solid ${tokens.accent.gold}`, outlineOffset: 2, opacity: 1 },
          }}
        />
      </Tooltip>
    </Box>
  );
};
