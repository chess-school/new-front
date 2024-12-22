import { Square } from 'chess.js';
import React from 'react';
import { Chessboard } from 'react-chessboard';

interface ChessBoardProps {
  position: string;
  onMove: (source: Square, target: Square) => boolean;
  boardWidth?: number;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ position, onMove, boardWidth = 500 }) => {
  return (
    <Chessboard
      position={position}
      onPieceDrop={(sourceSquare, targetSquare) => onMove(sourceSquare, targetSquare)}
      boardWidth={boardWidth}
    />
  );
};

export default ChessBoard;

