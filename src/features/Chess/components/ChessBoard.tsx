
import React from 'react';
import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square) => boolean;
  onSquareClick: (square: Square) => void; 
  squareStyles?: { [square: string]: React.CSSProperties }; 
}

export const ChessBoard: React.FC<ChessBoardProps> = ({ 
  fen, 
  onPieceDrop,
  onSquareClick,
  squareStyles  
}) => {
  return (
    <Chessboard
      position={fen}
      onPieceDrop={onPieceDrop}
      onSquareClick={onSquareClick}
      customSquareStyles={squareStyles}
      customBoardStyle={{ borderRadius: '4px', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)' }}
      customDarkSquareStyle={{ backgroundColor: '#779952' }}
      customLightSquareStyle={{ backgroundColor: '#edeed1' }}
    />
  );
};