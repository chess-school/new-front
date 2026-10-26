import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Arrow, Piece } from 'react-chessboard/dist/chessboard/types';
import { tokens, tokensFor } from '@/theme/tokens';
import { applyPremoves, boardFromFen, isPromotionPremove, Premove, premoveDests } from '../engine/premove';

interface ChessBoardProps {
  fen: string;
  onMove: (sourceSquare: Square, targetSquare: Square, promotionPiece?: string) => boolean;
  boardOrientation?: 'white' | 'black';
  /** Дополнительная подсветка полей (например, подсказка в задаче) */
  customSquareStyles?: { [square: string]: React.CSSProperties };
  /** Стрелки на доске, например лучший ход движка: [['e2', 'e4', 'rgba(...)']] */
  customArrows?: Arrow[];
  /**
   * Чьими фигурами можно ходить. По умолчанию — цветом ориентации доски (решение задачи),
   * 'both' — обеими (свободный разбор позиции)
   */
  movable?: 'white' | 'black' | 'both';
  /** Последний ход — подсветка полей «откуда/куда», как на Lichess */
  lastMove?: { from: string; to: string } | null;
  /**
   * Предходы, как на Lichess: пока ходит соперник, можно заранее поставить свои ходы (очередь);
   * первый исполняется сразу, как только ход перейдёт к игроку. Только при одном цвете movable.
   */
  premoves?: boolean;
  /** Сменить, чтобы сбросить очередь предходов (новая задача) */
  premoveKey?: unknown;
  /**
   * Координаты доски: 'inside' — встроенные (в углах клеток, по умолчанию),
   * 'outside' — вынесенные на внешнюю рамку (как на Lichess, лучше читаются, не мешают фигурам).
   */
  coordinates?: 'inside' | 'outside';
  /** Можно ли рисовать стрелки правой кнопкой (по умолчанию да). В классе — только у кого контроль */
  areArrowsAllowed?: boolean;
  /** Пользователь нарисовал/изменил стрелки правой кнопкой — для синхронного рисования в классе */
  onArrowsChange?: (arrows: Arrow[]) => void;
}

// Шрифт координат доски масштабируем от её ширины (react-chessboard по умолчанию берёт width/48 — мелко и плохо читается)
const notationFontSize = (boardWidth: number) => Math.round(Math.min(26, Math.max(12, boardWidth / 28)));

const PREMOVE_SQUARE = { backgroundColor: 'rgba(88, 166, 255, 0.42)' };
const PREMOVE_DOT = 'radial-gradient(circle, rgba(88,166,255,0.55) 22%, transparent 23%)';

