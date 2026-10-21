// База партий (/book): дебютная книга по текущей позиции и поиск партий игрока

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { AxiosError } from 'axios';
import { Typography, Box, Stack, TextField, Button, CircularProgress, IconButton, Chip, InputAdornment } from '@mui/material';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import PersonSearchRoundedIcon from '@mui/icons-material/PersonSearchRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

import { getOpeningBook, getPlayerGames } from '@/api/chessDB';
import { IOpeningBookData, IGame } from '@/types';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import { useChessGame } from '@/features/Chess/hooks/useChessGame';
import { ChessBoard } from '../components/ChessBoard';
import { ChessArena, ArenaPanel } from '../components/ChessArena';
import { OpeningMoveBar } from '@/features/Chess/components/OpeningMoveBar';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const DatabasePage: React.FC = () => {
    const { t } = useTranslation();
    const { fen, history, currentMoveIndex, actions: gameActions } = useChessGame(START_FEN);

    // Дебютная книга
    const [bookData, setBookData] = useState<IOpeningBookData | null>(null);
    const [isLoadingBook, setIsLoadingBook] = useState(true);

    // Поиск по игроку
    const [playerName, setPlayerName] = useState('Carlsen'); // Имя по умолчанию для примера
    const [playerGames, setPlayerGames] = useState<IGame[]>([]);
    const [isLoadingGames, setIsLoadingGames] = useState(false);

    // Книга перезагружается при каждом изменении позиции. Раньше запрос шёл на захардкоженный
    // http://localhost:3000 — теперь через общий API-клиент (VITE_API_URL)
    useEffect(() => {
        let cancelled = false;
        setIsLoadingBook(true);
        getOpeningBook(fen)
            .then((data) => { if (!cancelled) setBookData(data ?? { moves: [], total_games: 0 }); })
            .catch((error: AxiosError) => {
                if (cancelled) return;
                setBookData({ moves: [], total_games: 0 });
                // 404 — позиции нет в книге, это не ошибка
                if (error.response?.status !== 404) {
                    console.error('Failed to fetch opening book:', error);
                    notification.error({ message: t('database.bookError', 'Could not fetch opening book'), description: undefined });
                }
            })
            .finally(() => { if (!cancelled) setIsLoadingBook(false); });
        return () => { cancelled = true; };
    }, [fen, t]);

    const searchPlayerGames = useCallback(async () => {
        if (!playerName.trim()) return;
        setIsLoadingGames(true);
        try {
            setPlayerGames(await getPlayerGames(playerName.trim()));
        } catch (error) {
            console.error('Failed to fetch player games:', error);
            setPlayerGames([]);
            notification.error({ message: t('database.playerError', 'Could not fetch player games'), description: undefined });
        } finally {
            setIsLoadingGames(false);
        }
    }, [playerName, t]);

    // Поиск при первом рендере (по имени по умолчанию)
    useEffect(() => {
        searchPlayerGames();
    // Только при открытии страницы: дальше — по кнопке/Enter, а не на каждую букву
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ход из книги — обычный ход на доске (раньше loadPgn из одного FEN терял историю партии)
    const handleMoveClick = (san: string) => {
        try {
            const move = new Chess(fen).move(san);
            if (move) gameActions.handleMove(move.from, move.to, move.promotion);
        } catch {
            console.warn('Invalid move clicked:', san);
        }
    };

    const loadGame = (an: string) => {
        if (gameActions.loadPgn(an)) {
            notification.success({ message: t('chessGame.pgnLoadSuccess'), description: undefined });
        } else {
            notification.error({ message: t('chessGame.pgnLoadError'), description: undefined });
        }
    };

    const lastMove = useMemo(() => {
        if (currentMoveIndex === 0) return null;
        try {
            const replay = new Chess();
            for (let i = 0; i < currentMoveIndex - 1; i++) replay.move(history[i]);
            const move = replay.move(history[currentMoveIndex - 1]);
            return move ? { from: move.from, to: move.to } : null;
        } catch {
            return null;
        }
    }, [history, currentMoveIndex]);

    const loader = <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    const empty = (text: string) => <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 4 }}>{text}</Typography>;

    const panels: ArenaPanel[] = [
        {
            key: 'book', label: t('chessGame.tabs.book', 'Opening book'), icon: <MenuBookRoundedIcon />,
            content: isLoadingBook ? loader : bookData && bookData.moves.length > 0 ? (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '3.5rem 4.5rem 1fr', gap: 1.5, px: 1, mb: 0.5 }}>
                        {[t('database.move', 'Move'), t('database.games', 'Games'), t('database.results', 'White / draw / black')].map((h) => (
                            <Typography key={h} variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</Typography>
                        ))}
                    </Box>
                    {bookData.moves.map(move => (
                        <OpeningMoveBar key={move.san} moveData={move} totalGames={bookData.total_games} onMoveClick={handleMoveClick} />
                    ))}
                </>
            ) : empty(t('database.noGamesInPosition', 'No games in this position')),
        },
        {
            key: 'player', label: t('database.playerGames', 'Player games'), icon: <PersonSearchRoundedIcon />,
            content: (
                <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1}>
                        <TextField
                            placeholder={t('database.playerName', 'Player name')}
                            value={playerName}
                            onChange={e => setPlayerName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') searchPlayerGames(); }}
                            fullWidth
                            size="small"
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
                        />
                        <Button variant="contained" onClick={searchPlayerGames} disabled={isLoadingGames} sx={{ minWidth: 96 }}>
                            {isLoadingGames ? <CircularProgress size={20} color="inherit" /> : t('database.search', 'Search')}
                        </Button>
                    </Stack>
                    {isLoadingGames ? loader : playerGames.length > 0 ? (
                        <Stack spacing={0.5}>
                            {playerGames.map(game => (
                                <Button fullWidth color="inherit" onClick={() => loadGame(game.an)} key={game._id}
                                    sx={{ justifyContent: 'space-between', fontWeight: 500, bgcolor: 'surface.raised', '&:hover': { bgcolor: 'surface.overlay' } }}>
                                    <Typography variant="body2" noWrap sx={{ mr: 1 }}>{game.white} — {game.black}</Typography>
                                    <Chip size="small" label={game.result} sx={{ fontFamily: tokens.font.mono }} />
                                </Button>
                            ))}
                        </Stack>
                    ) : empty(t('database.noGames', 'No games found'))}
                </Stack>
            ),
        },
    ];

    const controls = (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <IconButton aria-label="start" onClick={() => gameActions.goToMove(0)} disabled={currentMoveIndex === 0}><SkipPreviousIcon /></IconButton>
            <IconButton aria-label="back" onClick={() => gameActions.goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex === 0}><ArrowLeftIcon /></IconButton>
            <IconButton aria-label="forward" onClick={() => gameActions.goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex === history.length}><ArrowRightIcon /></IconButton>
            <IconButton aria-label="end" onClick={() => gameActions.goToMove(history.length)} disabled={currentMoveIndex === history.length}><SkipNextIcon /></IconButton>
        </Stack>
    );

    return (
        <PageContainer dense>
            <PageHeader dense
                eyebrow={t('nav.groups.training', 'Training')}
                title={t('database.title', 'Games database')}
                subtitle={t('database.subtitle', 'Explore openings and study master games')}
            />
            <ChessArena
                board={<ChessBoard fen={fen} onMove={gameActions.handleMove} lastMove={lastMove} movable="both" />}
                header={(
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">{t('database.totalInPosition', 'Games in this position')}</Typography>
                        <Typography sx={{ fontFamily: tokens.font.mono, fontWeight: 700 }}>
                            {isLoadingBook ? '…' : (bookData?.total_games ?? 0).toLocaleString()}
                        </Typography>
                    </Stack>
                )}
                panels={panels}
                controls={controls}
            />
        </PageContainer>
    );
};
