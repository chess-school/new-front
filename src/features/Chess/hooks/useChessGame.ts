// src/features/Chess/hooks/useChessGame.ts

import { useState, useMemo, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import ChessGameEngine from '../engine/ChessGameEngine';

export const useChessGame = (initialFen?: string) => {
    const engine = useMemo(() => new ChessGameEngine(initialFen), [initialFen]);

    const [fen, setFen] = useState(engine.getFen());
    const [history, setHistory] = useState<string[]>(engine.getHistory());
    const [currentMoveIndex, setCurrentMoveIndex] = useState(history.length);

    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [moveOptions, setMoveOptions] = useState<{ [key: string]: React.CSSProperties }>({});

    const fenRef = useRef(fen);
    fenRef.current = fen;

    const updateGameState = useCallback(() => {
        setFen(engine.getFen());
        const newHistory = engine.getHistory();
        setHistory(newHistory);
        setCurrentMoveIndex(newHistory.length);
    }, [engine]);

    const clearHighlights = useCallback(() => {
        setSelectedSquare(null);
        setMoveOptions({});
    }, []);

    const handleMove = useCallback((sourceSquare: Square, targetSquare: Square) => {
        const moveSuccessful = engine.handleMove(sourceSquare, targetSquare);
        if (moveSuccessful) {
            updateGameState();
            clearHighlights();
            return true;
        }
        return false;
    }, [engine, updateGameState, clearHighlights]);

    const onSquareClick = useCallback((square: Square) => {
        if (square === selectedSquare) {
            clearHighlights();
            return;
        }

        const moves = engine.getMovesForSquare(square);
        if (moves.length === 0) {
            clearHighlights();
            return;
        }

        const newOptions: { [key: string]: React.CSSProperties } = {};
        moves.forEach(move => {
            newOptions[move.to] = {
                background: move.flags.includes('c') 
                    ? 'radial-gradient(circle, rgba(0,0,0,0) 85%, rgba(0,0,0,0.2) 85%)'
                    : 'radial-gradient(circle, rgba(0,0,0,0.2) 25%, transparent 30%)',
                borderRadius: '50%',
            };
        });

        setMoveOptions(newOptions);
        setSelectedSquare(square);
    }, [engine, selectedSquare, clearHighlights]);

    const resetGame = useCallback(() => {
        engine.resetGame();
        updateGameState();
        clearHighlights();
    }, [engine, updateGameState, clearHighlights]);

    const loadPgn = useCallback((pgn: string): boolean => {
        const success = engine.loadPgn(pgn.trim());
        if (success) {
            updateGameState();
            clearHighlights();
        }
        return success;
    }, [engine, updateGameState, clearHighlights]);

    const goToMove = useCallback((moveIndex: number) => {
        engine.goToMove(moveIndex);
        setFen(engine.getFen());
        setCurrentMoveIndex(moveIndex);
        clearHighlights();
    }, [engine, clearHighlights]);


    return {
        fen,
        history,
        currentMoveIndex,
        moveOptions,
        actions: {
            handleMove,
            onSquareClick,
            resetGame,
            loadPgn,
            goToMove,
        }
    };
};