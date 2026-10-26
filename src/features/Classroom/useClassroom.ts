import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import {
  Annotation, BoardState, ChatMessage, ClassroomRole, ClassroomSocketLike, JoinResult,
  LessonMaterial, Participant, request,
} from './classroomApi';

/** Данные режима решения, которые сервер шлёт ТОЛЬКО тренеру (событие solve:coach). */
export interface CoachSolveData {
  solution: string | null;
  lineSan: string[];
  answers: Record<string, { uci: string; san: string | null; correct: boolean; at: string }>;
}

interface Options {
  groupId: string;
  socket: ClassroomSocketLike | null;
  connected: boolean;
  userId?: string;
  /** Ошибка действия (ход отклонён, нет прав…) — показать пользователю */
  onError?: (code: string, message: string) => void;
}

/**
 * Живой урок: вход в комнату class:<groupId> (и повторный после переподключения), приём
 * широковещаний (доска/руки/передача хода/жизненный цикл) и действия участника.
 * Свой ход применяется сразу; если сервер его отклонил — позиция возвращается на прежнюю.
 */
export const useClassroom = ({ groupId, socket, connected, userId, onError }: Options) => {
  const [board, setBoard] = useState<BoardState | null>(null);
  const [role, setRole] = useState<ClassroomRole | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [coachSolve, setCoachSolve] = useState<CoachSolveData | null>(null); // решение + ответы учеников (только тренеру)

  const errorRef = useRef(onError);
  errorRef.current = onError;
  const boardRef = useRef(board);
  boardRef.current = board;
  const roleRef = useRef(role);
  roleRef.current = role;

  const join = useCallback(async () => {
    if (!socket) return;
    try {
      const res = await request<JoinResult>(socket, 'join_class', { groupId });
      setLoadError(null);
      setBoard(res.state);
      setRole(res.role);
    } catch (e) {
      setLoadError((e as { code?: string }).code ?? 'UNKNOWN');
    }
  }, [socket, groupId]);

  // Вход при подключении и после каждого переподключения
  useEffect(() => {
    if (connected) void join();
  }, [connected, join]);

  // Широковещания сервера в комнату class:<groupId>
  useEffect(() => {
    if (!socket) return undefined;
    const onBoard = (e: Pick<BoardState, 'fen' | 'lastMove' | 'annotations' | 'moves' | 'solve' | 'tree' | 'cursor'>) =>
      setBoard((b) => (b ? {
        ...b, fen: e.fen, lastMove: e.lastMove, annotations: e.annotations ?? [], moves: e.moves ?? b.moves,
        solve: e.solve ?? null, tree: e.tree ?? null, cursor: e.cursor ?? null,
      } : b));
    const onControl = (e: { controllerId: string | null }) =>
      setBoard((b) => (b ? { ...b, controllerId: e.controllerId } : b));
    const onHands = (e: { hands: Record<string, string> }) =>
      setBoard((b) => (b ? { ...b, hands: e.hands } : b));
    const onLesson = (e: { status: BoardState['status']; startedAt: string | null }) =>
      setBoard((b) => (b ? { ...b, status: e.status, startedAt: e.startedAt } : b));
    const onMaterial = (e: { material: LessonMaterial | null }) =>
      setBoard((b) => (b ? { ...b, material: e.material } : b));
    const onChat = (e: { message: ChatMessage }) =>
      setBoard((b) => (b ? { ...b, chat: [...(b.chat ?? []), e.message].slice(-100) } : b));
    const onNote = (e: { note: string | null }) =>
      setBoard((b) => (b ? { ...b, note: e.note } : b));
    const onEval = (e: { eval: BoardState['eval'] }) =>
      setBoard((b) => (b ? { ...b, eval: e.eval ?? null } : b));
    const onPresence = (e: { participants: Participant[] }) => setParticipants(e.participants ?? []);
    const onCoachSolve = (e: CoachSolveData | null) => setCoachSolve(e ?? null);

    socket.on('board:update', onBoard);
    socket.on('solve:coach', onCoachSolve);
    socket.on('control:update', onControl);
    socket.on('hand:update', onHands);
    socket.on('lesson:state', onLesson);
    socket.on('material:update', onMaterial);
    socket.on('chat:new', onChat);
    socket.on('note:update', onNote);
    socket.on('eval:update', onEval);
    socket.on('presence', onPresence);
    return () => {
      socket.off('board:update', onBoard);
      socket.off('solve:coach', onCoachSolve);
      socket.off('control:update', onControl);
      socket.off('hand:update', onHands);
      socket.off('lesson:state', onLesson);
      socket.off('material:update', onMaterial);
      socket.off('chat:new', onChat);
      socket.off('note:update', onNote);
      socket.off('eval:update', onEval);
      socket.off('presence', onPresence);
    };
  }, [socket]);

  // Покидаем комнату при смене группы/размонтировании
  useEffect(() => () => { if (socket) socket.emit('leave_class', { groupId }); }, [socket, groupId]);

  const isCoach = role === 'coach';
  // Доской управляет тренер/админ (роль coach) ИЛИ текущий владелец хода (ученик, которому передали ход).
  // Важно: админ ведёт как тренер, но его userId ≠ coachUserId группы — опираемся на роль, а не на id.
  const canControl = !!board && !!userId && (isCoach || board.controllerId === userId);
  const handRaised = !!board && !!userId && !!board.hands[userId];

  const act = useCallback(async <T,>(event: string, payload: Record<string, unknown> = {}): Promise<T | null> => {
    if (!socket) return null;
    try {
      return await request<T>(socket, event, { groupId, ...payload });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      errorRef.current?.(err.code ?? 'UNKNOWN', err.message ?? '');
      return null;
    }
  }, [socket, groupId]);

  /** Ход с доски: true — принят к отправке (доска не возвращает фигуру) */
  const move = useCallback((from: string, to: string, promotion?: string): boolean => {
    const b = boardRef.current;
    if (!socket || !b || !userId) return false;
    if (b.controllerId !== userId && roleRef.current !== 'coach') return false;
    // Легальность — сразу, на клиенте (сервер всё равно проверит): нелегальный ход не отправляем
    let nextFen: string;
    try {
      const chess = new Chess(b.fen);
      if (!chess.move({ from, to, promotion })) return false;
      nextFen = chess.fen();
    } catch {
      return false;
    }
    const uci = `${from}${to}${promotion ?? ''}`;
    const prevFen = b.fen;
    const prevLast = b.lastMove;
    // Оптимистично: показываем ход сразу, авторитетный board:update придёт следом
    setBoard((s) => (s ? { ...s, fen: nextFen, lastMove: { from, to } } : s));
    void request(socket, 'board:move', { groupId, uci }).catch((e: { code?: string; message?: string }) => {
      setBoard((s) => (s ? { ...s, fen: prevFen, lastMove: prevLast } : s));
      errorRef.current?.(e.code ?? 'UNKNOWN', e.message ?? '');
    });
    return true;
  }, [socket, groupId, userId]);

  return {
    board,
    role,
    isCoach,
    participants,
    loadError,
    canControl,
    handRaised,
    coachSolve,
    reload: join,
    move,
    setPosition: (fen: string) => act('board:set', { fen }),
    resetBoard: () => act('board:reset'),
    setAnnotations: (annotations: Annotation[]) => act('board:annotate', { annotations }),
    setMaterial: (material: LessonMaterial | null) => act('material:set', { material }),
    setNote: (note: string | null) => act('note:set', { note }),
    setTree: (payload: { tree: unknown; cursor: string; fen: string; lastMove: { from: string; to: string } | null }) => act('board:tree', payload),
    setEval: (ev: BoardState['eval']) => act('eval:set', { eval: ev }),
    sendChat: (text: string, to?: string) => act<{ message: ChatMessage }>('chat:send', { text, ...(to ? { to } : {}) }),
    // Режим решения на общей доске
    startSolve: (payload: { line: string[]; startFen: string; title: string; solution?: string }) => act('solve:start', payload),
    solveMove: (from: string, to: string, promotion?: string) => act<{ correct: boolean }>('solve:move', { uci: `${from}${to}${promotion ?? ''}` }),
    // Ученик отправляет свой ответ на задачу (общая доска не меняется)
    submitAnswer: (from: string, to: string, promotion?: string) => act<{ correct: boolean }>('solve:answer', { uci: `${from}${to}${promotion ?? ''}` }),
    solveReset: () => act('solve:reset'),
    solveHint: () => act('solve:hint'),
    endSolve: () => act('solve:end'),
    grantControl: (targetUserId: string) => act('control:grant', { userId: targetUserId }),
    revokeControl: () => act('control:revoke'),
    raiseHand: () => act('hand:raise'),
    lowerHand: (targetUserId?: string) => act('hand:lower', targetUserId ? { userId: targetUserId } : {}),
    startLesson: () => act('lesson:start'),
    endLesson: () => act('lesson:end'),
  };
};
