import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { initialPlayState, playReducer } from './gameReducer';
import { PlaySocketLike, request } from './playApi';
import { Color, GameOverEvent, MoveEvent, PlayGame } from './playTypes';
import { LOW_TIME_MS, remainingMs } from './clock';
import { playMoveSound, sounds } from './sounds';

interface Options {
  gameId: string;
  socket: PlaySocketLike | null;
  connected: boolean;
  userId?: string;
  /** Ошибка действия (ход отклонён, ничья недоступна…) — показать пользователю */
  onError?: (code: string, message: string) => void;
}

/**
 * Онлайн-партия: вход (и повторный вход после переподключения), события сервера, действия игрока.
 * Свой ход применяется сразу; если сервер его отклонил — позиция перечитывается.
 */
export const usePlayGame = ({ gameId, socket, connected, userId, onError }: Options) => {
  const [state, dispatch] = useReducer(playReducer, initialPlayState);
  const [loadError, setLoadError] = useState<string | null>(null);
  const errorRef = useRef(onError);
  errorRef.current = onError;
  const stateRef = useRef(state);
  stateRef.current = state;

  const join = useCallback(async () => {
    if (!socket) return;
    try {
      const game = await request<PlayGame>(socket, 'join_game', { gameId });
      setLoadError(null);
      dispatch({ type: 'snapshot', game, at: Date.now() });
    } catch (e) {
      setLoadError((e as { code?: string }).code ?? 'UNKNOWN');
    }
  }, [socket, gameId]);

  // Вход в партию при подключении и после каждого переподключения
  useEffect(() => {
    if (connected) void join();
  }, [connected, join]);

  useEffect(() => {
    if (state.needsSync) void join();
  }, [state.needsSync, join]);

  useEffect(() => {
    if (!socket) return undefined;
    const mine = (p: { gameId: string }) => p.gameId === gameId;
    const onMove = (e: MoveEvent) => { if (mine(e)) dispatch({ type: 'move', event: e, at: Date.now() }); };
    const onOver = (e: GameOverEvent) => { if (mine(e)) { dispatch({ type: 'over', event: e, at: Date.now() }); sounds.end(); } };
    const onDraw = (e: { gameId: string; by: Color }) => { if (mine(e)) dispatch({ type: 'drawOffer', by: e.by }); };
    const onDrawDeclined = (e: { gameId: string }) => { if (mine(e)) dispatch({ type: 'drawCleared' }); };
    const onRematch = (e: { gameId: string; newGameId: string; by: Color }) => { if (mine(e)) dispatch({ type: 'rematchOffer', newGameId: e.newGameId, by: e.by }); };
    // Мой вызов приняли — партия началась: перечитать состояние
    const onStarted = (e: { gameId: string }) => { if (mine(e)) { void join(); sounds.start(); } };
    socket.on('move', onMove);
    socket.on('game_over', onOver);
    socket.on('draw_offer', onDraw);
    socket.on('draw_declined', onDrawDeclined);
    socket.on('rematch_offer', onRematch);
    socket.on('game_started', onStarted);
    return () => {
      socket.off('move', onMove);
      socket.off('game_over', onOver);
      socket.off('draw_offer', onDraw);
      socket.off('draw_declined', onDrawDeclined);
      socket.off('rematch_offer', onRematch);
      socket.off('game_started', onStarted);
    };
  }, [socket, gameId, join]);

  // Не уходим из комнаты партии при размонтировании — только если сменили партию
  useEffect(() => () => { if (socket) socket.emit('leave_game', { gameId }); }, [socket, gameId]);

  // Звук хода
  const lastPly = state.game?.moves.length ?? 0;
  const prevPly = useRef(lastPly);
  useEffect(() => {
    if (lastPly > prevPly.current && state.lastSan) playMoveSound(state.lastSan);
    prevPly.current = lastPly;
  }, [lastPly, state.lastSan]);

  const game = state.game;
  const myColor: Color | null = game && userId
    ? (game.white?._id === userId ? 'white' : game.black?._id === userId ? 'black' : null)
    : null;

  // «Мало времени»: один сигнал за партию, когда у меня меньше 10 секунд
  const warned = useRef<string | null>(null);
  useEffect(() => {
    if (!game || !myColor || game.status !== 'active') return undefined;
    const timer = setInterval(() => {
      const left = remainingMs(game.clock, myColor, stateRef.current.receivedAt, Date.now());
      if (left < LOW_TIME_MS && game.clock.running && game.clock.turn === myColor && warned.current !== game._id) {
        warned.current = game._id;
        sounds.lowTime();
      }
    }, 500);
    return () => clearInterval(timer);
  }, [game, myColor]);

  const act = useCallback(async <T,>(event: string, payload: Record<string, unknown> = {}): Promise<T | null> => {
    if (!socket) return null;
    try {
      return await request<T>(socket, event, { gameId, ...payload });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      errorRef.current?.(err.code ?? 'UNKNOWN', err.message ?? '');
      return null;
    }
  }, [socket, gameId]);

  /** Ход с доски: true — принят к отправке (доска не возвращает фигуру) */
  const move = useCallback((from: string, to: string, promotion?: string): boolean => {
    const g = stateRef.current.game;
    if (!socket || !g || g.status !== 'active' || !myColor) return false;
    const turn: Color = g.fen.split(' ')[1] === 'b' ? 'black' : 'white';
    if (turn !== myColor) return false;
    // Легальность — сразу, на клиенте (сервер всё равно проверит): нелегальный ход не отправляем
    try {
      if (!new Chess(g.fen).move({ from, to, promotion })) return false;
    } catch {
      return false;
    }
    const uci = `${from}${to}${promotion ?? ''}`;
    const before = g.moves.length;
    dispatch({ type: 'localMove', uci, at: Date.now() });
    void request(socket, 'make_move', { gameId, uci, ply: before }).catch((e: { code?: string; message?: string }) => {
      dispatch({ type: 'moveRejected' });
      errorRef.current?.(e.code ?? 'UNKNOWN', e.message ?? '');
    });
    return true;
  }, [socket, gameId, myColor]);

  return {
    game,
    myColor,
    receivedAt: state.receivedAt,
    rematch: state.rematch,
    loadError,
    pending: state.pendingPly !== null,
    reload: join,
    move,
    resign: () => act('resign'),
    abort: () => act('abort'),
    offerDraw: () => act('offer_draw'),
    acceptDraw: () => act('accept_draw'),
    declineDraw: () => act('decline_draw'),
    rematchGame: () => act<{ gameId: string; accepted: boolean }>('rematch'),
  };
};
