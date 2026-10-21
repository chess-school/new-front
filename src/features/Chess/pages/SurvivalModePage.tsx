// «Выживание»: решать задачи подряд, пока не ошибёшься или не кончится время

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Square } from 'chess.js';
import { Box, LinearProgress, Alert } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { IPuzzle, PuzzleSourceFilter } from '@/types/Puzzles';
import { ChessBoard } from '../components/ChessBoard';
import { PuzzleRunReview, RunAttempt } from '../components/PuzzleRunReview';
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { fetchPuzzleForRun } from '../utils/fetchPuzzle';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { ChessArena } from '../components/ChessArena';
import { RunStat, RunStats } from '../components/RunStats';
import { RunStartCard } from '../components/RunStartCard';

const INITIAL_TIME_PER_PUZZLE = 20;
const CORRECT_PUZZLE_BONUS = 2; // Бонус дається за всю задачу
const STARTING_RATING = 800;
const RATING_WINDOW = 100;
const NEXT_PUZZLE_DELAY_MS = 500;

export const SurvivalModePage: React.FC = () => {
    const { t } = useTranslation();

    const [source, setSource] = useState<PuzzleSourceFilter>('lichess');
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(INITIAL_TIME_PER_PUZZLE);
    const [solvedCount, setSolvedCount] = useState<number>(0);
    const [currentRating, setCurrentRating] = useState<number>(STARTING_RATING);
    const [puzzle, setPuzzle] = useState<IPuzzle | null>(null);
    const [attempts, setAttempts] = useState<RunAttempt[]>([]);
    const [noPuzzles, setNoPuzzles] = useState(false);
    const [finished, setFinished] = useState(false);
    const session = usePuzzleSession(puzzle, { opponentDelayMs: 300 });
    const recorded = useRef<string | null>(null);
    const nextTimer = useRef<ReturnType<typeof setTimeout>>();

    const loadNextPuzzle = useCallback(async (ratingTarget: number, exclude?: string) => {
        try {
            const next = await fetchPuzzleForRun(source, ratingTarget, RATING_WINDOW, exclude);
            if (!next) {
                setNoPuzzles(true);
                setIsGameActive(false);
                return;
            }
            recorded.current = null;
            setPuzzle(next);
        } catch {
            notification.error({ message: t('puzzles.loadError'), description: undefined });
            setIsGameActive(false);
        }
    }, [source, t]);

    const startGame = () => {
        clearTimeout(nextTimer.current);
        setIsGameActive(true);
        setFinished(false);
        setNoPuzzles(false);
        setTimer(INITIAL_TIME_PER_PUZZLE);
        setSolvedCount(0);
        setCurrentRating(STARTING_RATING);
        setAttempts([]);
        setPuzzle(null);
        loadNextPuzzle(STARTING_RATING);
    };

    const record = useCallback((solved: boolean) => {
        if (!puzzle || recorded.current === puzzle._id) return false;
        recorded.current = puzzle._id;
        setAttempts((a) => [...a, { puzzle, solved, playedPlies: solved ? puzzle.moves.length : session.played.length }]);
        return true;
    }, [puzzle, session.played.length]);

    const endGame = useCallback(() => {
        clearTimeout(nextTimer.current);
        record(false); // задача, на которой забег закончился, — в разбор как нерешённая
        setIsGameActive(false);
        setFinished(true);
        notification.info({ message: t('survival.gameOver'), description: `${t('survival.finalScore')}: ${solvedCount}` });
    }, [record, solvedCount, t]);

    useEffect(() => {
        if (!isGameActive) return;
        if (timer <= 0) {
            endGame();
            return;
        }
        const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isGameActive, timer, endGame]);

    useEffect(() => () => clearTimeout(nextTimer.current), []);

    // Задача решена — бонус времени и задача посложнее
    useEffect(() => {
        if (!isGameActive || session.status !== 'solved' || !puzzle) return;
        if (!record(true)) return;
        setSolvedCount((c) => c + 1);
        setTimer(INITIAL_TIME_PER_PUZZLE + CORRECT_PUZZLE_BONUS);
        const newRating = currentRating + 25;
        setCurrentRating(newRating);
        nextTimer.current = setTimeout(() => loadNextPuzzle(newRating, puzzle._id), NEXT_PUZZLE_DELAY_MS);
    // currentRating читается на момент решения; повторный запуск отсекает recorded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.status, isGameActive, puzzle]);

    const handleMove = (sourceSquare: Square, targetSquare: Square, promotion?: string): boolean => {
        if (!isGameActive) return false;
        const verdict = session.tryMove(sourceSquare, targetSquare, promotion);
        if (verdict === 'wrong') endGame(); // одна ошибка — конец забега
        return verdict === 'correct';
    };

    const timerProgress = (timer / (INITIAL_TIME_PER_PUZZLE + CORRECT_PUZZLE_BONUS)) * 100;
    const stats: RunStat[] = [
        { key: 'time', label: t('survival.timeLeft'), value: `${timer}s`, icon: <TimerRoundedIcon />, tone: timer <= 5 && isGameActive ? 'red' : 'gold' },
        { key: 'solved', label: t('survival.solved'), value: solvedCount, icon: <CheckCircleRoundedIcon />, tone: 'emerald' },
        { key: 'rating', label: t('survival.rating', 'Rating'), value: currentRating, icon: <TrendingUpRoundedIcon />, tone: 'blue' },
    ];

    return (
        <PageContainer dense>
            <PageHeader dense eyebrow={t('nav.groups.training', 'Training')} title={t('survival.title')} subtitle={t('survival.description')} />
            {noPuzzles && <Alert severity="warning" sx={{ mb: 2 }}>{t('puzzles.noneForFilter')}</Alert>}

            {isGameActive && puzzle ? (
                <ChessArena
                    orientation={session.playerColor === 'w' ? 'white' : 'black'}
                    board={<ChessBoard fen={session.fen} onMove={handleMove} boardOrientation={session.playerColor === 'w' ? 'white' : 'black'} premoves premoveKey={puzzle?._id} />}
                    header={(
                        <Box>
                            <RunStats stats={stats} />
                            <LinearProgress variant="determinate" value={Math.min(100, timerProgress)} color={timer <= 5 ? 'error' : 'primary'} sx={{ mt: 1.5 }} />
                        </Box>
                    )}
                />
            ) : (
                <RunStartCard
                    icon={<FavoriteRoundedIcon />}
                    title={finished ? t('survival.gameOver') : t('survival.title')}
                    description={finished ? `${t('survival.finalScore')}: ${solvedCount}` : t('survival.description')}
                    stats={finished ? <RunStats stats={stats} /> : null}
                    source={source}
                    onSourceChange={setSource}
                    startLabel={finished ? t('survival.playAgain') : t('survival.start')}
                    onStart={startGame}
                    starting={isGameActive}
                />
            )}

            {/* Разбор после забега: движок во время игры не доступен, после — по каждой задаче */}
            {!isGameActive && <PuzzleRunReview attempts={attempts} />}
        </PageContainer>
    );
};
