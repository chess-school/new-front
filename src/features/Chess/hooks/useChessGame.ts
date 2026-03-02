// src/features/Chess/hooks/useChessGame.ts (ФІНАЛЬНА СПРОЩЕНА ВЕРСІЯ)

import { useState, useMemo, useCallback } from 'react';
import { Square } from 'chess.js';
import ChessGameEngine from '../engine/ChessGameEngine';

export const useChessGame = (initialFen?: string) => {
    const engine = useMemo(() => new ChessGameEngine(initialFen), [initialFen]);

    // Основні стани гри
    const [fen, setFen] = useState(engine.getFen());
    const [history, setHistory] = useState<string[]>(engine.getHistory());
    const [currentMoveIndex, setCurrentMoveIndex] = useState(history.length);

    // Логіка візуалізації (виділення, підсвічування) більше не потрібна в цьому хуку.
    // Нею повністю керує "розумний" компонент ChessBoard.

    const updateGameState = useCallback(() => {
        setFen(engine.getFen());
        const newHistory = engine.getHistory();
        setHistory(newHistory);
        setCurrentMoveIndex(newHistory.length);
    }, [engine]);
    
    // Оновлюємо handleMove, щоб вона приймала і передавала `promotionPiece`
    const handleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotionPiece?: string): boolean => {
        const moveSuccessful = engine.handleMove(sourceSquare, targetSquare, promotionPiece);
        if (moveSuccessful) {
            updateGameState();
            return true;
        }
        return false;
    }, [engine, updateGameState]);

    const resetGame = useCallback(() => {
        engine.resetGame();
        updateGameState();
    }, [engine, updateGameState]);

    const loadPgn = useCallback((pgn: string): boolean => {
        const success = engine.loadPgn(pgn.trim());
        if (success) {
            updateGameState();
        }
        return success;
    }, [engine, updateGameState]);

    const goToMove = useCallback((moveIndex: number) => {
        engine.goToMove(moveIndex);
        setFen(engine.getFen());
        setCurrentMoveIndex(moveIndex);
    }, [engine]);

    return {
        fen,
        history,
        currentMoveIndex,
        actions: {
            handleMove,
            resetGame,
            loadPgn,
            goToMove,
        }
    };
};