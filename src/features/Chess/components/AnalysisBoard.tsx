import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Square } from 'chess.js';
import { useTranslation } from 'react-i18next';

import { ChessBoard } from './ChessBoard';
import { EvalBar } from './EvalBar';
import { EnginePanel } from './EnginePanel';
import { ArenaPanel, ChessArena } from './ChessArena';
import { ResizableBoard } from './ResizableBoard';
import { BOARD_DEFAULT } from './boardSize';
import { StockfishEngine } from '../engine/stockfish';
import { useEngineAnalysis } from '../engine/useStockfish';
import { engineArrows } from '../engine/evaluation';
import { fromLine, continuation } from '../tree/gameTree';
import { useGameTree } from '../tree/useGameTree';
import { useTreeKeyboard } from '../tree/useTreeKeyboard';
import { VariationTree } from './VariationTree';
import { AnnotationPanel } from './AnnotationPanel';
import { CommentPlaque } from './CommentPlaque';

interface AnalysisBoardProps {
  startFen: string;
  /** Линия, с которой начинается разбор (например, решение задачи), в UCI */
  moves: string[];
  /** С какого полухода открыть (по умолчанию — конец линии) */
  initialPly?: number;
  orientation: 'white' | 'black';
  engine: StockfishEngine | null;
  engineOn: boolean;
  onToggleEngine: (on: boolean) => void;
  /**
   * stacked — доска, навигация, ходы и движок одной колонкой (вставляется в чужую раскладку);
   * arena — во всю страницу на ChessArena: панель справа, на телефоне — нижние вкладки
   */
  variant?: 'stacked' | 'arena';
  /** Только для arena: блок над движком (статус задачи) */
  header?: React.ReactNode;
  /** Только для arena: вкладки после «Ходы» */
  extraPanels?: ArenaPanel[];
  /** Только для arena: кнопки после навигации («Новая задача») */
  extraControls?: React.ReactNode;
  /** Комментарии к ходам исходной линии moves по номеру полухода (1 — после первого хода) */
  comments?: Record<number, string>;
  /** Глифы, комментарии и правка дерева под нотацией */
  annotate?: boolean;
}

const EMPTY_COMMENTS: Record<number, string> = {};

/**
 * Доска разбора в стиле Lichess: свободные ходы обеими сторонами (новый ход отрезает продолжение),
 * навигация кнопками и стрелками клавиатуры, шкала оценки, стрелки лучших ходов и линии движка —
 * всё пересчитывается для текущей позиции.
 */
export const AnalysisBoard: React.FC<AnalysisBoardProps> = ({
  startFen, moves, initialPly, orientation, engine, engineOn, onToggleEngine,
  variant = 'stacked', header, extraPanels = [], extraControls, comments = EMPTY_COMMENTS, annotate = true,
}) => {
  const { t } = useTranslation();
  const [boardPx, setBoardPx] = useState(BOARD_DEFAULT);
  // Разбор — дерево вариантов: исходная линия (решение) — главная, свои ходы — варианты
  const buildTree = useCallback(() => fromLine(startFen, moves, comments), [startFen, moves, comments]);
  const game = useGameTree(buildTree);
  const { tree, current, fen, lastMove, actions } = game;
  useTreeKeyboard(game);

  // Новая задача/позиция — новый разбор. Сравниваем содержимое линии и комментариев, а не ссылки:
  // родитель может пересоздавать moves на каждом рендере, это не должно сбрасывать разбор
  const movesKey = moves.join(' ');
  const commentsKey = JSON.stringify(comments);
  const { reset } = actions;
  useEffect(() => {
    const next = fromLine(startFen, movesKey ? movesKey.split(' ') : [], JSON.parse(commentsKey));
    const line = continuation(next, next.rootId);
    const ply = Math.min(initialPly ?? line.length, line.length);
    reset(next, ply > 0 ? line[ply - 1].id : next.rootId);
  }, [startFen, movesKey, commentsKey, initialPly, reset]);

  const { result, analyzing } = useEngineAnalysis(engine, fen, { enabled: engineOn, depth: 16, multiPv: 3, debounceMs: 80 });
  // Результат прошлой позиции не показываем ни секунды: шкала и стрелки — только для текущей
  const fresh = result && result.fen === fen ? result : null;
  const arrows = useMemo(() => (engineOn ? engineArrows(fresh, 2) : []), [engineOn, fresh]);

  const onMove = (from: Square, to: Square, promotion?: string): boolean => actions.play({ from, to, promotion });

  const board = (
    <ChessBoard fen={fen} onMove={onMove} boardOrientation={orientation} movable="both" customArrows={arrows} lastMove={lastMove} coordinates="outside" />
  );

  const atStart = current.id === tree.rootId;
  const atEnd = current.children.length === 0;
  const navButton = (label: 'start' | 'back' | 'forward' | 'end', icon: React.ReactElement, onClick: () => void, disabled: boolean) => (
    <Tooltip title={t(`analysisBoard.${label}`)}>
      <span><IconButton aria-label={label} onClick={onClick} disabled={disabled}>{icon}</IconButton></span>
    </Tooltip>
  );
  const navigation = (
    <Stack direction="row" justifyContent="center">
      {navButton('start', <FirstPageIcon />, actions.toStart, atStart)}
      {navButton('back', <ChevronLeftIcon />, actions.back, atStart)}
      {navButton('forward', <ChevronRightIcon />, actions.forward, atEnd)}
      {navButton('end', <LastPageIcon />, actions.toEnd, atEnd)}
    </Stack>
  );

  const moveList = (
    <Stack spacing={1}>
      <VariationTree tree={tree} currentId={current.id} onSelect={actions.goTo} testId="analysis-moves" />
      {annotate && <AnnotationPanel game={game} />}
    </Stack>
  );

  const commentPlaque = <CommentPlaque node={current} />;

  const enginePanel = (
    <EnginePanel
      enabled={engineOn}
      onToggle={onToggleEngine}
      result={fresh}
      analyzing={analyzing}
      engineName={engine?.name}
      error={engine?.error}
      maxLines={3}
    />
  );

  if (variant === 'arena') {
    return (
      <Box data-testid="analysis-board">
        <ChessArena
          board={board}
          showEval={engineOn}
          evalResult={fresh}
          orientation={orientation}
          header={<Stack spacing={1.5}>{header}{commentPlaque}{enginePanel}</Stack>}
          panels={[{ key: 'moves', label: t('analysisBoard.moves', 'Moves'), icon: <FormatListNumberedRoundedIcon />, content: moveList }, ...extraPanels]}
          controls={<Stack spacing={1}>{navigation}{extraControls}</Stack>}
        />
      </Box>
    );
  }

  return (
    <Box data-testid="analysis-board">
      <Stack direction="row" spacing={1} alignItems="flex-start">
        {engineOn && <Box sx={{ height: { xs: 'auto', md: boardPx }, alignSelf: { xs: 'stretch', md: 'flex-start' } }}><EvalBar result={fresh} orientation={orientation} /></Box>}
        <Box sx={{ flex: 1, minWidth: 0 }}><ResizableBoard reserveBottom={120} onSize={setBoardPx}>{board}</ResizableBoard></Box>
      </Stack>
      <Box sx={{ mt: 1 }}>{navigation}</Box>
      {current.comment && <Box sx={{ mt: 1 }}>{commentPlaque}</Box>}
      <Box sx={{ mt: 1 }}>{moveList}</Box>
      <Box sx={{ mt: 2 }}>{enginePanel}</Box>
    </Box>
  );
};
