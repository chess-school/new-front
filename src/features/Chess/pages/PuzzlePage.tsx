import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Square } from 'chess.js';
import { Typography, Box, Paper, Button, Stack, Link, Chip, Skeleton } from '@mui/material';
import ExtensionRoundedIcon from '@mui/icons-material/ExtensionRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import LightbulbRoundedIcon from '@mui/icons-material/LightbulbRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getRandomPuzzle } from '@/api/puzzles';
import { IPuzzle, PUZZLE_SOURCES, PuzzleSourceFilter } from '@/types/Puzzles';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import { ChessBoard } from '../components/ChessBoard';
import { PuzzleAnalysis } from '../components/PuzzleAnalysis';
import { PuzzleSourcePicker } from '../components/PuzzleSourcePicker';
import { ChessArena, ArenaPanel } from '../components/ChessArena';
import { StatusBadge } from '../components/RunStats';
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { AskInChatButton } from '@/features/Chat';
import { useAuth } from '@/context/AuthContext';

// Рейтинговое окно для задач Lichess (как и раньше); на книжные задачи окно не действует
const LICHESS_RATING = { minRating: 1200, maxRating: 1400 };

/** Тема Lichess/книги ('backRankMate', 'mateIn2') -> 'Back rank mate', 'Mate in 2' */
// Служебные метки книжных задач: сторона хода и источник и так видны на странице
const META_THEMES = new Set(['whiteToMove', 'blackToMove', 'fromBook']);

