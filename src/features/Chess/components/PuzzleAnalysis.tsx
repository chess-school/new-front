import React, { useState } from 'react';
import { IPuzzle } from '@/types/Puzzles';
import { AnalysisBoard } from './AnalysisBoard';
import { ArenaPanel } from './ChessArena';
import { useStockfishEngine } from '../engine/useStockfish';

const PREF_KEY = 'puzzles.analysisOn';

const readPref = () => {
  try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
};

interface PuzzleAnalysisProps {
  puzzle: IPuzzle;
  /** Сколько ходов линии решения уже сыграно — с этой позиции открывается разбор */
  initialPly?: number;
  orientation: 'white' | 'black';
  /** arena — разбор во всю страницу (см. AnalysisBoard) */
  variant?: 'stacked' | 'arena';
  header?: React.ReactNode;
  extraPanels?: ArenaPanel[];
  extraControls?: React.ReactNode;
}

/**
 * Разбор задачи после решения/сдачи: доска разбора с полной линией решения.
 * Переключатель анализа включает шкалу, стрелки и линии Stockfish; выбор запоминается.
 * Воркер живёт, пока открыт разбор, и уничтожается при выходе из него.
 */
export const PuzzleAnalysis: React.FC<PuzzleAnalysisProps> = ({ puzzle, initialPly, orientation, ...layout }) => {
  const [engineOn, setEngineOn] = useState(readPref);
  const { engine } = useStockfishEngine(engineOn);

  const toggle = (on: boolean) => {
    setEngineOn(on);
    try { localStorage.setItem(PREF_KEY, on ? '1' : '0'); } catch { /* хранилище недоступно */ }
  };

  return (
    <AnalysisBoard
      startFen={puzzle.fen}
      moves={puzzle.moves}
      initialPly={initialPly}
      orientation={orientation}
      engine={engine}
      engineOn={engineOn}
      onToggleEngine={toggle}
      {...layout}
    />
  );
};