const MOVE_DOT = 'radial-gradient(circle, rgba(9,11,14,0.28) 22%, transparent 23%)';
const CAPTURE_RING = 'radial-gradient(circle, transparent 58%, rgba(9,11,14,0.32) 59%)';

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  fen, 
  onMove,
  boardOrientation,
  customSquareStyles,
  customArrows,
  movable,
  lastMove,
  premoves = false,
  premoveKey,
  coordinates = 'inside',
  areArrowsAllowed = true,
  onArrowsChange,
}) => {
  const theme = useTheme();
  // 'w' | 'b' — можно ходить только этим цветом; null — любым
  const movableColor = movable === 'both' ? null : (movable ?? boardOrientation)?.charAt(0) ?? null;
  const game = useMemo(() => new Chess(), []);
  const [fromSquare, setFromSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<{ [square: string]: React.CSSProperties }>({});
  const [moveToSquare, setMoveToSquare] = useState<Square | null>(null);

  useMemo(() => { game.load(fen); }, [fen, game]);

  // Ширина доски — чтобы координаты масштабировались вместе с ней
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setBoardWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Контрастная, крупная нотация: цвет поля ставит react-chessboard (светлый на тёмных полях, тёмный на светлых),
  // мы добавляем размер, жирность и тень-обводку — чтобы буквы/цифры были видны по краям доски
  const notationStyle = useMemo<Record<string, string | number>>(() => ({
    fontSize: notationFontSize(boardWidth),
    fontWeight: 800,
    textShadow: '0 1px 2px rgba(9,11,14,0.65), 0 0 2px rgba(9,11,14,0.5)',
  }), [boardWidth]);

  // ---- Предходы
  const [queue, setQueue] = useState<Premove[]>([]);
  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
  const premoveMode = premoves && !!movableColor && turn !== movableColor;
  // Позиция «после» уже поставленных предходов: следующий предход — от неё
  const virtualBoard = useMemo(() => applyPremoves(boardFromFen(fen), queue), [fen, queue]);

  // Новая задача: очередь сбрасывается, и в этот же проход ничего не исполняется
  const keyRef = useRef(premoveKey);
  useEffect(() => { setQueue([]); }, [premoveKey]);
  useEffect(() => { if (!premoves) setQueue([]); }, [premoves]);

  // Ход перешёл к игроку — исполняем первый предход; нелегальный сбрасывает всю очередь
  useEffect(() => {
    if (keyRef.current !== premoveKey) {
      keyRef.current = premoveKey;
      return;
    }
    if (!premoves || !movableColor || turn !== movableColor || queue.length === 0) return;
    const [first, ...rest] = queue;
    const accepted = onMove(first.from as Square, first.to as Square, first.promotion);
    setQueue(accepted ? rest : []);
    // Только на смену позиции: очередь и onMove меняются вместе с ней
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const clearSelection = () => {
    setFromSquare(null);
    setOptionSquares({});
  };
  const queuePremove = (from: string, to: string) => {
    if (!premoveDests(virtualBoard, from).includes(to)) return false;
    setQueue((q) => [...q, { from, to, promotion: isPromotionPremove(virtualBoard, from, to) ? 'q' : undefined }]);
    clearSelection();
    return true;
  };

  const handlePremoveClick = (square: Square) => {
    if (fromSquare && fromSquare !== square && queuePremove(fromSquare, square)) return;
    const piece = virtualBoard.get(square);
    if (piece && piece[0] === movableColor && fromSquare !== square) {
      setFromSquare(square);
      setOptionSquares(Object.fromEntries(premoveDests(virtualBoard, square).map((to) => [to, { background: PREMOVE_DOT }])));
      return;
    }
    // Клик мимо — отмена выбора, а без выбора — отмена всех предходов
    if (!fromSquare) setQueue([]);
    clearSelection();
  };

  const premoveStyles = Object.fromEntries(queue.flatMap((p) => [[p.from, PREMOVE_SQUARE], [p.to, PREMOVE_SQUARE]]));

  const handleSquareClick = (square: Square) => {
    if (premoveMode) {
      handlePremoveClick(square);
      return;
    }
    if (fromSquare === square) {
      setFromSquare(null);
      setOptionSquares({});
      return;
    }

    if (!fromSquare) {
        const piece = game.get(square);
        
        if (piece && (!movableColor || piece.color === movableColor)) {
            setFromSquare(square);
            const moves = game.moves({ square, verbose: true });
            const newOptions: { [square: string]: React.CSSProperties } = {};
            moves.forEach(move => {
                newOptions[move.to] = { background: move.captured ? CAPTURE_RING : MOVE_DOT };
            });
            setOptionSquares(newOptions);
        }
        return;
    }

    const legalMoves = game.moves({ square: fromSquare, verbose: true });
    const move = legalMoves.find(m => m.to === square);

    if (move) {
        if (move.flags.includes('p')) {
            setMoveToSquare(square); // Активируем стандартный механизм превращения
        } else {
            onMove(fromSquare, square);
            setFromSquare(null);
            setOptionSquares({});
        }
    } else {
        setFromSquare(null);
        setOptionSquares({});
    }
  };
  
  const handlePromotionPieceSelect = (piece?: Piece): boolean => {
    if (piece && fromSquare && moveToSquare) {
        onMove(fromSquare, moveToSquare, piece.charAt(1).toLowerCase());
    }
    setMoveToSquare(null);
    setFromSquare(null);
    setOptionSquares({});
    return true;
  };
  
  const handlePieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (premoveMode) {
      queuePremove(sourceSquare, targetSquare);
      return false; // фигура остаётся на месте, предход — подсветкой полей
    }
    const move = game.moves({ square: sourceSquare, verbose: true })
                   .find(m => m.to === targetSquare);

    if (!move) {
        return false;
    }
    
    if (move.flags.includes('p')) {
        // Устанавливаем состояния для вызова стандартного диалога
        setFromSquare(sourceSquare);
        setMoveToSquare(targetSquare);
        return true;
    }

    // Если страница отклонила ход (например, неверный ход в задаче), фигура возвращается на место
    const accepted = onMove(sourceSquare, targetSquare);
    setFromSquare(null);
    setOptionSquares({});

    return accepted;
  };
  
  // --- Внешние координаты (Lichess-style): выносим a–h / 1–8 на рамку вокруг доски
  const outside = coordinates === 'outside';
  const coordColor = tokensFor(theme.palette.mode).text.muted;
  const coordSize = Math.max(11, Math.round(notationFontSize(boardWidth) * 0.8));
  const files = boardOrientation === 'black'
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = boardOrientation === 'black'
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];

  const boardEl = (
    <Chessboard
      position={fen}
      onPieceDrop={handlePieceDrop}
      onSquareClick={handleSquareClick}
      boardOrientation={boardOrientation}
      isDraggablePiece={({ piece }) => !movableColor || piece.startsWith(movableColor)}
      promotionToSquare={moveToSquare}
      customArrows={customArrows}
      areArrowsAllowed={areArrowsAllowed}
      onArrowsChange={onArrowsChange}
      onPromotionPieceSelect={handlePromotionPieceSelect}

      promotionDialogVariant="vertical"
      showBoardNotation={!outside}
      customNotationStyle={notationStyle}

      onSquareRightClick={() => { if (queue.length) { setQueue([]); clearSelection(); } }}
      customSquareStyles={{
        ...(lastMove && { [lastMove.from]: { backgroundColor: tokens.board.highlight }, [lastMove.to]: { backgroundColor: tokens.board.highlight } }),
        ...customSquareStyles,
        ...premoveStyles,
        ...optionSquares,
        ...(fromSquare && { [fromSquare]: { backgroundColor: tokens.board.highlight } }),
      }}
      customBoardStyle={{ borderRadius: '10px', overflow: 'hidden', boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.06)' }}
      customDarkSquareStyle={{ backgroundColor: tokens.board.dark }}
      customLightSquareStyle={{ backgroundColor: tokens.board.light }}
      customDropSquareStyle={{ boxShadow: `inset 0 0 0 4px ${tokens.accent.gold}` }}
    />
  );

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }}>
      {outside ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: `${coordSize + 8}px minmax(0, 1fr)`, gridTemplateRows: `minmax(0, 1fr) ${coordSize + 8}px`, columnGap: '4px' }}>
          {/* Вертикаль 1–8 слева, выровнена по центрам рядов */}
          <Box sx={{ gridColumn: 1, gridRow: 1, display: 'flex', flexDirection: 'column' }} aria-hidden>
            {ranks.map((r) => (
              <Box key={r} sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: coordColor, fontSize: coordSize, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{r}</Box>
            ))}
          </Box>
          <Box sx={{ gridColumn: 2, gridRow: 1, minWidth: 0 }}>{boardEl}</Box>
          {/* Горизонталь a–h снизу */}
          <Box sx={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center' }} aria-hidden>
            {files.map((f) => (
              <Box key={f} sx={{ flex: 1, textAlign: 'center', color: coordColor, fontSize: coordSize, fontWeight: 700 }}>{f}</Box>
            ))}
          </Box>
        </Box>
      ) : boardEl}
    </div>
  );
};