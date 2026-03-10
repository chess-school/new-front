// src/pages/SurvivalModePage.tsx (ОНОВЛЕНА ВЕРСІЯ З ПОВНИМ ВИРІШЕННЯМ ЗАДАЧ)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import { Container, Typography, Grid, Box, Paper, Stack, Button, Chip, LinearProgress } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getRandomPuzzle } from '@/api/puzzles';
import { IPuzzle } from '@/types/Puzzles';
import { ChessBoard } from '../components/ChessBoard';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const INITIAL_TIME_PER_PUZZLE = 20;
const CORRECT_PUZZLE_BONUS = 2; // Бонус дається за всю задачу
const STARTING_RATING = 800;

export const SurvivalModePage: React.FC = () => {
    const { t } = useTranslation();
    
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(INITIAL_TIME_PER_PUZZLE);
    const [solvedCount, setSolvedCount] = useState<number>(0);
    const [currentRating, setCurrentRating] = useState<number>(STARTING_RATING);

    const [puzzle, setPuzzle] = useState<IPuzzle | null>(null);
    const [fen, setFen] = useState<string>('start');
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');
    const [solutionIndex, setSolutionIndex] = useState<number>(0);
    const [isMoveBlocked, setIsMoveBlocked] = useState<boolean>(true);

    const game = useMemo(() => new Chess(), []);

    const startGame = () => {
        setIsGameActive(true);
        setTimer(INITIAL_TIME_PER_PUZZLE);
        setSolvedCount(0);
        setCurrentRating(STARTING_RATING);
        loadNextPuzzle(STARTING_RATING);
    };

    const endGame = useCallback(() => {
        setIsGameActive(false);
        notification.info({ 
            message: t('survival.gameOver'), 
            description: `${t('survival.finalScore')}: ${solvedCount}` 
        });
    }, [solvedCount, t]);

    const loadNextPuzzle = useCallback(async (ratingTarget: number) => {
        setIsMoveBlocked(true);
        try {
            const params = { minRating: ratingTarget - 100, maxRating: ratingTarget + 100 };
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
            await loadNextPuzzle(ratingTarget);
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
                setIsMoveBlocked(true); // Блокуємо ходи, поки завантажується нова задача
                // Невелика затримка, щоб гравець побачив останній хід
                setTimeout(() => {
                    const newSolvedCount = solvedCount + 1;
                    setSolvedCount(newSolvedCount);
                    setTimer(INITIAL_TIME_PER_PUZZLE + CORRECT_PUZZLE_BONUS);
                    const newRating = currentRating + 25;
                    setCurrentRating(newRating);
                    loadNextPuzzle(newRating);
                }, 500); // 0.5 секунди
            } else {
                // === ЗАДАЧА НЕ ЗАВЕРШЕНА, ХІД "СУПЕРНИКА" ===
                setIsMoveBlocked(true); // Блокуємо ходи на час ходу "суперника"
                setTimeout(() => {
                    const replyMove = puzzle.moves[nextIndex];
                    game.move(replyMove);
                    setFen(game.fen());
                    setSolutionIndex(nextIndex + 1); // Готуємось до наступного ходу гравця
                    setIsMoveBlocked(false); // Розблоковуємо для гравця
                }, 300);
            }
        } else {
            // === ХІД НЕПРАВИЛЬНИЙ ===
            endGame();
        }
        
        return isCorrect;
    };
    
    const timerProgress = (timer / (INITIAL_TIME_PER_PUZZLE + CORRECT_PUZZLE_BONUS)) * 100;

    return (
        <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
            <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold">{t('survival.title')}</Typography>
                </Box>
                
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<TimerIcon />} label={`${t('survival.timeLeft')}: ${timer}s`} color="primary" sx={{ fontSize: '1.2rem', p: 2 }} />
                    <Chip icon={<CheckCircleIcon />} label={`${t('survival.solved')}: ${solvedCount}`} color="success" sx={{ fontSize: '1.2rem', p: 2 }} />
                </Stack>

                <Grid container spacing={4} justifyContent="center">
                    <Grid item xs={12} sm={8} md={7}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, aspectRatio: '1 / 1', position: 'relative' }}>
                            {isGameActive && puzzle ? (
                                <>
<ChessBoard
                                    fen={fen}
                                    onMove={handleMove}
                                    boardOrientation={orientation}
                                />
                                    <LinearProgress variant="determinate" value={timerProgress} color="primary" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px' }}/>
                                </>
                            ) : (
                                <Stack justifyContent="center" alignItems="center" height="100%">
                                    {solvedCount > 0 ? (
                                        <Box textAlign="center">
                                            <Typography variant="h4">{t('survival.gameOver')}</Typography>
                                            <Typography variant="h5" sx={{mt: 1}}>{t('survival.finalScore')}: {solvedCount}</Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="h5" sx={{textAlign: 'center'}}>{t('survival.description')}</Typography>
                                    )}
                                    <Button variant="contained" size="large" onClick={startGame} sx={{ mt: 3 }}>
                                        {solvedCount > 0 ? t('survival.playAgain') : t('survival.start')}
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