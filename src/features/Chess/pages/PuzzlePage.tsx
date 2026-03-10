// src/pages/PuzzlePage.tsx (СПРОЩЕНА ВЕРСІЯ)

import React, { useState, useEffect, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { Container, Typography, Grid, Box, Paper, Button } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getRandomPuzzle } from '@/api/puzzles';
import { IPuzzle } from '@/types/Puzzles';
// Тепер ми імпортуємо наш новий, "розумний" компонент
import { ChessBoard } from '../components/ChessBoard';

export const PuzzlePage: React.FC = () => {
    const { t } = useTranslation();
    
    // Стани fromSquare та optionSquares були видалені звідси!
    const [puzzle, setPuzzle] = useState<IPuzzle | null>(null);
    const [fen, setFen] = useState<string>('start');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [isPuzzleSolved, setIsPuzzleSolved] = useState<boolean>(false);
    const [solutionIndex, setSolutionIndex] = useState<number>(0);
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');

    const game = useMemo(() => new Chess(), []);

    const loadRandomPuzzle = async () => {
        // ... логіка завантаження залишається без змін ...
        try {
            setStatusMessage(t('puzzles.loading'));
            setIsPuzzleSolved(false);

            const newPuzzle = await getRandomPuzzle({ minRating: 1200, maxRating: 1400 });
            setPuzzle(newPuzzle);
            
            game.load(newPuzzle.fen);
            const opponentColor = game.turn();
            setOrientation(opponentColor === 'w' ? 'black' : 'white');

            setFen(newPuzzle.fen);

            setTimeout(() => {
                game.move(newPuzzle.moves[0]);
                setFen(game.fen());
                setSolutionIndex(1);
                setStatusMessage(t('puzzles.yourTurn'));
            }, 500);

        } catch (error) {
            notification.error({ message: t('puzzles.loadError'), description: undefined });
            setStatusMessage(t('puzzles.loadError'));
        }
    };

    useEffect(() => {
        loadRandomPuzzle();
    }, []);

    // Функція handleMove тепер називається onMove і передається в ChessBoard
    const onMove = (sourceSquare: Square, targetSquare: Square): boolean => {
        // Логіка гри залишається тут, на сторінці
        if (!puzzle || isPuzzleSolved || solutionIndex === 0) return false;

        const playerMoveUci = `${sourceSquare}${targetSquare}`;
        const expectedMoveUci = puzzle.moves[solutionIndex];
        const isCorrect = expectedMoveUci.startsWith(playerMoveUci);

        if (isCorrect) {
            game.move(expectedMoveUci);
            setFen(game.fen());
            
            const nextIndex = solutionIndex + 1;
            if (nextIndex >= puzzle.moves.length) {
                setIsPuzzleSolved(true);
                setStatusMessage(t('puzzles.solved'));
                notification.success({ message: t('puzzles.solved'), description: undefined });
            } else {
                setStatusMessage(t('puzzles.correct'));
                setTimeout(() => {
                    const replyMove = puzzle.moves[nextIndex];
                    game.move(replyMove);
                    setFen(game.fen());
                    setSolutionIndex(nextIndex + 1);
                    setStatusMessage(t('puzzles.yourTurn'));
                }, 500);
            }
        } else {
            setStatusMessage(t('puzzles.wrongMove'));
        }

        return isCorrect; // Повертаємо результат, щоб дошка знала, чи повертати фігуру
    };

    if (!puzzle) {
        return <Typography>{t('puzzles.loading')}</Typography>;
    }

    return (
        <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold">{t('puzzles.title')}</Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>{t('puzzles.ratingLabel')} {puzzle.rating}</Typography>
                </Box>
                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} sm={8} md={7}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, aspectRatio: '1 / 1' }}>
                            <ChessBoard
                                fen={fen}
                                // Перейменовуємо пропс і передаємо нашу функцію
                                onMove={onMove}
                                boardOrientation={orientation}
                                // squareStyles тепер не потрібен, ним керує ChessBoard
                            />
                        </Paper>
                    </Grid>
                </Grid>
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="h5" sx={{ height: '32px' }}>{statusMessage}</Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={loadRandomPuzzle} 
                        sx={{ mt: 2 }}
                    >
                        {t('puzzles.newPuzzle')}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};