import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Arrow, Piece } from 'react-chessboard/dist/chessboard/types';
import { tokens } from '@/theme/tokens';
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
}

const PREMOVE_SQUARE = { backgroundColor: 'rgba(88, 166, 255, 0.42)' };
const PREMOVE_DOT = 'radial-gradient(circle, rgba(88,166,255,0.55) 22%, transparent 23%)';

const MOVE_DOT = 'radial-gradient(circle, rgba(13,17,23,0.28) 22%, transparent 23%)';
const CAPTURE_RING = 'radial-gradient(circle, transparent 58%, rgba(13,17,23,0.32) 59%)';

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
}) => {
  // 'w' | 'b' — можно ходить только этим цветом; null — любым
  const movableColor = movable === 'both' ? null : (movable ?? boardOrientation)?.charAt(0) ?? null;
  const game = useMemo(() => new Chess(), []);
  const [fromSquare, setFromSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<{ [square: string]: React.CSSProperties }>({});
  const [moveToSquare, setMoveToSquare] = useState<Square | null>(null);

  useMemo(() => { game.load(fen); }, [fen, game]);

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
  
  return (
    <Chessboard
      position={fen}
      onPieceDrop={handlePieceDrop}
      onSquareClick={handleSquareClick}
      boardOrientation={boardOrientation}
      isDraggablePiece={({ piece }) => !movableColor || piece.startsWith(movableColor)}
      promotionToSquare={moveToSquare}
      customArrows={customArrows}
      onPromotionPieceSelect={handlePromotionPieceSelect}

      promotionDialogVariant="vertical"

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
};