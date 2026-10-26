import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress, Fab, IconButton, Paper, Stack, Tab, Tabs, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import BackHandRoundedIcon from '@mui/icons-material/BackHandRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import { notification } from 'antd';
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { useAuth } from '@/context/AuthContext';
import { ChessBoard } from '@/features/Chess/components/ChessBoard';
import { ResizableBoard } from '@/features/Chess/components/ResizableBoard';
import { useStockfishEngine, useEngineAnalysis } from '@/features/Chess/engine/useStockfish';
import { engineArrows } from '@/features/Chess/engine/evaluation';
import { EvalBar } from '@/features/Chess/components/EvalBar';
import { useGameTree } from '@/features/Chess/tree/useGameTree';
import { createTree, GameTree } from '@/features/Chess/tree/gameTree';
import { AnalysisResult } from '@/features/Chess/engine/stockfish';
import { CoachToolsPanel } from '../components/CoachToolsPanel';
import { DraggablePanel } from '../components/DraggablePanel';
import { SolveCard } from '../components/SolveCard';
import { MaterialCard } from '../components/MaterialCard';
import { NoteCard } from '../components/NoteCard';
import { ChatPanel } from '../components/ChatPanel';
import { ParticipantsPanel } from '../components/ParticipantsPanel';
import { MoveListPanel } from '../components/MoveListPanel';
import { StudentAnswersPanel, StudentAnswer } from '../components/StudentAnswersPanel';
import { SolutionBlock } from '../components/SolutionBlock';
import { PageContainer } from '@/shared/components/ui/PageHeader';
import { Annotation, EnterResult, LivekitAccess, enterFromSchedule, endSession, errorCode, getLivekitAccess } from '../classroomApi';
import { useClassroomSocket } from '../useClassroomSocket';
import { useClassroom } from '../useClassroom';
import { VideoPanel } from '../components/VideoPanel';

const ANNOTATION_ARROW_COLOR = 'rgba(21, 128, 61, 0.8)';
// Аннотации <-> стрелки react-chessboard ([from, to, color])
const annotationArrows = (ann: Annotation[]): Arrow[] =>
  (ann ?? []).filter((a) => a.type === 'arrow' && a.from && a.to).map((a) => [a.from, a.to, a.color || ANNOTATION_ARROW_COLOR] as Arrow);
const annotationSquareStyles = (ann: Annotation[]): Record<string, React.CSSProperties> =>
  (ann ?? []).filter((a) => a.type === 'square' && a.square)
    .reduce((acc, a) => { acc[a.square as string] = { boxShadow: `inset 0 0 0 4px ${a.color || ANNOTATION_ARROW_COLOR}` }; return acc; }, {} as Record<string, React.CSSProperties>);
const arrowsToAnnotations = (arrows: Arrow[]): Annotation[] =>
  arrows.map((a) => ({ type: 'arrow' as const, from: a[0], to: a[1], color: a[2] || ANNOTATION_ARROW_COLOR }));

const ENTER_ERROR_KEYS: Record<string, string> = {
  NOT_A_GROUP_EVENT: 'classroom.enterError.NOT_A_GROUP_EVENT',
  EVENT_NOT_FOUND: 'classroom.enterError.EVENT_NOT_FOUND',
  CLASSROOM_NOT_FOUND: 'classroom.enterError.CLASSROOM_NOT_FOUND',
  NOT_A_CLASSROOM_PARTICIPANT: 'classroom.enterError.NOT_A_CLASSROOM_PARTICIPANT',
};

/**
 * Интерактивный класс: вход из события расписания (/classroom/:eventId). Слева — учебная доска
 * (синхронизируется через socket.io namespace /classroom), справа — видео LiveKit, участники и
 * управление уроком. Доской управляет тренер; он может передать ход ученику.
 */
