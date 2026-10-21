import React, { useState, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Typography, Box, Stack, Button, IconButton, CircularProgress, Chip, TextField } from '@mui/material';
import { notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

// Импорт хука и компонентов
import { useGameTree } from '../tree/useGameTree';
import { useTreeKeyboard } from '../tree/useTreeKeyboard';
import { ChessBoard } from '../components/ChessBoard';
import { VariationTree } from '../components/VariationTree';
import { AnnotationPanel } from '../components/AnnotationPanel';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { useStockfishEngine, useEngineAnalysis } from '../engine/useStockfish';
import { formatScore, pvToSan } from '../engine/stockfish';
import { engineArrows } from '../engine/evaluation';
import { ChessArena, ArenaPanel } from '../components/ChessArena';
import { PageContainer, PageHeader } from '@/shared/components/ui/PageHeader';
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
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

export const AnalysisPage: React.FC = () => {
    const { t } = useTranslation();
    // Дерево вариантов: ход из любой позиции создаёт ветку, как на Lichess
    const game = useGameTree();
    const { fen, path, current, lastMove, actions } = game;
    useTreeKeyboard(game);
    const ply = current.ply;
    // PGN из «Анализировать партию» (онлайн-партия) — загрузить один раз
    const location = useLocation();
    const incomingPgn = (location.state as { pgn?: string } | null)?.pgn;
    const { loadPgn } = actions;
    useEffect(() => { if (incomingPgn) loadPgn(incomingPgn); }, [incomingPgn, loadPgn]);
    const hasMoves = game.tree.nodes[game.tree.rootId].children.length > 0;
    const [inputPgn, setInputPgn] = useState('');
    const [isEngineOn, setIsEngineOn] = useState(false);
    // Stockfish: воркер создаётся при первом включении анализа и уничтожается при уходе со страницы.
    // Анализ перезапускается на каждой новой позиции, ответы прерванного поиска отбрасываются.
    const { engine } = useStockfishEngine(isEngineOn);
    // MultiPV 2: вторая линия — вторая (синяя) стрелка, как на Lichess
    const { result: rawEngineResult, analyzing: isLiveAnalyzing } = useEngineAnalysis(engine, fen, { enabled: isEngineOn, depth: 18, multiPv: 2, debounceMs: 80 });
    // Только результат текущей позиции: при переходе по нотации старая оценка не «висит»
    const engineResult = rawEngineResult && rawEngineResult.fen === fen ? rawEngineResult : null;
    const bestArrows = useMemo(() => (isEngineOn ? engineArrows(engineResult, 2) : []), [isEngineOn, engineResult]);
    const bestLine = engineResult?.lines[0];
    const liveEvaluation = bestLine ? formatScore(bestLine) : null;
    const liveDepth = engineResult?.depth ?? 0;
    const livePV = bestLine && engineResult ? pvToSan(engineResult.fen, bestLine.pv) : '';

    // Состояния для базы данных
    const [activeTab, setActiveTab] = useState(0);
    const [bookData, setBookData] = useState<IOpeningBookData | null>(null);
    const [isLoadingBook, setIsLoadingBook] = useState(false);
    const [positionGames, setPositionGames] = useState<IGame[]>([]);
    const [isLoadingPositionGames, setIsLoadingPositionGames] = useState(false);
    
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
            if (ply === 0) {
                setPositionGames([]);
                return;
            }

            // PGN линии до текущей позиции (по пути в дереве, без вариантов)
            const tempGame = new Chess();
            for (const node of path.slice(1)) tempGame.move(node.san);
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
                    message: t('chessGame.gamesLoadError', 'Failed to load games for this position'),
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
    // Путь в дереве — партии перезапрашиваются при навигации по ходам и вариантам
    }, [fen, activeTab, path, ply, t]);
    
    // --- Функции-обработчики (без изменений в логике) ---
    const handleLoadPgn = () => {
        if (actions.loadPgn(inputPgn)) { notification.success({
            message: t('chessGame.pgnLoadSuccess'),
            description: undefined
        }); }
        else { notification.error({
            message: t('chessGame.pgnLoadError'),
            description: undefined
        }); }
    };
    const handleResetGame = () => { actions.reset(); notification.success({
        message: t('chessGame.resetSuccess'),
        description: undefined
    }); };
    const handleToggleEngine = (event: React.ChangeEvent<HTMLInputElement>) => { setIsEngineOn(event.target.checked); };
    
    const handleBookMoveClick = (san: string) => {
        actions.play(san);
    };
    
    const handleLoadPlayerGame = (game: IGame) => {
        actions.loadPgn(game.an);
        notification.success({
            message: t('chessGame.gameLoaded', { white: game.white, black: game.black, defaultValue: '{{white}} — {{black}} loaded' }),
            description: undefined
        });
    };
    
    const handleCopyPgn = async () => {
        try {
            await navigator.clipboard.writeText(actions.exportPgn());
            notification.success({ message: t('chessGame.pgnCopied', 'PGN copied to clipboard'), description: undefined });
        } catch {
            setInputPgn(actions.exportPgn()); // нет доступа к буферу — PGN в поле, скопировать вручную
        }
    };

    const loader = <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}><CircularProgress /></Box>;
    const empty = (text: string) => <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pt: 4 }}>{text}</Typography>;

    const panels: ArenaPanel[] = [
        {
            key: 'moves', label: t('chessGame.tabs.moves', 'Moves'), icon: <FormatListNumberedRoundedIcon />,
            content: (
                <Stack spacing={1.5}>
                    <VariationTree tree={game.tree} currentId={current.id} onSelect={actions.goTo} />
                    {/* Глифы, комментарий к ходу и правка дерева — попадут в PGN */}
                    <AnnotationPanel game={game} />
                </Stack>
            ),
        },
        {
            key: 'book', label: t('chessGame.tabs.book', 'Opening book'), icon: <MenuBookRoundedIcon />,
            content: isLoadingBook ? loader : bookData && bookData.moves.length > 0
                ? bookData.moves.map(move => <OpeningMoveBar key={move.san} moveData={move} totalGames={bookData.total_games} onMoveClick={handleBookMoveClick} />)
                : empty(t('chessGame.noBookData', 'No opening book data for this position')),
        },
        {
            key: 'games', label: t('chessGame.tabs.games', 'Games'), icon: <StorageRoundedIcon />,
            content: isLoadingPositionGames ? loader : positionGames.length > 0 ? (
                <Stack spacing={0.5}>
                    {positionGames.map(game => (
                        <Button fullWidth key={game._id} color="inherit" onClick={() => handleLoadPlayerGame(game)}
                            sx={{ justifyContent: 'space-between', fontWeight: 500, bgcolor: 'surface.raised', '&:hover': { bgcolor: 'surface.overlay' } }}>
                            <Typography variant="body2" noWrap sx={{ mr: 1 }}>{game.white} — {game.black}</Typography>
                            <Chip size="small" label={game.result} sx={{ fontFamily: 'monospace' }} />
                        </Button>
                    ))}
                </Stack>
            ) : empty(t('chessGame.noGames', 'No games found for this position')),
        },
        {
            key: 'pgn', label: 'PGN', icon: <UploadFileIcon />,
            content: (
                <Stack spacing={1.5}>
                    <TextField
                        multiline minRows={4} fullWidth
                        inputProps={{ 'aria-label': 'PGN Input' }}
                        placeholder={t('chessGame.pgnInputLabel') || ''}
                        value={inputPgn}
                        onChange={(e) => setInputPgn(e.target.value)}
                        sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.85rem' } }}
                    />
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" color="inherit" onClick={handleResetGame} fullWidth>{t('chessGame.reset')}</Button>
                        <Button variant="contained" onClick={handleLoadPgn} startIcon={<UploadFileIcon />} fullWidth>{t('chessGame.loadPgn')}</Button>
                    </Stack>
                    <Button variant="text" color="inherit" startIcon={<ContentCopyRoundedIcon />} onClick={handleCopyPgn} disabled={!hasMoves}>
                        {t('chessGame.copyPgnTree', 'Copy PGN (variations, glyphs, comments)')}
                    </Button>
                </Stack>
            ),
        },
    ];
    const tabIndex: Record<string, number> = { moves: 0, book: 1, games: 2, pgn: 3 };

    const controls = (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <IconButton aria-label="start" onClick={actions.toStart} disabled={ply === 0}><SkipPreviousIcon /></IconButton>
            <IconButton aria-label="back" onClick={actions.back} disabled={ply === 0}><ArrowLeftIcon /></IconButton>
            <IconButton aria-label="forward" onClick={actions.forward} disabled={current.children.length === 0}><ArrowRightIcon /></IconButton>
            <IconButton aria-label="end" onClick={actions.toEnd} disabled={current.children.length === 0}><SkipNextIcon /></IconButton>
        </Stack>
    );

    return (
        <PageContainer dense>
            <PageHeader dense eyebrow={t('nav.analysis', 'Analysis')} title={t('chessGame.title')} subtitle={t('chessGame.subtitle')} />
            <ChessArena
                board={<ChessBoard fen={fen} onMove={(from, to, promotion) => actions.play({ from, to, promotion })} customArrows={bestArrows} lastMove={lastMove} movable="both" />}
                showEval={isEngineOn}
                evalResult={engineResult}
                header={<AnalysisPanel evaluation={liveEvaluation} depth={liveDepth} principalVariation={livePV} isAnalyzing={isLiveAnalyzing} isEngineOn={isEngineOn} onToggleEngine={handleToggleEngine} engineName={engine?.name} />}
                panels={panels}
                controls={controls}
                activePanel={panels[activeTab]?.key}
                onPanelChange={(key) => setActiveTab(tabIndex[key] ?? 0)}
            />
        </PageContainer>
    );
};
