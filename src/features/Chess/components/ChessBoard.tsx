// src/components/ChessBoard.tsx (ОКОНЧАТЕЛЬНАЯ И САМАЯ ПРОСТАЯ ВЕРСИЯ)

import React, { useState, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Piece } from 'react-chessboard/dist/chessboard/types';

interface ChessBoardProps {
  fen: string;
  onMove: (sourceSquare: Square, targetSquare: Square, promotionPiece?: string) => boolean;
  boardOrientation?: 'white' | 'black'; 
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  fen, 
  onMove,
  boardOrientation 
}) => {
  const game = useMemo(() => new Chess(), []);
  const [fromSquare, setFromSquare] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<{ [square: string]: React.CSSProperties }>({});
  const [moveToSquare, setMoveToSquare] = useState<Square | null>(null);

  useMemo(() => { game.load(fen); }, [fen, game]);
  
  const handleSquareClick = (square: Square) => {
    if (fromSquare === square) {
      setFromSquare(null);
      setOptionSquares({});
      return;
    }

    if (!fromSquare) {
        const piece = game.get(square);
        
        if (piece && (!boardOrientation || piece.color === boardOrientation.charAt(0))) {
            setFromSquare(square);
            const moves = game.moves({ square, verbose: true });
            const newOptions: { [square: string]: React.CSSProperties } = {};
            moves.forEach(move => {
                newOptions[move.to] = {
                    background: 'radial-gradient(circle, rgba(0,0,0,0.1) 25%, transparent 25%)',
                    borderRadius: '50%',
                };
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

    onMove(sourceSquare, targetSquare);
    setFromSquare(null);
    setOptionSquares({});
    
    return true;
  };
  
  return (
    <Chessboard
      position={fen}
      onPieceDrop={handlePieceDrop}
      onSquareClick={handleSquareClick}
      boardOrientation={boardOrientation}
      isDraggablePiece={({ piece }) => 
        !boardOrientation || piece.startsWith(boardOrientation.charAt(0))
      }
      promotionToSquare={moveToSquare}
      onPromotionPieceSelect={handlePromotionPieceSelect}

      // --- ВОТ ОНО! ЕДИНСТВЕННОЕ НУЖНОЕ ИЗМЕНЕНИЕ ---
      promotionDialogVariant="vertical"
      
      customSquareStyles={{ ...optionSquares, ...(fromSquare && { [fromSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } }) }}
      customBoardStyle={{ borderRadius: '4px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}
      customDarkSquareStyle={{ backgroundColor: '#779952' }}
      customLightSquareStyle={{ backgroundColor: '#edeed1' }}
    />
  );
};