import React, { useLayoutEffect, useRef, useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Paper, Stack, Tab, Tabs, useMediaQuery, useTheme } from '@mui/material';
import { AnalysisResult } from '../engine/stockfish';
import { EvalBar } from './EvalBar';
import { ResizableBoard } from './ResizableBoard';
import { BOARD_DEFAULT } from './boardSize';

const PANEL_MIN = 300;
const PANEL_MAX = 380;
const GAP = 20;
const EVAL_WIDTH = 22;

export interface ArenaPanel {
  key: string;
  label: string;
  icon?: React.ReactElement;
  content: React.ReactNode;
}

interface ChessArenaProps {
  /** Доска (ChessBoard / AnalysisBoard без своей шкалы) */
  board: React.ReactNode;
  /** Показывать шкалу оценки (на десктопе — слева от доски, на телефоне — под ней горизонтально) */
  showEval?: boolean;
  evalResult?: AnalysisResult | null;
  orientation?: 'white' | 'black';
  /** Всегда видимый блок: статус задачи, оценка движка. Десктоп — верх боковой панели, телефон — под доской */
  header?: React.ReactNode;
  /** Вкладки боковой панели; на телефоне — нижние вкладки под доской */
  panels?: ArenaPanel[];
  /** Кнопки управления (навигация по ходам, «Подсказка», «Дальше») — низ панели / сразу под доской */
  controls?: React.ReactNode;
  /** Управляемая активная вкладка (необязательно) */
  activePanel?: string;
  onPanelChange?: (key: string) => void;
}

/**
 * Шахматная арена — общий каркас «доска + панель» для анализа, задач и задачника.
 * Десктоп: доска с ручкой размера (как на Lichess, не выше экрана), справа панель той же высоты.
 * Телефон/планшет: доска на всю ширину, шкала горизонтально под ней, панель — нижние вкладки.
 */
export const ChessArena: React.FC<ChessArenaProps> = ({
  board, showEval = false, evalResult = null, orientation = 'white', header, panels = [], controls, activePanel, onPanelChange,
}) => {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  // Пока пользователь не выбрал вкладку сам, активна первая — даже если набор вкладок
  // изменился после монтирования (например, вкладка задачи появилась после загрузки)
  const [ownPanel, setOwnPanel] = useState<string | null>(null);
  const current = activePanel ?? ownPanel ?? panels[0]?.key;
  const select = (key: string) => {
    setOwnPanel(key);
    onPanelChange?.(key);
  };
  const active = panels.find((p) => p.key === current) ?? panels[0];

  // Ширина арены — чтобы доска не залезала под панель
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [arenaWidth, setArenaWidth] = useState<number | null>(null);
  const [boardPx, setBoardPx] = useState(BOARD_DEFAULT);
  useLayoutEffect(() => {
    const el = arenaRef.current;
    if (!el) return undefined;
    const update = () => setArenaWidth(el.clientWidth);
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => { ro?.disconnect(); window.removeEventListener('resize', update); };
  }, [wide]);

  if (wide) {
    // Сколько ширины остаётся доске: ширина арены минус панель, зазор и шкала
    const evalSpace = showEval ? EVAL_WIDTH + 12 : 0;
    const boardMax = arenaWidth ? arenaWidth - PANEL_MIN - GAP - evalSpace : undefined;
    return (
      <Box ref={arenaRef} data-testid="chess-arena" sx={{ display: 'flex', gap: `${GAP}px`, justifyContent: 'center', alignItems: 'stretch' }}>
        {/* Высота ряда = высота доски: шкала и панель подстраиваются под размер доски */}
        <Stack direction="row" spacing={1.5} sx={{ flex: '0 0 auto', alignSelf: 'flex-start' }}>
          {showEval && <Box sx={{ height: boardPx }}><EvalBar result={evalResult} orientation={orientation} width={EVAL_WIDTH} /></Box>}
          <ResizableBoard maxWidth={boardMax} onSize={setBoardPx}>{board}</ResizableBoard>
        </Stack>
        <Box sx={{ flex: `0 1 ${PANEL_MAX}px`, minWidth: PANEL_MIN, position: 'relative', minHeight: Math.max(boardPx, 360) }}>
          <Paper sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {header && <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', maxHeight: '45%', overflowY: 'auto', flexShrink: 0 }}>{header}</Box>}
            {panels.length > 1 && (
              <Tabs value={active?.key ?? false} onChange={(_, v) => select(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', px: 1, minHeight: 40, flexShrink: 0 }}>
                {panels.map((p) => <Tab key={p.key} value={p.key} label={p.label} icon={p.icon} iconPosition="start" sx={{ minHeight: 40, py: 0.5, '& .MuiTab-iconWrapper': { fontSize: 18 } }} />)}
              </Tabs>
            )}
            {active && <Box sx={{ flex: 1, minHeight: 60, overflowY: 'auto', p: 1.5 }}>{active.content}</Box>}
            {controls && <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', flexShrink: 0 }}>{controls}</Box>}
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box data-testid="chess-arena" sx={{ pb: panels.length > 1 ? 9 : 0 }}>
      {/* Доска на всю ширину экрана: выходим за поля контейнера страницы */}
      <Box sx={{ mx: { xs: -2, sm: 0 } }}>
        {/* Телефон — на всю ширину; планшет — не выше экрана (под доской остаются шкала и кнопки) */}
        <Box sx={{ width: '100%', maxWidth: 'calc(100dvh - 210px)', minWidth: { xs: '100%', sm: 320 }, mx: 'auto', aspectRatio: '1 / 1' }}>{board}</Box>
      </Box>
      {showEval && <Box sx={{ mt: 1 }}><EvalBar result={evalResult} orientation={orientation} direction="horizontal" /></Box>}
      {controls && <Box sx={{ mt: 1.5 }}>{controls}</Box>}
      {header && <Paper sx={{ p: 2, mt: 1.5 }}>{header}</Paper>}
      {active && <Paper sx={{ p: 2, mt: 1.5 }}>{active.content}</Paper>}
      {panels.length > 1 && (
        <Paper sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: (th) => th.zIndex.appBar, borderRadius: 0, border: 0, pb: 'env(safe-area-inset-bottom)' }}>
          <BottomNavigation showLabels value={active?.key} onChange={(_, v) => select(v)}>
            {panels.map((p) => <BottomNavigationAction key={p.key} value={p.key} label={p.label} icon={p.icon} />)}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};
