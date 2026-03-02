// src/pages/DatabasePage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import {
  Container, Typography, Grid, Box, Paper, Stack,
  TextField, Button, Tabs, Tab, CircularProgress
} from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

// Импортируем наши шахматные компоненты
import { useChessGame } from '@/features/Chess/hooks/useChessGame';
import { ChessBoard } from '../components/ChessBoard';
import { OpeningMoveBar } from '@/features/Chess/components/OpeningMoveBar';

// Интерфейсы для типизации данных с нашего API
interface OpeningMove {
    san: string;
    games: number;
    wins: number;
    draws: number;
    losses: number;
}
interface OpeningBookData {
    moves: OpeningMove[];
    total_games: number;
}
interface GameData {
    _id: string;
    white: string;
    black: string;
    result: string;
    an: string; // Наше поле с ходами
}


export const DatabasePage: React.FC = () => {
    const { t } = useTranslation();
    const { fen, actions: gameActions } = useChessGame('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

    // Состояния для вкладок
    const [activeTab, setActiveTab] = useState(0); // 0: Book, 1: Player

    // Состояния для дебютной книги
    const [bookData, setBookData] = useState<OpeningBookData | null>(null);
    const [isLoadingBook, setIsLoadingBook] = useState(true);

    // Состояния для поиска по игроку
    const [playerName, setPlayerName] = useState('Carlsen'); // Имя по умолчанию для примера
    const [playerGames, setPlayerGames] = useState<GameData[]>([]);
    const [isLoadingGames, setIsLoadingGames] = useState(false);
    
    // Эффект для загрузки данных дебютной книги при изменении FEN
    useEffect(() => {
        const fetchBook = async () => {
            setIsLoadingBook(true);
            try {
                const encodedFen = encodeURIComponent(fen);
                const response = await fetch(`http://localhost:3000/api/v2/chessDB/book/${encodedFen}`);
                const result = await response.json();
                
                if (result.success) {
                    setBookData(result.data);
                } else {
                    // Обрабатываем случай, если позиция не найдена
                    setBookData({ moves: [], total_games: 0 });
                }
            } catch (error) {
                console.error("Failed to fetch opening book:", error);
                notification.error({
                    message: 'Could not fetch opening book',
                    description: undefined
                });
            } finally {
                setIsLoadingBook(false);
            }
        };

        fetchBook();
    }, [fen]); // Перезагрузка при каждом изменении FEN
    
    // Функция поиска партий
    const searchPlayerGames = useCallback(async () => {
        if (!playerName.trim()) return;
        setIsLoadingGames(true);
        try {
            const response = await fetch(`http://localhost:3000/api/v2/chessDB/player/${playerName}`);
            const result = await response.json();
            if(result.success) {
                setPlayerGames(result.data);
            } else {
                notification.error({
                    message: result.message,
                    description: undefined
                });
            }
        } catch (error) {
            console.error("Failed to fetch player games:", error);
            notification.error({
                message: 'Could not fetch player games',
                description: undefined
            });
        } finally {
            setIsLoadingGames(false);
        }
    }, [playerName]);
    
    // Эффект для поиска при первом рендере
    useEffect(() => {
        searchPlayerGames();
    }, [searchPlayerGames]);

    // Обработчик клика по ходу в дебютной книге (делаем ход на доске)
    const handleMoveClick = (san: string) => {
        const chess = new Chess(fen);
        try {
            const move = chess.move(san);
            if (move) {
                // Вместо прямого вызова handleMove, мы просто меняем fen в новом движке,
                // чтобы инициировать перезагрузку данных в useEffect
                gameActions.loadPgn(chess.pgn());
            }
        } catch (e) {
            console.warn("Invalid move clicked:", san);
        }
    };
    
    // Загрузка партии в анализатор
    const loadGame = (an: string) => {
        if (gameActions.loadPgn(an)) {
            notification.success({
                message: t('chessGame.pgnLoadSuccess'),
                description: undefined
            });
        } else {
            notification.error({
                message: t('chessGame.pgnLoadError'),
                description: undefined
            });
        }
        // Опционально: можно перенаправить пользователя на страницу анализа
        // history.push('/analysis');
    }

    return (
        <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: 5 }}>
            <Container maxWidth="xl">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold">База Данных Партий</Typography>
                    <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>Исследуйте дебюты и анализируйте партии мастеров</Typography>
                </Box>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, aspectRatio: '1 / 1', display: 'flex', justifyContent: 'center' }}>
                            <ChessBoard fen={fen} onMove={gameActions.handleMove} />
                        </Paper>
                         <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <Button onClick={() => gameActions.goToMove(0)}>В начало</Button>
                         </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, height: '100%', minHeight: '500px' }}>
                            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="fullWidth">
                                <Tab label="Дебютная книга" />
                                <Tab label="Партии игрока" />
                            </Tabs>

                            {/* Контент Дебютной книги */}
                            {activeTab === 0 && (
                                <Box sx={{ pt: 2, height: 'calc(100% - 48px)', overflowY: 'auto' }}>
                                    {isLoadingBook ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                                    ) : (
                                        bookData && bookData.moves.length > 0 ? (
                                            <>
                                            <Typography sx={{mb: 2}}>Всего партий в позиции: {bookData.total_games.toLocaleString()}</Typography>
                                            {bookData.moves.map(move => (
                                                <OpeningMoveBar key={move.san} moveData={move} totalGames={bookData.total_games} onMoveClick={handleMoveClick} />
                                            ))}
                                            </>
                                        ) : (
                                            <Typography sx={{textAlign: 'center', mt: 4}}>Нет партий в этой позиции</Typography>
                                        )
                                    )}
                                </Box>
                            )}

                            {/* Контент поиска по игроку */}
                            {activeTab === 1 && (
                                <Box sx={{ pt: 2, height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column' }}>
                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                        <TextField 
                                            label="Имя игрока"
                                            value={playerName}
                                            onChange={e => setPlayerName(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && searchPlayerGames()}
                                            fullWidth
                                            variant="outlined"
                                            size="small"
                                        />
                                        <Button variant="contained" onClick={searchPlayerGames} disabled={isLoadingGames}>
                                            {isLoadingGames ? <CircularProgress size={24} /> : 'Поиск'}
                                        </Button>
                                    </Stack>
                                    <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                                        {isLoadingGames ? (
                                             <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
                                        ) : (
                                            playerGames.length > 0 ? playerGames.map(game => (
                                                <Button fullWidth onClick={() => loadGame(game.an)} key={game._id} sx={{justifyContent: 'space-between', mb: 1, textTransform: 'none'}}>
                                                    <Typography>{game.white} - {game.black}</Typography>
                                                    <Typography color="text.secondary">{game.result}</Typography>
                                                </Button>
                                            )) : <Typography sx={{textAlign: 'center', mt: 4}}>Партии не найдены</Typography>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};