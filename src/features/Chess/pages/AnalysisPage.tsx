// src/pages/AnalysisPage.tsx (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Container, Typography, Grid, Box, Paper, Stack, Button, IconButton, Tabs, Tab, CircularProgress } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

// Импорт хука и компонентов
import { useChessGame } from '../hooks/useChessGame';
import { ChessBoard } from '../components/ChessBoard';
import { MoveHistory, AnnotatedMove } from '../components/MoveHistory';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { OpeningMoveBar } from '@/features/Chess/components/OpeningMoveBar';

// --- ИЗМЕНЕНИЕ: Импортируем новый сервис getGamesByHistory ---
import { getOpeningBook, getGamesByHistory } from '@/api/chessDB';
import { IOpeningBookData, IGame } from '@/types';

// Иконки
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import SkipNextIcon from '@mui/icons-material/SkipNext';

export const AnalysisPage: React.FC = () => {
    const { t } = useTranslation();
    const { fen, history, currentMoveIndex, actions } = useChessGame();

    // Состояния для анализа
    const [annotatedHistory, setAnnotatedHistory] = useState<AnnotatedMove[]>([]);
    const [inputPgn, setInputPgn] = useState('');
    const [engineWorker, setEngineWorker] = useState<Worker | null>(null);
    const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
    const [liveEvaluation, setLiveEvaluation] = useState<string | null>(null);
    const [liveDepth, setLiveDepth] = useState(0);
    const [livePV, setLivePV] = useState('');
    const [isEngineOn, setIsEngineOn] = useState(false);
    const fenRef = useRef(fen);

    // Состояния для базы данных
    const [activeTab, setActiveTab] = useState(0);
    const [bookData, setBookData] = useState<IOpeningBookData | null>(null);
    const [isLoadingBook, setIsLoadingBook] = useState(false);
    const [positionGames, setPositionGames] = useState<IGame[]>([]);
    const [isLoadingPositionGames, setIsLoadingPositionGames] = useState(false);
    
    useEffect(() => { fenRef.current = fen; }, [fen]);
    useEffect(() => { setAnnotatedHistory(history.map(san => ({ san }))); }, [history]);
    
    // --- ОСНОВНЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ ---
    useEffect(() => {
        // Логика для дебютной книги остается прежней, она работает по FEN
        const fetchBook = async () => {
            setIsLoadingBook(true);
            try {
                const data = await getOpeningBook(fen);
                setBookData(data);
            } catch (error) {
                console.error("Failed to fetch opening book", error);
                setBookData({ moves: [], total_games: 0 });
            } finally {
                setIsLoadingBook(false);
            }
        };

        // Новая логика для поиска партий по истории ходов
        const fetchPositionGames = async () => {
            // Если мы в начальной позиции, нет смысла искать
            if (currentMoveIndex === 0) {
                setPositionGames([]);
                return;
            }

            // 1. Создаем временный объект игры
            const tempGame = new Chess();
            // 2. Проходим по истории ходов до ТЕКУЩЕГО момента
            for (let i = 0; i < currentMoveIndex; i++) {
                tempGame.move(history[i]);
            }
            // 3. Получаем чистый PGN без заголовков
            const pgnHistory = tempGame.pgn({ maxWidth: 5000, newline: ' ' });

            if (!pgnHistory) {
                setPositionGames([]);
                return;
            }

            setIsLoadingPositionGames(true);
            try {
                // 4. Отправляем сгенерированный PGN на бэкенд
                const data = await getGamesByHistory(pgnHistory);
                setPositionGames(data);
            } catch (error) {
                console.error("Failed to fetch games by history", error);
                setPositionGames([]);
                 notification.error({
                    message: 'Не удалось загрузить партии для позиции',
                    description: undefined
                });
            } finally {
                setIsLoadingPositionGames(false);
            }
        };

        // Вызываем нужную функцию в зависимости от активной вкладки
        if (activeTab === 1) {
            fetchBook();
        } else if (activeTab === 2) {
            fetchPositionGames();
        }
    // Этот хук теперь зависит от currentMoveIndex, чтобы перезапрашивать партии при навигации по истории
    }, [fen, activeTab, history, currentMoveIndex]);
    
    // --- Функции-обработчики (без изменений в логике) ---
    const resetAnalysisData = () => { setLiveEvaluation(null); setLiveDepth(0); setLivePV(''); };
    const handleLoadPgn = () => {
        if (actions.loadPgn(inputPgn)) { resetAnalysisData(); notification.success({
            message: t('chessGame.pgnLoadSuccess'),
            description: undefined
        }); }
        else { notification.error({
            message: t('chessGame.pgnLoadError'),
            description: undefined
        }); }
    };
    const handleResetGame = () => { actions.resetGame(); resetAnalysisData(); notification.success({
        message: t('chessGame.resetSuccess'),
        description: undefined
    }); };
    const handleGoToMove = (moveIndex: number) => { actions.goToMove(moveIndex); resetAnalysisData(); };
    const handleToggleEngine = (event: React.ChangeEvent<HTMLInputElement>) => { setIsEngineOn(event.target.checked); };
    
    const handleBookMoveClick = (san: string) => {
        const chess = new Chess(fen);
        const move = chess.move(san);
        if(move) {
            actions.handleMove(move.from, move.to, move.promotion);
        }
    };
    
    const handleLoadPlayerGame = (game: IGame) => {
        actions.loadPgn(game.an);
        notification.success({
            message: `Партия ${game.white} - ${game.black} загружена`,
            description: undefined
        });
    };
    
    // --- Логика движка Stockfish (без изменений) ---
    const originalLiveAnalyzePosition = useCallback(() => { if (engineWorker && !isLiveAnalyzing) { setIsLiveAnalyzing(true); resetAnalysisData(); engineWorker.postMessage(`position fen ${fen}`); engineWorker.postMessage('go depth 18'); } }, [engineWorker, fen, isLiveAnalyzing]);
    useEffect(() => { if (isEngineOn) { originalLiveAnalyzePosition(); } else if (engineWorker) { engineWorker.postMessage('stop'); setIsLiveAnalyzing(false); } }, [fen, isEngineOn, originalLiveAnalyzePosition, engineWorker]);
    const originalFormatUCIToSAN = useCallback((uciLine: string, startFen: string) => { try { const tempGame = new Chess(startFen); const moves = uciLine.split(' '); let sanLine = ''; for (const uci of moves) { const moveResult = tempGame.move({ from: uci.substring(0, 2) as Square, to: uci.substring(2, 4) as Square, promotion: uci.length === 5 ? uci.substring(4) : undefined }); if (moveResult) { if (tempGame.turn() === 'b') { sanLine += `${tempGame.moveNumber()}. ${moveResult.san} `; } else { sanLine += `${moveResult.san} `; } } else { break; } } return sanLine.trim(); } catch (e) { return uciLine; } }, []);
    useEffect(() => { const worker = new Worker('/workers/stockfish.js'); setEngineWorker(worker); worker.postMessage('uci'); worker.onmessage = (event) => { const message = event.data as string; if (message === 'uciok') return; if (message.startsWith('info depth')) { const depthMatch = message.match(/depth (\d+)/); const scoreMatch = message.match(/score (cp|mate) (-?\d+)/); const pvMatch = message.match(/ pv (.+)/); if (depthMatch) setLiveDepth(parseInt(depthMatch[1], 10)); if (scoreMatch) { const turn = new Chess(fenRef.current).turn(); const type = scoreMatch[1]; let value = parseInt(scoreMatch[2], 10); if (turn === 'b') value *= -1; const evalString = type === 'cp' ? (value / 100).toFixed(2) : `M${Math.abs(value)}`; setLiveEvaluation(evalString); } if (pvMatch) { const formattedPV = originalFormatUCIToSAN(pvMatch[1], fenRef.current); setLivePV(formattedPV); } } if (message.startsWith('bestmove')) { setIsLiveAnalyzing(false); } }; return () => worker.terminate(); }, [originalFormatUCIToSAN]);

    // Стили для компонентов Material-UI для темной темы
    const muiThemeStyles = { "& .MuiTab-root": { color: 'rgba(255, 255, 255, 0.7)' }, "& .Mui-selected": { color: 'white !important' }, "& .MuiTabs-indicator": { backgroundColor: 'white' }, "& .MuiInputLabel-root": { color: 'rgba(255, 255, 255, 0.7)' }, "& .MuiInputBase-input": { color: 'white' }, "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": { borderColor: 'rgba(255, 255, 255, 0.23)' }, "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": { borderColor: 'white' }, "& .MuiButton-outlined": { color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }, "& .MuiIconButton-root": { color: 'white' } };

    return (
        <Box sx={{ bgcolor: '#0e0e0e', color: 'white', minHeight: '100vh', py: { xs: 2, md: 5 } }}>
            <Container maxWidth="xl">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h2" component="h1" fontWeight="bold">{t('chessGame.title')}</Typography>
                    <Typography variant="h6" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>{t('chessGame.subtitle')}</Typography>
                </Box>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChessBoard fen={fen} onMove={actions.handleMove}/>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column', ...muiThemeStyles }}>
                            <AnalysisPanel evaluation={liveEvaluation} depth={liveDepth} principalVariation={livePV} isAnalyzing={isLiveAnalyzing} isEngineOn={isEngineOn} onToggleEngine={handleToggleEngine}/>
                            
                            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}>
                                <Tab label="Нотация" />
                                <Tab label="Книга" />
                                <Tab label="Партии" />
                            </Tabs>

                            <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2, pr: 1 }}>
                                {activeTab === 0 && <MoveHistory history={annotatedHistory} currentMoveIndex={currentMoveIndex} onMoveClick={handleGoToMove} />}

                                {activeTab === 1 && (
                                    isLoadingBook ? <Box sx={{display:'flex', justifyContent: 'center', pt: 4}}><CircularProgress color="inherit" /></Box> :
                                    bookData && bookData.moves.length > 0 ? (
                                        <Box sx={{ maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
                                            {bookData.moves.map(move => <OpeningMoveBar key={move.san} moveData={move} totalGames={bookData.total_games} onMoveClick={handleBookMoveClick} />)}
                                        </Box>
                                    ) : <Typography sx={{textAlign:'center', pt: 4, color: 'rgba(255, 255, 255, 0.7)'}}>Нет данных в книге для этой позиции</Typography>
                                )}
                                
                                {activeTab === 2 && (
                                    <Box sx={{ maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
                                        {isLoadingPositionGames ? (
                                            <Box sx={{display:'flex', justifyContent: 'center', pt: 4}}>
                                                <CircularProgress color="inherit" />
                                            </Box>
                                        ) : positionGames.length > 0 ? (
                                            positionGames.map(game => (
                                                <Button fullWidth key={game._id} sx={{justifyContent:'space-between', textTransform:'none', color:'white', my: 0.5}} onClick={() => handleLoadPlayerGame(game)}>
                                                   <span>{game.white} - {game.black}</span>
                                                   <span>{game.result}</span>
                                                </Button>
                                            ))
                                        ) : (
                                            <Typography sx={{textAlign:'center', pt: 4, color: 'rgba(255, 255, 255, 0.7)'}}>
                                                Партии для этой позиции не найдены
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                            
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ my: 2 }}>
                                <IconButton onClick={() => actions.goToMove(0)} disabled={currentMoveIndex === 0}><SkipPreviousIcon /></IconButton>
                                <IconButton onClick={() => actions.goToMove(currentMoveIndex - 1)} disabled={currentMoveIndex === 0}><ArrowLeftIcon /></IconButton>
                                <IconButton onClick={() => actions.goToMove(currentMoveIndex + 1)} disabled={currentMoveIndex === history.length}><ArrowRightIcon /></IconButton>
                                <IconButton onClick={() => actions.goToMove(history.length)} disabled={currentMoveIndex === history.length}><SkipNextIcon /></IconButton>
                            </Stack>
                            <Stack spacing={1}>
                                <textarea
                                    aria-label="PGN Input"
                                    placeholder={t('chessGame.pgnInputLabel') || ''}
                                    value={inputPgn}
                                    onChange={(e) => setInputPgn(e.target.value)}
                                    style={{ width: '100%', minHeight: '80px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.23)', borderRadius: '4px', padding: '8px', fontFamily: 'inherit', fontSize: 'inherit', boxSizing: 'border-box' }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button variant="outlined" onClick={handleResetGame}  fullWidth>{t('chessGame.reset')}</Button>
                                    <Button variant="outlined" onClick={handleLoadPgn} startIcon={<UploadFileIcon />} fullWidth>{t('chessGame.loadPgn')}</Button>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};