import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Container, Typography, Grid, Box, Paper, Stack, TextField, Button, IconButton } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';

// Импорт хука и компонентов
import { useChessGame } from '../hooks/useChessGame';
import { ChessBoard } from '../components/ChessBoard';
import { MoveHistory, AnnotatedMove } from '../components/MoveHistory';
import { AnalysisPanel } from '../components/AnalysisPanel';

// Иконки
import ReplayIcon from '@mui/icons-material/Replay';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import SkipNextIcon from '@mui/icons-material/SkipNext';

export const AnalysisPage: React.FC = () => {
    const { t } = useTranslation();
    
    // Базовая логика игры из хука
    const { fen, history, currentMoveIndex, moveOptions, actions } = useChessGame();

    // Преобразуем историю для отображения с аннотациями (оценками)
    const [annotatedHistory, setAnnotatedHistory] = useState<AnnotatedMove[]>(history.map(san => ({ san })));
    useEffect(() => {
        setAnnotatedHistory(history.map(san => ({ san })));
    }, [history]);

    // Состояния, специфичные для страницы анализа
    const [inputPgn, setInputPgn] = useState('');
    const [engineWorker, setEngineWorker] = useState<Worker | null>(null);
    const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
    const [liveEvaluation, setLiveEvaluation] = useState<string | null>(null);
    const [liveDepth, setLiveDepth] = useState(0);
    const [livePV, setLivePV] = useState(''); // Хранит raw UCI-строку
    const [isEngineOn, setIsEngineOn] = useState(false);
    
    // Новые состояния для интерактивности линии анализа
    const [previewFen, setPreviewFen] = useState<string | null>(null);
    const [highlightSquares, setHighlightSquares] = useState<{ [key: string]: React.CSSProperties }>({});

    const fenRef = useRef(fen);
    useEffect(() => { fenRef.current = fen; }, [fen]);

    // --- ОБНОВЛЕННЫЕ ФУНКЦИИ-ДЕЙСТВИЯ ---

    const clearPreview = () => {
        setPreviewFen(null);
        setHighlightSquares({});
    };

    const resetAnalysisData = () => {
        setLiveEvaluation(null);
        setLiveDepth(0);
        setLivePV('');
        clearPreview();
    };

    const handleMoveWithReset = (source: Square, target: Square) => {
        clearPreview();
        return actions.handleMove(source, target);
    };

    const handleGoToMove = (moveIndex: number) => {
        clearPreview();
        actions.goToMove(moveIndex);
    };

    const handleLoadPgn = () => {
        if (actions.loadPgn(inputPgn)) {
            resetAnalysisData();
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
    };
    
    const handleResetGame = () => {
        actions.resetGame();
        resetAnalysisData();
        notification.success({
            message: t('chessGame.resetSuccess'),
            description: undefined
        });
    };

    // --- НОВЫЕ ОБРАБОТЧИКИ ДЛЯ ИНТЕРАКТИВНОЙ ЛИНИИ АНАЛИЗА ---

    const handleVariationMoveHover = (from: Square, to: Square) => {
        setHighlightSquares({
            [from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
            [to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        });
    };
    
    const handleVariationMoveLeave = () => {
        setHighlightSquares({});
    };

    const handleVariationMoveClick = (fen: string) => {
        setPreviewFen(fen); // Устанавливаем FEN для предпросмотра
    };

    // --- ЛОГИКА АНАЛИЗА (LIVE) ---

    const liveAnalyzePosition = useCallback(() => {
        if (engineWorker && !isLiveAnalyzing) {
            setIsLiveAnalyzing(true);
            resetAnalysisData();
            engineWorker.postMessage(`position fen ${fen}`);
            engineWorker.postMessage('go depth 18');
        }
    }, [engineWorker, fen, isLiveAnalyzing]);

    useEffect(() => {
        if (isEngineOn) {
            liveAnalyzePosition();
        } else if (engineWorker) {
            engineWorker.postMessage('stop');
            setIsLiveAnalyzing(false);
        }
    }, [fen, isEngineOn, liveAnalyzePosition, engineWorker]);

    const handleToggleEngine = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsEngineOn(event.target.checked);
    };

    // --- ГЛАВНЫЙ useEffect ДЛЯ ИНИЦИАЛИЗАЦИИ WORKER'А ---

    useEffect(() => {
        const worker = new Worker('/workers/stockfish.js');
        setEngineWorker(worker);
        worker.postMessage('uci');

        worker.onmessage = (event) => {
            const message = event.data as string;
            if (message === 'uciok') return;

            if (message.startsWith('info depth')) {
                const depthMatch = message.match(/depth (\d+)/);
                const scoreMatch = message.match(/score (cp|mate) (-?\d+)/);
                const pvMatch = message.match(/ pv (.+)/);
                if (depthMatch) setLiveDepth(parseInt(depthMatch[1], 10));
                if (scoreMatch) {
                    const turn = new Chess(fenRef.current).turn();
                    const type = scoreMatch[1];
                    let value = parseInt(scoreMatch[2], 10);
                    if (turn === 'b') value *= -1;
                    const evalString = type === 'cp' ? (value / 100).toFixed(2) : `M${Math.abs(value)}`;
                    setLiveEvaluation(evalString);
                }
                if (pvMatch) {
                    setLivePV(pvMatch[1]); // Сохраняем raw UCI-строку
                }
            }
            if (message.startsWith('bestmove')) { setIsLiveAnalyzing(false); }
        };

        return () => worker.terminate();
    }, []); // Запускаем только один раз при монтировании компонента

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
                            <ChessBoard
                                fen={previewFen || fen}
                                onPieceDrop={handleMoveWithReset}
                                onSquareClick={actions.onSquareClick}
                                squareStyles={{ ...moveOptions, ...highlightSquares }}
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 2, bgcolor: '#1c1c1c', borderRadius: 4, height: '100%' }}>
                            <Stack spacing={2} height="100%">
                                <AnalysisPanel
                                  evaluation={liveEvaluation}
                                  depth={liveDepth}
                                  principalVariation={livePV}
                                  isAnalyzing={isLiveAnalyzing}
                                  isEngineOn={isEngineOn}
                                  onToggleEngine={handleToggleEngine}
                                  startFenForPV={fen}
                                  onVariationMoveHover={handleVariationMoveHover}
                                  onVariationMoveLeave={handleVariationMoveLeave}
                                  onVariationMoveClick={handleVariationMoveClick}
                                />
                                <Box sx={{ flexGrow: 1, height: '250px' }}>
                                    <MoveHistory history={annotatedHistory} currentMoveIndex={currentMoveIndex} onMoveClick={handleGoToMove} />
                                </Box>
                                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                    <IconButton onClick={() => handleGoToMove(0)} disabled={currentMoveIndex === 0}><SkipPreviousIcon /></IconButton>
                                    <IconButton onClick={() => handleGoToMove(currentMoveIndex - 1)} disabled={currentMoveIndex === 0}><ArrowLeftIcon /></IconButton>
                                    <IconButton onClick={() => handleGoToMove(currentMoveIndex + 1)} disabled={currentMoveIndex === history.length}><ArrowRightIcon /></IconButton>
                                    <IconButton onClick={() => handleGoToMove(history.length)} disabled={currentMoveIndex === history.length}><SkipNextIcon /></IconButton>
                                </Stack>
                                <Stack spacing={1}>
                                    <TextField label={t('chessGame.pgnInputLabel')} fullWidth multiline rows={2} variant="filled" value={inputPgn} onChange={(e) => setInputPgn(e.target.value)} sx={{ '& .MuiFilledInput-root': { backgroundColor: 'rgba(255,255,255,0.1)' } }} />
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="outlined" onClick={handleResetGame} startIcon={<ReplayIcon />} fullWidth>{t('chessGame.reset')}</Button>
                                        <Button variant="outlined" onClick={handleLoadPgn} startIcon={<UploadFileIcon />} fullWidth>{t('chessGame.loadPgn')}</Button>
                                    </Stack>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};