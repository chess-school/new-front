import React, { createContext, useContext, useState } from 'react';
import { Chess, Square } from 'chess.js';

interface ChessContextType {
  fen: string;
  history: string[];
  makeMove: (source: Square, target: Square) => boolean;
  resetGame: () => void;
  loadPGN: (pgn: string) => void;
  isGameOver: () => boolean;
}
interface ChessProviderProps {
  children: React.ReactNode;
}
const ChessContext = createContext<ChessContextType | null>(null);

export const ChessProvider: React.FC<ChessProviderProps> = ({ children }) => {
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState<string[]>([]);

  const makeMove = (source: Square, target: Square) => {
    const moves = chess.moves({ square: source, verbose: true });

    const validMove = moves.find((move) => move.to === target);
  
    if (!validMove) {
      return false;
    }
  
    const move = chess.move({ from: source, to: target });
    if (move) {
      setFen(chess.fen());
      setHistory(chess.history());
      return true;
    }
    return false;
  };

  const resetGame = () => {
    chess.reset();
    setFen(chess.fen());
    setHistory([]);
  };

  const loadPGN = (pgn: string) => {
    chess.loadPgn(pgn);
    setFen(chess.fen());
    setHistory(chess.history());
  };

  const isGameOver = () => chess.isGameOver();

  return (
    <ChessContext.Provider value={{ fen, history, makeMove, resetGame, loadPGN, isGameOver }}>
      {children}
    </ChessContext.Provider>
  );
};

export const useChess = () => {
  const context = useContext(ChessContext);
  if (!context) {
    throw new Error('useChess must be used within a ChessProvider');
  }
  return context;
};
