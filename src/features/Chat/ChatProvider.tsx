import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getChatContacts, getChatMessages, getChatRooms, markChatRead, openChatRoom, sendChatMessage } from '@/api/chat';
import { chatReducer, initialChatState, totalUnread } from './chatReducer';
import { ChatAck, ChatSocketFactory, ChatSocketLike, createChatSocket } from './chatSocket';
import { ChatCtx, ChatContextValue } from './chatContext';
import { ChatContact, ChatContext as ChatTopic, ChatMessage, OpenChatOptions } from './chatTypes';
import { playMessageTone, setTitleBadge } from './notify';

/** Ошибки handshake, после которых переподключаться бессмысленно */
const FATAL_CODES = ['TOKEN_REQUIRED', 'TOKEN_INVALID', 'TOKEN_EXPIRED', 'SESSION_REVOKED', 'USER_NOT_FOUND'];
/** Сколько ждать ack сокета, прежде чем отправить то же сообщение через REST (сервер не задвоит: clientId) */
const ACK_TIMEOUT_MS = 8000;
const TYPING_TTL_MS = 5000;

const newClientId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface ChatProviderProps {
  children: React.ReactNode;
  /** Для тестов: фейковый сокет */
  socketFactory?: ChatSocketFactory;
}

/**
 * Личные сообщения тренер ↔ ученик: сокет /chat (переподключение — socket.io), комнаты и история
 * через REST, оптимистичная отправка, непрочитанные, звук и счётчик во вкладке.
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children, socketFactory = createChatSocket }) => {
  const auth = useContext(AuthContext);
  const myId = auth?.isAuthenticated && auth.user?._id ? String(auth.user._id) : null;

  const [state, dispatch] = useReducer(chatReducer, myId, initialChatState);
  const [isOpen, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [pendingContext, setPendingContext] = useState<ChatTopic | null>(null);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');

  const socketRef = useRef<ChatSocketLike | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refreshRooms = useCallback(async () => {
    try {
      dispatch({ type: 'roomsLoaded', rooms: await getChatRooms() });
    } catch {
      // нет сети — список обновится при переподключении
    }
  }, []);

  const loadLatest = useCallback(async (roomId: string) => {
    try {
      const page = await getChatMessages(roomId);
      dispatch({ type: 'messagesLoaded', roomId, items: page.data, hasMore: page.hasMore, older: false });
    } catch {
      // повторится при следующем открытии
    }
  }, []);

  // Сокет и данные — на время сессии пользователя
  useEffect(() => {
    dispatch({ type: 'reset', myId });
    setContacts([]);
    if (!myId) return undefined;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    void refreshRooms();
    const socket = socketFactory(token);
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      // После разрыва — догоняем пропущенное
      void refreshRooms();
      const active = stateRef.current.activeRoomId;
      if (active) void loadLatest(active);
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (error: { data?: { code?: string } }) => {
      if (error?.data?.code && FATAL_CODES.includes(error.data.code)) socket.disconnect();
    };
    const onMessage = ({ roomId, message }: { roomId: string; message: ChatMessage }) => {
      const current = stateRef.current;
      if (!current.rooms[roomId]) void refreshRooms(); // новый диалог — подтянуть комнату
      dispatch({ type: 'incoming', roomId, message });
      const seen = current.viewing && current.activeRoomId === roomId;
      if (message.sender !== current.myId && !seen) playMessageTone();
    };
    const onRead = ({ roomId, readerId, readAt }: { roomId: string; readerId: string; readAt: string }) =>
      dispatch({ type: 'read', roomId, readerId, readAt });
    const onTyping = ({ roomId, typing }: { roomId: string; typing: boolean }) => {
      dispatch({ type: 'typing', roomId, typing });
      clearTimeout(typingTimers.current[roomId]);
      // Потерянный «перестал печатать» не оставит индикатор навсегда
      if (typing) typingTimers.current[roomId] = setTimeout(() => dispatch({ type: 'typing', roomId, typing: false }), TYPING_TTL_MS);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('message:new', onMessage);
    socket.on('message:read', onRead);
    socket.on('typing', onTyping);
    if (socket.connected) onConnect();

    const timers = typingTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('message:new', onMessage);
      socket.off('message:read', onRead);
      socket.off('typing', onTyping);
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [myId, socketFactory, refreshRooms, loadLatest]);

  // Вкладка в фоне: входящие не считаются прочитанными
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const viewing = isOpen && visible && !!state.activeRoomId;
  useEffect(() => { dispatch({ type: 'setViewing', viewing }); }, [viewing]);

  // Открытый диалог на видимой вкладке — прочитан
  const activeRoom = state.activeRoomId ? state.rooms[state.activeRoomId] : undefined;
  const activeItems = state.activeRoomId ? state.messages[state.activeRoomId]?.items : undefined;
  const hasUnreadInView = !!activeRoom && (activeRoom.unreadCount > 0
    || !!activeItems?.some((m) => m.sender !== state.myId && !m.readAt));
  useEffect(() => {
    if (!viewing || !hasUnreadInView || !state.activeRoomId || !state.myId) return;
    const roomId = state.activeRoomId;
    const readAt = new Date().toISOString();
    dispatch({ type: 'read', roomId, readerId: state.myId, readAt });
    const socket = socketRef.current;
    if (socket?.connected) socket.emit('message:read', { roomId });
    else void markChatRead(roomId).catch(() => undefined);
  }, [viewing, hasUnreadInView, state.activeRoomId, state.myId, activeItems?.length]);

  const unread = totalUnread(state);
  useEffect(() => { setTitleBadge(unread); }, [unread]);
  useEffect(() => () => setTitleBadge(0), []);

  const selectRoom = useCallback((roomId: string | null) => {
    dispatch({ type: 'setActive', roomId });
    setPendingContext(null);
    if (roomId && !stateRef.current.messages[roomId]?.loaded) void loadLatest(roomId);
  }, [loadLatest]);

  const ensureContacts = useCallback(async () => {
    try {
      const list = await getChatContacts();
      setContacts(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const startWith = useCallback(async (contact: ChatContact, context?: ChatTopic | null) => {
    const room = await openChatRoom(contact._id, context ?? pendingContext ?? undefined);
    dispatch({ type: 'roomUpsert', room });
    selectRoom(room._id);
  }, [pendingContext, selectRoom]);

  const openChat = useCallback(async ({ withUserId, context }: OpenChatOptions = {}) => {
    setOpen(true);
    if (!myId) return;
    const list = await ensureContacts();
    let target: ChatContact | undefined = withUserId ? list.find((c) => c._id === withUserId) : undefined;
    if (!withUserId) {
      const coaches = list.filter((c) => c.relation === 'coach');
      if (coaches.length === 1) [target] = coaches;
    }
    if (target || withUserId) {
      try {
        const room = await openChatRoom(target?._id ?? withUserId!, context);
        dispatch({ type: 'roomUpsert', room });
        selectRoom(room._id);
      } catch {
        selectRoom(null); // нет права писать этому пользователю — показываем список
      }
      return;
    }
    // Несколько тренеров (или ни одного) — выбор собеседника в списке, тема запоминается
    dispatch({ type: 'setActive', roomId: null });
    setPendingContext(context && context.kind !== 'direct' ? context : null);
  }, [myId, ensureContacts, selectRoom]);

  const deliver = useCallback((roomId: string, text: string, clientId: string) => {
    const viaRest = () => sendChatMessage(roomId, text, clientId)
      .then((message) => dispatch({ type: 'sendConfirmed', clientId, message }))
      .catch(() => dispatch({ type: 'sendFailed', roomId, clientId }));
    const socket = socketRef.current;
    if (!socket?.connected) {
      void viaRest();
      return;
    }
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      void viaRest(); // нет ack — повтор по REST с тем же clientId (без дубля на сервере)
    }, ACK_TIMEOUT_MS);
    socket.emit('message:send', { roomId, text, clientId }, (response: ChatAck<never>) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const ack = response as ChatAck<ChatMessage>;
      if (ack?.ok && ack.data) dispatch({ type: 'sendConfirmed', clientId, message: ack.data });
      else dispatch({ type: 'sendFailed', roomId, clientId });
    });
  }, []);

  const send = useCallback((raw: string) => {
    const text = raw.trim();
    const roomId = stateRef.current.activeRoomId;
    const me = stateRef.current.myId;
    if (!text || !roomId || !me) return;
    const clientId = newClientId();
    dispatch({
      type: 'sendStarted',
      message: { _id: clientId, clientId, room: roomId, sender: me, text, createdAt: new Date().toISOString(), readAt: null },
    });
    deliver(roomId, text, clientId);
  }, [deliver]);

  const retry = useCallback((message: ChatMessage) => {
    if (!message.clientId) return;
    dispatch({ type: 'sendStarted', message: { ...message, status: 'pending' } });
    deliver(message.room, message.text, message.clientId);
  }, [deliver]);

  const loadOlder = useCallback(async () => {
    const roomId = stateRef.current.activeRoomId;
    if (!roomId) return;
    const room = stateRef.current.messages[roomId];
    const first = room?.items.find((m) => !m.status);
    if (!room?.hasMore || !first) return;
    const page = await getChatMessages(roomId, { before: first._id });
    dispatch({ type: 'messagesLoaded', roomId, items: page.data, hasMore: page.hasMore, older: true });
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    const roomId = stateRef.current.activeRoomId;
    const socket = socketRef.current;
    if (roomId && socket?.connected) socket.emit('typing', { roomId, typing });
  }, []);

  const openDrawer = useCallback(() => {
    setOpen(true);
    void ensureContacts();
  }, [ensureContacts]);
  const closeDrawer = useCallback(() => setOpen(false), []);

  const value = useMemo<ChatContextValue>(() => ({
    available: !!myId,
    state, isOpen, connected, unread, contacts, pendingContext,
    openDrawer, closeDrawer, openChat, selectRoom,
    startWith: (contact) => startWith(contact),
    send, retry, loadOlder, setTyping,
  }), [myId, state, isOpen, connected, unread, contacts, pendingContext, openDrawer, closeDrawer, openChat, selectRoom, startWith, send, retry, loadOlder, setTyping]);

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
};