export const ClassroomPage: React.FC = () => {
  // Два входа: из события расписания (/classroom/:eventId — с отметкой присутствия) и
  // «по требованию» по группе (/classroom/group/:groupId — без запланированной сессии).
  const { eventId = '', groupId: groupParam = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const { user } = useAuth();

  const [enter, setEnter] = useState<EnterResult | null>(null);
  const [enterError, setEnterError] = useState<string | null>(null);
  const [lk, setLk] = useState<LivekitAccess | null>(null);
  const [videoOff, setVideoOff] = useState(false); // видео не настроено на сервере или пользователь вышел
  const [flipped, setFlipped] = useState(false);
  const [ending, setEnding] = useState(false);
  const [engineOn, setEngineOn] = useState(false);
  const [shareEngine, setShareEngine] = useState(false); // транслировать анализ движка всему классу
  const [toolsOpen, setToolsOpen] = useState(false); // плавающая панель инструментов тренера (по шестерёнке)
  const [nowTs, setNowTs] = useState(() => Date.now()); // тик для таймера урока
  const [centerTab, setCenterTab] = useState<'presentation' | 'task' | 'analysis'>('presentation');

  const { socket, connected } = useClassroomSocket();
  const groupId = enter?.groupId ?? '';

  const showError = (code: string, message: string) =>
    notification.error({ message: message || code, description: undefined });

  const room = useClassroom({ groupId, socket, connected, userId: user?._id, onError: showError });

  // 1) Определить группу урока (из события расписания или напрямую), 2) взять LiveKit-токен
  // (видео может быть не настроено — не критично). Роль/состояние доски дальше даёт join_class.
  useEffect(() => {
    let cancelled = false;
    const loadVideo = async (gid: string) => {
      try {
        const access = await getLivekitAccess(gid);
        if (!cancelled) setLk(access);
      } catch (e) {
        // 503 LIVEKIT_NOT_CONFIGURED — ведём урок без видео
        if (!cancelled) setVideoOff(true);
        if (errorCode(e) !== 'LIVEKIT_NOT_CONFIGURED') {
          notification.warning({ message: t('classroom.videoUnavailable'), description: t('classroom.videoUnavailableDesc') });
        }
      }
    };
    (async () => {
      try {
        if (groupParam) {
          // Вход по группе: без события расписания (sessionId нет), роль определит join_class
          if (cancelled) return;
          setEnter({ sessionId: '', groupId: groupParam, room: `classroom-${groupParam}`, role: 'student', status: 'live', startedAt: '' });
          await loadVideo(groupParam);
          return;
        }
        const res = await enterFromSchedule(eventId);
        if (cancelled) return;
        setEnter(res);
        await loadVideo(res.groupId);
      } catch (e) {
        if (!cancelled) setEnterError(errorCode(e) ?? 'UNKNOWN');
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, groupParam]);

  const board = room.board;
  const solve = board?.solve ?? null;

  // Таймер урока (тикает, пока урок live)
  useEffect(() => {
    if (board?.status !== 'live') return;
    const id = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [board?.status]);
  // Вход в режим решения — показываем вкладку «Задача»
  useEffect(() => { if (solve) setCenterTab('task'); }, [!!solve]); // eslint-disable-line react-hooks/exhaustive-deps

  // Общее дерево ходов (анализ/нотация) — синхронно с сервером: контроллер правит, остальные смотрят.
  const game = useGameTree();
  const lastTreeSig = useRef('');
  // Сервер -> локальное дерево (вне режима решения)
  useEffect(() => {
    if (!board || solve) return;
    const serverSig = board.tree ? JSON.stringify({ t: board.tree, c: board.cursor }) : `reset:${board.fen}`;
    if (serverSig === lastTreeSig.current) return;
    lastTreeSig.current = serverSig;
    if (board.tree) game.actions.reset(board.tree as GameTree, board.cursor ?? undefined);
    else game.actions.reset(createTree(board.fen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?.tree, board?.cursor, board?.fen, solve]);
  // Локальные изменения контроллера -> на сервер (пустое дерево не шлём: позицию задаёт board:set)
  useEffect(() => {
    if (!board || solve || !room.canControl) return;
    if (Object.keys(game.tree.nodes).length <= 1) return;
    const localSig = JSON.stringify({ t: game.tree, c: game.current.id });
    if (localSig === lastTreeSig.current) return;
    lastTreeSig.current = localSig;
    void room.setTree({ tree: game.tree, cursor: game.current.id, fen: game.fen, lastMove: game.lastMove });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.tree, game.current.id, solve, room.canControl]);

  // Позиция/подсветка: в решении — с сервера (board.fen), в анализе — из дерева (game.fen)
  const boardFen = solve ? (board?.fen ?? game.fen) : game.fen;
  const treeLast = solve ? board?.lastMove : game.lastMove;
  // В режиме решения доску разворачиваем нужной стороной (чей ход в задаче), иначе — по кнопке «перевернуть»
  const orientation: 'white' | 'black' = solve ? (solve.sideToMove === 'w' ? 'white' : 'black') : (flipped ? 'black' : 'white');
  const lastMove = treeLast ? { from: treeLast.from, to: treeLast.to } : null;

  // Движок — только тренеру и НЕ во время решения (в Solve Mode ответ/анализ прячем). Анализирует позицию дерева.
  const engineActive = room.isCoach && engineOn && !solve;
  const { engine } = useStockfishEngine(engineActive);
  const { result: engineResult, analyzing: engineAnalyzing } = useEngineAnalysis(
    engine,
    engineActive ? (boardFen ?? null) : null,
    { enabled: engineActive, depth: 16, multiPv: 3, debounceMs: 150 },
  );
  const boardArrows = useMemo(() => (engineActive ? engineArrows(engineResult, 2) : []), [engineActive, engineResult]);

  // Рисование стрелок/кружков: аннотации приходят с сервера (видны всем), рисовать может владелец хода/тренер.
  const annotations = useMemo<Annotation[]>(() => (board?.annotations ?? []) as Annotation[], [board?.annotations]);
  const annotArrows = useMemo(() => annotationArrows(annotations), [annotations]);
  const annotSquares = useMemo(() => annotationSquareStyles(annotations), [annotations]);
  // Подсветка поля-подсказки в режиме решения (над аннотациями)
  const solveSquareStyles = useMemo(() => (
    solve?.hintAt ? { ...annotSquares, [solve.hintAt]: { boxShadow: 'inset 0 0 0 4px rgba(229,184,73,0.9)' } } : annotSquares
  ), [annotSquares, solve?.hintAt]);
  const customArrows = useMemo<Arrow[]>(() => [...boardArrows, ...annotArrows], [boardArrows, annotArrows]);
  // react-chessboard дёргает onArrowsChange один раз при монтировании с [] — не затираем им аннотации
  const arrowSyncReady = useRef(false);
  const onArrowsChange = useCallback((arrows: Arrow[]) => {
    if (!room.canControl) return;
    if (!arrowSyncReady.current) { arrowSyncReady.current = true; if (arrows.length === 0) return; }
    // Сохраняем кружки (их рисуем отдельно), заменяем стрелки нарисованными
    const squares = annotations.filter((a) => a.type === 'square');
    void room.setAnnotations([...squares, ...arrowsToAnnotations(arrows)]);
  }, [room, annotations]);

  // Трансляция анализа движка классу: стрелки лучших ходов -> аннотации, оценка -> общий EvalBar.
  useEffect(() => {
    if (!engineActive || !shareEngine || !engineResult) return;
    void room.setAnnotations(arrowsToAnnotations(engineArrows(engineResult, 2)));
    const l = engineResult.lines[0];
    void room.setEval(l ? (l.mate !== undefined ? { mate: l.mate } : { scoreCp: l.scoreCp ?? 0 }) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineActive, shareEngine, engineResult]);

  // Выключили трансляцию движка — убираем его стрелки и оценку у класса
  const handleShareEngine = useCallback((v: boolean) => {
    setShareEngine(v);
    if (!v) { void room.setAnnotations([]); void room.setEval(null); }
  }, [room]);

  // EvalBar: у тренера — из его движка; у остальных — из оценки, присланной тренером (fake-result для шкалы)
  const evalResult = useMemo<AnalysisResult | null>(() => {
    if (room.isCoach && engineActive && engineResult) return engineResult;
    const ev = board?.eval;
    if (!ev) return null;
    const line = { multipv: 1, depth: 0, pv: [] as string[], ...(typeof ev.mate === 'number' ? { mate: ev.mate } : { scoreCp: ev.scoreCp ?? 0 }) };
    return { fen: boardFen, depth: 0, lines: [line], bestMove: null, aborted: false };
  }, [room.isCoach, engineActive, engineResult, board?.eval, boardFen]);
  const showEvalBar = !solve && !!evalResult;

  const finishLesson = async () => {
    setEnding(true);
    try {
      await room.endLesson();
      // Запланированная сессия — завершаем и отметку присутствия; у входа «по группе» sessionId нет
      if (enter?.sessionId) await endSession(enter.sessionId).catch(() => undefined);
      notification.success({ message: t('classroom.lessonEnded'), description: undefined });
      navigate('/my-classes');
    } finally {
      setEnding(false);
    }
  };

  const lessonChip = useMemo(() => {
    if (!board) return null;
    const map = {
      idle: { label: t('classroom.status.idle'), color: 'default' as const },
      live: { label: t('classroom.status.live'), color: 'success' as const },
      ended: { label: t('classroom.status.ended'), color: 'default' as const },
    };
    const s = map[board.status];
    return <Chip size="small" color={s.color} label={s.label} />;
  }, [board, t]);

  if (enterError) {
    return (
      <PageContainer maxWidth={640}>
        <Alert severity={enterError === 'NOT_A_GROUP_EVENT' ? 'info' : 'error'}
          action={<Button color="inherit" onClick={() => navigate('/students-shedule')}>{t('classroom.toSchedule')}</Button>}>
          {ENTER_ERROR_KEYS[enterError] ? t(ENTER_ERROR_KEYS[enterError]) : t('classroom.enterError.default')}
        </Alert>
      </PageContainer>
    );
  }
  if (!enter || !board) {
    return <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;
  }

  // ---- доска
  const chessBoard = (
    <ChessBoard
      fen={boardFen}
      onMove={(from, to, promotion) => {
        if (solve && solve.status === 'solving') {
          if (room.canControl) {
            void room.solveMove(from, to, promotion).then((r) => {
              if (r && r.correct === false) notification.warning({ message: t('classroom.solve.tryAgain', { defaultValue: 'Неверный ход — попробуйте ещё раз' }), description: undefined });
            });
          } else {
            // Ученик отправляет свой ответ — общая доска не меняется, тренер видит его в панели
            void room.submitAnswer(from, to, promotion).then((r) => {
              if (r) notification[r.correct ? 'success' : 'warning']({
                message: r.correct ? t('classroom.answers.okSent', { defaultValue: 'Верно! Ответ отправлен' }) : t('classroom.answers.sent', { defaultValue: 'Ответ отправлен' }),
                description: undefined,
              });
            });
          }
          return false; // ход применит авторитетный board:update, если он верный
        }
        // Анализ: ход идёт в общее дерево (из середины партии создаётся подвариант), синхронно всем
        if (!room.canControl) return false;
        return game.actions.play({ from, to, promotion });
      }}
      boardOrientation={orientation}
      movable="both"
      lastMove={lastMove}
      customArrows={customArrows}
      customSquareStyles={solveSquareStyles}
      areArrowsAllowed={room.canControl && !solve}
      onArrowsChange={onArrowsChange}
    />
  );

  const boardControls = (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
      <Stack direction="row" spacing={1} alignItems="center">
        {room.canControl ? (
          <Chip size="small" color="success" variant="outlined" label={t('classroom.youControl')} />
        ) : (
          <Chip size="small" variant="outlined" label={t('classroom.coachControls')} />
        )}
        {room.isCoach && (
          <Button size="small" variant="outlined" color="inherit" startIcon={<RestartAltRoundedIcon />}
            onClick={() => void room.resetBoard()}>
            {t('classroom.reset')}
          </Button>
        )}
        {room.isCoach && board.controllerId !== board.coachUserId && (
          <Button size="small" variant="outlined" color="inherit" onClick={() => void room.revokeControl()}>
            {t('classroom.revokeControl')}
          </Button>
        )}
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        {!room.isCoach && (
          room.handRaised ? (
            <Button size="small" variant="contained" color="warning" startIcon={<BackHandRoundedIcon />}
              onClick={() => void room.lowerHand()}>
              {t('classroom.lowerHand')}
            </Button>
          ) : (
            <Button size="small" variant="outlined" color="warning" startIcon={<PanToolRoundedIcon />}
              onClick={() => void room.raiseHand()}>
              {t('classroom.raiseHand')}
            </Button>
          )
        )}
        <Tooltip title={t('classroom.flipBoard')}>
          <IconButton size="small" onClick={() => setFlipped((f) => !f)} aria-label={t('classroom.flipBoard')}><SwapVertRoundedIcon /></IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  const videoBox = (
    <Box sx={{ height: { xs: 240, md: 260 }, flexShrink: 0, bgcolor: 'surface.raised', borderRadius: '10px', overflow: 'hidden' }}>
      {lk && !videoOff ? (
        <VideoPanel token={lk.token} serverUrl={lk.url} role={lk.role} onDisconnected={() => setVideoOff(true)} />
      ) : (
        <Stack sx={{ height: '100%' }} alignItems="center" justifyContent="center" spacing={1}>
          <VideocamOffRoundedIcon color="disabled" fontSize="large" />
          <Typography variant="body2" color="text.secondary">{t('classroom.videoUnavailable')}</Typography>
          {videoOff && lk && (
            <Button size="small" onClick={() => setVideoOff(false)}>{t('classroom.reconnect')}</Button>
          )}
        </Stack>
      )}
    </Box>
  );

  // Производные для шапки и панелей нового макета
  const elapsedMs = board.status === 'live' && board.startedAt ? Math.max(0, nowTs - Date.parse(board.startedAt)) : 0;
  const timerStr = `${Math.floor(elapsedMs / 60000)}:${String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, '0')}`;
  const students = room.participants.filter((p) => p.role === 'student').map((p) => ({ userId: p.userId, name: p.name }));
  const lessonTitle = board.material?.title || t('classroom.title');
  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  // Ответы учеников (с сервера, только тренеру) → формат панели
  const answerMap: Record<string, StudentAnswer> | undefined = room.coachSolve?.answers
    ? Object.fromEntries(Object.entries(room.coachSolve.answers).map(([uid, a]) => [uid, { move: a.san ?? a.uci, status: (a.correct ? 'correct' : 'wrong') as StudentAnswer['status'] }]))
    : undefined;
  // Тренер показывает ход ученика всему классу — рисуем стрелку-аннотацию
  const showAnswerMove = (uid: string) => {
    const a = room.coachSolve?.answers?.[uid];
    if (!a || a.uci.length < 4) return;
    const squares = annotations.filter((x) => x.type === 'square');
    void room.setAnnotations([...squares, { type: 'arrow' as const, from: a.uci.slice(0, 2), to: a.uci.slice(2, 4), color: 'rgba(43,80,224,0.85)' }]);
  };

  return (
    <PageContainer dense maxWidth={1480}>
      {/* Шапка урока */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/my-classes')} aria-label={t('classroom.back', { defaultValue: 'Назад' })}><ArrowBackRoundedIcon /></IconButton>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="text.secondary" noWrap>{t('classroom.title')}</Typography>
          <Typography variant="h6" component="h1" noWrap sx={{ lineHeight: 1.2 }}>{lessonTitle}</Typography>
        </Box>
        {board.status === 'live' ? (
          <Chip size="small" color="error" variant="outlined" label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main' }} />
              <span>{t('classroom.status.live')}</span>
              <Box component="span" sx={{ fontFamily: '"JetBrains Mono"' }}>{timerStr}</Box>
            </Stack>
          } />
        ) : lessonChip}
        {room.isCoach && (
          board.status !== 'live' ? (
            <Button variant="contained" startIcon={<PlayArrowRoundedIcon />} onClick={() => void room.startLesson()}>{t('classroom.startLesson')}</Button>
          ) : (
            <Button variant="contained" color="error" startIcon={<StopRoundedIcon />} disabled={ending} onClick={() => void finishLesson()}>{t('classroom.endLesson')}</Button>
          )
        )}
      </Stack>

      {!connected && <Alert severity="warning" sx={{ mb: 1.5 }}>{t('classroom.connectionLost')}</Alert>}

      {/* Трёхколоночный макет: видео+чат слева, доска по центру, ответы+решение справа */}
      <Box sx={{
        display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 2, alignItems: 'stretch',
        ...(wide ? { height: 'calc(100dvh - 150px)', overflow: 'hidden' } : {}),
      }}>
        {/* ЛЕВО */}
        <Stack spacing={1.5} sx={{ flex: wide ? '0 0 250px' : '1 1 auto', minWidth: 0, ...(wide ? { height: '100%', overflow: 'hidden' } : {}) }}>
          {videoBox}
          {students.length > 0 && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {students.map((s) => (
                <Tooltip key={s.userId} title={s.name}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: 11, fontWeight: 700, bgcolor: 'rgba(43,80,224,0.1)', color: 'primary.main' }}>{initials(s.name)}</Avatar>
                </Tooltip>
              ))}
            </Stack>
          )}
          <Paper sx={{ p: 1, display: 'flex', flexDirection: 'column', minHeight: 0, ...(wide ? { flex: 1 } : { height: 300 }) }}>
            <ChatPanel messages={board.chat ?? []} myUserId={user?._id} participants={room.participants} onSend={(text, to) => void room.sendChat(text, to)} />
          </Paper>
        </Stack>

        {/* ЦЕНТР */}
        <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', ...(wide ? { height: '100%', overflow: 'hidden' } : {}) }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
            <Tabs value={centerTab} onChange={(_, v) => setCenterTab(v)} sx={{ minHeight: 36 }}>
              <Tab value="presentation" label={t('classroom.tab.presentation', { defaultValue: 'Презентация' })} sx={{ minHeight: 36, py: 0 }} />
              <Tab value="task" label={t('classroom.tab.task', { defaultValue: 'Задача группе' })} sx={{ minHeight: 36, py: 0 }} />
              <Tab value="analysis" label={t('classroom.tab.analysis', { defaultValue: 'Анализ' })} sx={{ minHeight: 36, py: 0 }} />
            </Tabs>
            {solve && (
              <Chip size="small" variant="outlined" label={`${solve.sideToMove === 'w' ? t('classroom.whiteToMove', { defaultValue: 'Ход белых' }) : t('classroom.blackToMove', { defaultValue: 'Ход чёрных' })}${solve.title ? ' · ' + solve.title : ''}`} />
            )}
          </Stack>
          <Box sx={{ flex: wide ? 1 : '0 0 auto', minHeight: 0, display: 'flex', gap: 1, alignItems: 'stretch', mx: { xs: -2, sm: 0 } }}>
            {showEvalBar && (
              <Box sx={{ display: 'flex', flexShrink: 0 }}>
                <EvalBar result={evalResult} orientation={orientation} direction="vertical" width={16} />
              </Box>
            )}
            {wide ? <ResizableBoard reserveBottom={60}>{chessBoard}</ResizableBoard>
              : <Box sx={{ width: '100%', maxWidth: 'calc(100dvh - 320px)', minWidth: { xs: '100%', sm: 320 }, mx: 'auto', aspectRatio: '1 / 1' }}>{chessBoard}</Box>}
          </Box>
          <Box sx={{ mt: 1.5 }}>{boardControls}</Box>
          {centerTab === 'analysis' && (
            <Paper sx={{ mt: 1.5, p: 1, maxHeight: 160, overflowY: 'auto' }}>
              <MoveListPanel moves={board.moves ?? []} />
            </Paper>
          )}
        </Box>

        {/* ПРАВО */}
        <Stack spacing={1.5} sx={{ flex: wide ? '0 0 330px' : '1 1 auto', minWidth: 0, ...(wide ? { height: '100%', overflowY: 'auto' } : {}) }}>
          {solve ? (
            <SolveCard solve={solve} canControl={room.canControl} isCoach={room.isCoach}
              onHint={() => void room.solveHint()} onRestart={() => void room.solveReset()} onExit={() => void room.endSolve()} />
          ) : (board.material && (
            <MaterialCard material={board.material} onClear={room.isCoach ? () => void room.setMaterial(null) : undefined} />
          ))}
          <StudentAnswersPanel students={students} answers={answerMap} solving={!!solve} isCoach={room.isCoach}
            onShowMove={room.isCoach ? showAnswerMove : undefined} />
          {room.isCoach && solve && (
            <SolutionBlock solution={room.coachSolve?.solution} lineSan={room.coachSolve?.lineSan} revealedToClass={!!board.note} />
          )}
          {board.note && (
            <NoteCard note={board.note} onClear={room.isCoach ? () => void room.setNote(null) : undefined} />
          )}
          {room.isCoach && (
            <Paper sx={{ p: 1 }}>
              <ParticipantsPanel participants={room.participants} hands={board.hands} controllerId={board.controllerId}
                isCoach={room.isCoach} onGrantControl={(id) => void room.grantControl(id)} onLowerHand={(id) => void room.lowerHand(id)} />
            </Paper>
          )}
        </Stack>
      </Box>

      {/* Инструменты тренера — плавающее окно, открывается шестерёнкой, таскается по экрану */}
      {room.isCoach && (
        <>
          <Tooltip title={t('classroom.coachTools', { defaultValue: 'Инструменты тренера' })}>
            <Fab color="primary" onClick={() => setToolsOpen((o) => !o)}
              sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: (th) => th.zIndex.modal }}
              aria-label={t('classroom.coachTools', { defaultValue: 'Инструменты тренера' })}>
              <SettingsRoundedIcon />
            </Fab>
          </Tooltip>
          {toolsOpen && (
            <DraggablePanel title={t('classroom.coachTools', { defaultValue: 'Инструменты тренера' })} onClose={() => setToolsOpen(false)}>
              <CoachToolsPanel
                fen={board.fen}
                canControl={room.canControl}
                solving={!!solve}
                onLoad={(f) => void room.setPosition(f)}
                onReset={() => void room.resetBoard()}
                onMaterial={(m) => void room.setMaterial(m)}
                onSolve={(p) => void room.startSolve(p)}
                onNote={(n) => void room.setNote(n)}
                engine={{ on: engineOn, setOn: setEngineOn, result: engineResult, analyzing: engineAnalyzing, name: engine?.name, error: engine?.error, shareOn: shareEngine, setShareOn: handleShareEngine }}
              />
            </DraggablePanel>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ClassroomPage;
