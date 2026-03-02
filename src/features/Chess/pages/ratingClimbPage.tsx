// src/pages/RatingClimbPage.tsx (ОНОВЛЕНА ВЕРСІЯ З ПОВНИМ ВИРІШЕННЯМ ЗАДАЧ)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { Container, Typography, Grid, Box, Paper, Stack, Button, Chip } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getRandomPuzzle } from '@/api/puzzles';
import { IPuzzle } from '@/types/Puzzles';
import { ChessBoard } from '../components/ChessBoard';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const GAME_DURATION_SECONDS = 180; // 3 хвилини
const STARTING_RATING = 800;

export const RatingClimbPage: React.FC = () => {
    const { t } = useTranslation();
    
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(GAME_DURATION_SECONDS);
    const [solvedCount, setSolvedCount] = useState<number>(0);
    const [currentRating, setCurrentRating] = useState<number>(STARTING_RATING);
    const [highestRating, setHighestRating] = useState<number>(0);

    const [puzzle, setPuzzle] = useState<IPuzzle | null>(null);
    const [fen, setFen] = useState<string>('start');
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [solutionIndex, setSolutionIndex] = useState<number>(0);
    const [isMoveBlocked, setIsMoveBlocked] = useState<boolean>(true);

    const game = useMemo(() => new Chess(), []);

    const startGame = () => {
        setIsGameActive(true);
        setTimer(GAME_DURATION_SECONDS);
        setSolvedCount(0);
        setCurrentRating(STARTING_RATING);
        setHighestRating(0);
        loadNextPuzzle(STARTING_RATING);
    };

    const endGame = useCallback(() => {
        setIsGameActive(false);
        notification.info({
            message: `${t('climb.gameOver')}`,
            description: `${t('climb.finalScore')}: ${highestRating}`
        });
    }, [highestRating, t]);

    const loadNextPuzzle = useCallback(async (ratingTarget: number) => {
        setIsMoveBlocked(true);
        try {
            const params = { minRating: ratingTarget - 50, maxRating: ratingTarget + 50 };
            const newPuzzle = await getRandomPuzzle(params);

            setPuzzle(newPuzzle);
            game.load(newPuzzle.fen);
            const opponentColor = game.turn();
            setOrientation(opponentColor === 'w' ? 'black' : 'white');
            setFen(newPuzzle.fen);

            setTimeout(() => {
                game.move(newPuzzle.moves[0]);
                setFen(game.fen());
                setSolutionIndex(1);
                setIsMoveBlocked(false);
            }, 300);

        } catch (error) {
            await loadNextPuzzle(ratingTarget - 100);
        }
    }, [game]);

    useEffect(() => {
        if (!isGameActive) return;
        if (timer <= 0) {
            endGame();
            return;
        }
        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isGameActive, timer, endGame]);

    // --- КЛЮЧОВЕ ОНОВЛЕННЯ: ПОВНІСТЮ НОВА ЛОГІКА ОБРОБКИ ХОДУ ---
    const handleMove = (sourceSquare: Square, targetSquare: Square): boolean => {
        if (!puzzle || isMoveBlocked || !isGameActive) return false;

        const playerMoveUci = `${sourceSquare}${targetSquare}`;
        const expectedMoveUci = puzzle.moves[solutionIndex];
        const isCorrect = expectedMoveUci.startsWith(playerMoveUci);

        if (isCorrect) {
            // Хід правильний, виконуємо його
            game.move(expectedMoveUci);
            setFen(game.fen());
            
            const nextIndex = solutionIndex + 1;

            if (nextIndex >= puzzle.moves.length) {
                // === ЗАДАЧУ ПОВНІСТЮ ВИРІШЕНО ===
                setIsMoveBlocked(true);
                setTimeout(() => {
                    setSolvedCount(prev => prev + 1);
                    if (puzzle.rating > highestRating) {
                        setHighestRating(puzzle.rating);
                    }
                    const newRating = currentRating + 50; // Підвищуємо рейтинг для наступної задачі
                    setCurrentRating(newRating);
                    loadNextPuzzle(newRating);
                }, 500);
            } else {
                // === ЗАДАЧА НЕ ЗАВЕРШЕНА, ХІД "СУПЕРНИКА" ===
                setIsMoveBlocked(true);
                setTimeout(() => {
                    const replyMove = puzzle.moves[nextIndex];
                    game.move(replyMove);
                    setFen(game.fen());
                    setSolutionIndex(nextIndex + 1);
                    setIsMoveBlocked(false);
                }, 300);
            }
        } else {
            // === ХІД НЕПРАВИЛЬНИЙ ===
            // Знижуємо рейтинг для наступної задачі і завантажуємо її
            const newRating = Math.max(800, currentRating - 100);
            setCurrentRating(newRating);
            loadNextPuzzle(newRating);
        }
        
        return isCorrect;
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold">{t('climb.title')}</Typography>
                </Box>
                
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<TimerIcon />} label={formatTime(timer)} color="primary" sx={{ fontSize: '1.2rem', p: 2 }} />
                    <Chip icon={<CheckCircleIcon />} label={`${t('climb.solved')}: ${solvedCount}`} color="success" sx={{ fontSize: '1.2rem', p: 2 }} />
                    <Chip icon={<EmojiEventsIcon />} label={`${t('climb.highestRating')}: ${highestRating}`} color="warning" sx={{ fontSize: '1.2rem', p: 2 }} />
                </Stack>

                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} sm={8} md={7}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, aspectRatio: '1 / 1', position: 'relative' }}>
                            {isGameActive && puzzle ? (
                                <ChessBoard
                                    fen={fen}
                                    onPieceDrop={handleMove}
                                    boardOrientation={orientation}
                                    onSquareClick={() => {}}
                                />
                            ) : (
                                <Stack justifyContent="center" alignItems="center" height="100%">
                                    {timer <= 0 && solvedCount > 0 ? (
                                        <Box textAlign="center">
                                            <Typography variant="h4">{t('climb.gameOver')}</Typography>
                                            <Typography variant="h5" sx={{mt: 1}}>{t('climb.finalScore')}: {highestRating}</Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="h5" sx={{textAlign: 'center'}}>{t('climb.description')}</Typography>
                                    )}
                                    <Button variant="contained" size="large" onClick={startGame} sx={{ mt: 3 }}>
                                        {timer <= 0 && solvedCount > 0 ? t('climb.playAgain') : t('climb.start')}
                                    </Button>
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};