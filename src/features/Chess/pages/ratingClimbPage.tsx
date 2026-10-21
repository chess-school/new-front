// «Рейтинг»: за 3 минуты решить как можно более сложные задачи

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Square } from 'chess.js';
import { Alert, LinearProgress, Box } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { IPuzzle, PuzzleSourceFilter } from '@/types/Puzzles';
import { ChessBoard } from '../components/ChessBoard';
import { PuzzleRunReview, RunAttempt } from '../components/PuzzleRunReview';
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { fetchPuzzleForRun } from '../utils/fetchPuzzle';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { ChessArena } from '../components/ChessArena';
import { RunStat, RunStats } from '../components/RunStats';
import { RunStartCard } from '../components/RunStartCard';

const GAME_DURATION_SECONDS = 180; // 3 хвилини
const STARTING_RATING = 800;
const RATING_WINDOW = 50;
const NEXT_PUZZLE_DELAY_MS = 500;

export const RatingClimbPage: React.FC = () => {
    const { t } = useTranslation();

    const [source, setSource] = useState<PuzzleSourceFilter>('lichess');
    const [isGameActive, setIsGameActive] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(GAME_DURATION_SECONDS);
    const [solvedCount, setSolvedCount] = useState<number>(0);
    const [currentRating, setCurrentRating] = useState<number>(STARTING_RATING);
    const [highestRating, setHighestRating] = useState<number>(0);
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
        setTimer(GAME_DURATION_SECONDS);
        setSolvedCount(0);
        setCurrentRating(STARTING_RATING);
        setHighestRating(0);
        setAttempts([]);
        setPuzzle(null);
        loadNextPuzzle(STARTING_RATING);
    };

    const endGame = useCallback(() => {
        clearTimeout(nextTimer.current);
        setIsGameActive(false);
        setFinished(true);
        notification.info({ message: `${t('climb.gameOver')}`, description: `${t('climb.finalScore')}: ${highestRating}` });
    }, [highestRating, t]);

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

    const record = (solved: boolean) => {
        if (!puzzle || recorded.current === puzzle._id) return false;
        recorded.current = puzzle._id;
        setAttempts((a) => [...a, { puzzle, solved, playedPlies: solved ? puzzle.moves.length : session.played.length }]);
        return true;
    };

    // Задача решена — рейтинг следующей выше
    useEffect(() => {
        if (!isGameActive || session.status !== 'solved' || !puzzle) return;
        if (!record(true)) return;
        setSolvedCount((c) => c + 1);
        setHighestRating((h) => Math.max(h, puzzle.rating));
        const newRating = currentRating + 50;
        setCurrentRating(newRating);
        nextTimer.current = setTimeout(() => loadNextPuzzle(newRating, puzzle._id), NEXT_PUZZLE_DELAY_MS);
    // record/currentRating читаются на момент решения; повторный запуск отсекает recorded
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.status, isGameActive, puzzle]);

    const handleMove = (sourceSquare: Square, targetSquare: Square, promotion?: string): boolean => {
        if (!isGameActive) return false;
        const verdict = session.tryMove(sourceSquare, targetSquare, promotion);
        if (verdict === 'wrong' && puzzle && record(false)) {
            // Ошибка: задача не засчитана, следующая — проще
            const newRating = Math.max(STARTING_RATING, currentRating - 100);
            setCurrentRating(newRating);
            loadNextPuzzle(newRating, puzzle._id);
        }
        return verdict === 'correct';
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const stats: RunStat[] = [
        { key: 'time', label: t('climb.timeLeft', 'Time'), value: formatTime(timer), icon: <TimerRoundedIcon />, tone: timer <= 15 && isGameActive ? 'red' : 'gold' },
        { key: 'solved', label: t('climb.solved'), value: solvedCount, icon: <CheckCircleRoundedIcon />, tone: 'emerald' },
        { key: 'highest', label: t('climb.highestRating'), value: highestRating, icon: <EmojiEventsRoundedIcon />, tone: 'blue' },
    ];

    return (
        <PageContainer dense>
            <PageHeader dense eyebrow={t('nav.groups.training', 'Training')} title={t('climb.title')} subtitle={t('climb.description')} />
            {noPuzzles && <Alert severity="warning" sx={{ mb: 2 }}>{t('puzzles.noneForFilter')}</Alert>}

            {isGameActive && puzzle ? (
                <ChessArena
                    orientation={session.playerColor === 'w' ? 'white' : 'black'}
                    board={<ChessBoard fen={session.fen} onMove={handleMove} boardOrientation={session.playerColor === 'w' ? 'white' : 'black'} premoves premoveKey={puzzle?._id} />}
                    header={(
                        <Box>
                            <RunStats stats={stats} />
                            <LinearProgress variant="determinate" value={(timer / GAME_DURATION_SECONDS) * 100} color={timer <= 15 ? 'error' : 'primary'} sx={{ mt: 1.5 }} />
                        </Box>
                    )}
                />
            ) : (
                <RunStartCard
                    icon={<TrendingUpRoundedIcon />}
                    title={finished ? t('climb.gameOver') : t('climb.title')}
                    description={finished ? `${t('climb.finalScore')}: ${highestRating}` : t('climb.description')}
                    stats={finished ? <RunStats stats={stats} /> : null}
                    source={source}
                    onSourceChange={setSource}
                    startLabel={finished ? t('climb.playAgain') : t('climb.start')}
                    onStart={startGame}
                    starting={isGameActive}
                />
            )}

            {/* Разбор после забега: движок во время игры не доступен, после — по каждой задаче */}
            {!isGameActive && <PuzzleRunReview attempts={attempts} />}
        </PageContainer>
    );
};