const humanizeTheme = (theme: string) => {
  const words = theme.replace(/([a-z])([A-Z0-9])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export const PuzzlePage: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const bookId = searchParams.get('bookId') ?? undefined;
    // Задачи конкретной книги — всегда «из книг» (иначе подставилось бы рейтинговое окно Lichess)
    const source: PuzzleSourceFilter = bookId
        ? 'book'
        : (PUZZLE_SOURCES as string[]).includes(searchParams.get('source') ?? '') ? searchParams.get('source') as PuzzleSourceFilter : 'lichess';
    // Рейтинговое окно задач Lichess тоже в URL: ссылкой можно задать нужную сложность
    const minRating = Number(searchParams.get('minRating')) || undefined;
    const maxRating = Number(searchParams.get('maxRating')) || undefined;

    const [puzzle, setPuzzle] = useState<IPuzzle | null>(null);
    const [loading, setLoading] = useState(true);
    const [empty, setEmpty] = useState(false);
    const [wrongFlash, setWrongFlash] = useState(false);
    const [hintShown, setHintShown] = useState(false);
    const lastId = useRef<string | undefined>();
    const session = usePuzzleSession(puzzle);
    const { user } = useAuth();
    const isStaff = !!user?.roles?.some((role) => role === 'COACH' || role === 'ADMIN');

    const loadRandomPuzzle = useCallback(async () => {
        setLoading(true);
        setEmpty(false);
        try {
            // Для Lichess — окно сложности из URL, иначе прежние значения по умолчанию
            const rating = source === 'lichess'
                ? { minRating: minRating ?? LICHESS_RATING.minRating, maxRating: maxRating ?? LICHESS_RATING.maxRating }
                : {};
            const next = await getRandomPuzzle({ source, bookId, exclude: lastId.current, ...rating });
            lastId.current = next._id;
            setHintShown(false);
            setWrongFlash(false);
            setPuzzle(next);
        } catch (error) {
            setPuzzle(null);
            if ((error as AxiosError).response?.status === 404) setEmpty(true);
            else notification.error({ message: t('puzzles.loadError'), description: undefined });
        } finally {
            setLoading(false);
        }
    }, [source, bookId, minRating, maxRating, t]);

    useEffect(() => {
        lastId.current = undefined;
        loadRandomPuzzle();
    }, [loadRandomPuzzle]);

    useEffect(() => {
        if (session.status === 'solved') notification.success({ message: t('puzzles.solved'), description: undefined, duration: 2 });
    }, [session.status, t]);

    const onMove = (from: Square, to: Square, promotion?: string): boolean => {
        const verdict = session.tryMove(from, to, promotion);
        setWrongFlash(verdict === 'wrong');
        if (verdict === 'correct') setHintShown(false);
        return verdict === 'correct';
    };

    const changeSource = (value: PuzzleSourceFilter) => {
        if (value === source) return;
        setSearchParams(value === 'lichess' ? {} : { source: value }, { replace: true });
    };

    const orientation = session.playerColor === 'w' ? 'white' : 'black';
    const finished = session.status === 'solved' || session.status === 'failed';
    const bookSource = puzzle?.source.kind === 'book' ? puzzle.source : null;
    const statusText = loading
        ? t('puzzles.loading')
        : empty ? t('puzzles.noneForFilter')
        : session.status === 'solved' ? t('puzzles.solved')
        : session.status === 'failed' ? t('puzzles.solutionShown')
        : wrongFlash ? t('puzzles.wrongMove')
        : session.status === 'opponent' ? t('puzzles.correct')
        : session.index === 0 || (puzzle?.startsWithOpponentMove && session.index === 1)
            ? t(session.playerColor === 'w' ? 'puzzles.whiteToMove' : 'puzzles.blackToMove')
            : t('puzzles.yourTurn');
    const statusTone = !loading && (session.status === 'solved' || (session.status === 'opponent' && !wrongFlash)) ? 'emerald'
        : !loading && (wrongFlash || session.status === 'failed') ? 'red' : 'neutral';
    const statusIcon = statusTone === 'emerald' ? <CheckCircleRoundedIcon />
        : statusTone === 'red' ? <CancelRoundedIcon />
        : <Box component="span" sx={{ width: 14, height: 14, borderRadius: '50%', border: 2, borderColor: 'text.secondary', bgcolor: session.playerColor === 'w' ? tokens.evalBar.white : tokens.evalBar.black }} />;
    const status = <StatusBadge tone={statusTone} icon={statusIcon} testId="puzzle-status">{statusText}</StatusBadge>;

    // Подсказка: поле фигуры, которой нужно ходить
    const expected = puzzle && session.status === 'playing' ? session.solutionLine[session.index] : undefined;
    const hintSquares = useMemo(
        () => (hintShown && expected
            ? { [expected.slice(0, 2)]: { boxShadow: `inset 0 0 0 4px ${tokens.accent.emerald}`, backgroundColor: tokens.accent.emeraldSoft } }
            : undefined),
        [hintShown, expected],
    );
    const lastPlayed = session.played[session.played.length - 1];
    const lastMove = lastPlayed ? { from: lastPlayed.slice(0, 2), to: lastPlayed.slice(2, 4) } : null;

    const info = puzzle && (
        <Stack spacing={1.5}>
            {bookSource ? (
                <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>{bookSource.bookTitle}</Typography>
                    <Typography variant="h6">{bookSource.title}</Typography>
                    <Link component={RouterLink} to={`/books/${bookSource.book}/solve`} sx={{ fontWeight: 600 }}>{t('puzzles.openBook')}</Link>
                </Box>
            ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography color="text.secondary">{t('puzzles.ratingLabel')}</Typography>
                    <Chip label={puzzle.rating} size="small" sx={{ fontFamily: tokens.font.mono, fontWeight: 700, bgcolor: tokens.accent.goldSoft, color: 'primary.main' }} />
                </Stack>
            )}
            {puzzle.themes?.some((th) => !META_THEMES.has(th)) && (
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
                    {puzzle.themes.filter((th) => !META_THEMES.has(th)).slice(0, 8).map((theme) => <Chip key={theme} size="small" variant="outlined" label={t(`puzzleThemes.${theme}`, humanizeTheme(theme))} />)}
                </Stack>
            )}
        </Stack>
    );

    const panels: ArenaPanel[] = [
        // Вкладка есть всегда (и во время загрузки): арена запоминает первую вкладку при монтировании
        { key: 'puzzle', label: t('puzzles.tabs.puzzle', 'Puzzle'), icon: <ExtensionRoundedIcon />, content: info || <Skeleton height={56} /> },
        { key: 'source', label: t('puzzles.tabs.source', 'Source'), icon: <TuneRoundedIcon />, content: <PuzzleSourcePicker value={source} onChange={changeSource} fullWidth /> },
    ];

    const newPuzzleButton = (
        <Button variant="contained" size="large" fullWidth onClick={loadRandomPuzzle} disabled={loading} endIcon={<SkipNextRoundedIcon />}>
            {t('puzzles.newPuzzle')}
        </Button>
    );

    const header = (
        <PageHeader dense
            eyebrow={t('nav.groups.training', 'Training')}
            title={t('puzzles.title')}
            subtitle={t('puzzles.subtitle', 'Find the best move. After every puzzle, review it with the engine.')}
        />
    );

    if (!puzzle && !loading) {
        return (
            <PageContainer dense>
                {header}
                <Paper sx={{ p: { xs: 3, md: 5 }, maxWidth: 560, mx: 'auto' }}>
                    {status}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}><PuzzleSourcePicker value={source} onChange={changeSource} /></Box>
                    {!empty && <Box sx={{ mt: 3 }}>{newPuzzleButton}</Box>}
                </Paper>
            </PageContainer>
        );
    }

    return (
        <PageContainer dense>
            {header}
            {puzzle && finished ? (
                // После решения или сдачи — разбор с полной линией решения
                <PuzzleAnalysis
                    key={puzzle._id}
                    puzzle={puzzle}
                    initialPly={session.status === 'solved' ? puzzle.moves.length : session.played.length}
                    orientation={orientation}
                    variant="arena"
                    header={status}
                    extraPanels={panels}
                    extraControls={newPuzzleButton}
                />
            ) : (
                <ChessArena
                    orientation={orientation}
                    board={puzzle
                        ? <ChessBoard fen={session.fen} onMove={onMove} boardOrientation={orientation} customSquareStyles={hintSquares} lastMove={lastMove} premoves premoveKey={puzzle?._id} />
                        : <Skeleton variant="rounded" sx={{ width: '100%', height: '100%', borderRadius: '10px' }} />}
                    header={status}
                    panels={panels}
                    controls={(
                        <Stack spacing={1}>
                            <Stack direction="row" spacing={1}>
                                <Button variant="outlined" color="inherit" fullWidth startIcon={<LightbulbRoundedIcon />}
                                    onClick={() => setHintShown(true)} disabled={!expected || hintShown}>
                                    {t('puzzles.hint', 'Hint')}
                                </Button>
                                <Button variant="outlined" color="inherit" fullWidth startIcon={<VisibilityRoundedIcon />}
                                    onClick={session.giveUp} disabled={session.status !== 'playing'}>
                                    {t('puzzles.showSolution')}
                                </Button>
                            </Stack>
                            {newPuzzleButton}
                            {/* Ученик может спросить тренера про эту задачу */}
                            {puzzle && !isStaff && (
                                <AskInChatButton size="small" sx={{ alignSelf: 'center' }}
                                    context={{ kind: 'puzzle', refId: puzzle._id, title: (bookSource ? `${bookSource.bookTitle} — ${bookSource.title}` : t('puzzles.chatTitle', { rating: puzzle.rating, defaultValue: 'Puzzle · {{rating}}' })).slice(0, 200) }} />
                            )}
                        </Stack>
                    )}
                />
            )}
        </PageContainer>
    );
};
