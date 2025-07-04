import { Square } from 'chess.js';
import React from 'react';
import { Chessboard } from 'react-chessboard';

interface ChessBoardProps {
  position: string;
  onMove?: (source: Square, target: Square) => boolean;
  onSquareClick?: (square: Square) => void;
  boardWidth?: number;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ position, onMove, onSquareClick, boardWidth = 500 }) => {
  return (
    <Chessboard
      position={position}
      boardWidth={boardWidth}
      onPieceDrop={onMove ? (source, target) => onMove(source, target) : undefined}
      onSquareClick={onSquareClick}
    />
  );
};

export default ChessBoard;
