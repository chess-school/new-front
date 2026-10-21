// Состояние чата: комнаты, сообщения по комнатам, «печатает», активный диалог.
// Слияние сообщений идёт по _id и по clientId: оптимистичное сообщение, ответ ack/REST
// и эхо из сокета (message:new с тем же clientId) — одно сообщение, а не три.

import { ChatMessage, ChatRoom } from './chatTypes';

export interface RoomMessages {
  items: ChatMessage[];
  hasMore: boolean;
  loaded: boolean;
}

export interface ChatState {
  myId: string | null;
  rooms: Record<string, ChatRoom>;
  messages: Record<string, RoomMessages>;
  typing: Record<string, boolean>;
  /** Открытый диалог (и панель открыта и вкладка видна — тогда входящие сразу прочитаны) */
  activeRoomId: string | null;
  viewing: boolean;
}

export type ChatAction =
  | { type: 'reset'; myId: string | null }
  | { type: 'roomsLoaded'; rooms: ChatRoom[] }
  | { type: 'roomUpsert'; room: ChatRoom }
  | { type: 'setActive'; roomId: string | null }
  | { type: 'setViewing'; viewing: boolean }
  | { type: 'messagesLoaded'; roomId: string; items: ChatMessage[]; hasMore: boolean; older: boolean }
  | { type: 'sendStarted'; message: ChatMessage }
  | { type: 'sendConfirmed'; clientId: string; message: ChatMessage }
  | { type: 'sendFailed'; roomId: string; clientId: string }
  | { type: 'incoming'; roomId: string; message: ChatMessage }
  | { type: 'read'; roomId: string; readerId: string; readAt: string }
  | { type: 'typing'; roomId: string; typing: boolean };

export const initialChatState = (myId: string | null = null): ChatState => ({
  myId, rooms: {}, messages: {}, typing: {}, activeRoomId: null, viewing: false,
});

const byTime = (a: ChatMessage, b: ChatMessage) => (a.createdAt === b.createdAt ? a._id.localeCompare(b._id) : a.createdAt < b.createdAt ? -1 : 1);

/** Слить сообщения без дублей: совпадение по _id или clientId — новое заменяет старое */
export const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const result = [...current];
  for (const message of incoming) {
    const index = result.findIndex((m) => m._id === message._id || (!!message.clientId && m.clientId === message.clientId));
    if (index >= 0) result[index] = { ...result[index], ...message, status: message.status };
    else result.push(message);
  }
  return result.sort(byTime);
};

const roomMessages = (state: ChatState, roomId: string): RoomMessages =>
  state.messages[roomId] ?? { items: [], hasMore: false, loaded: false };

const withLast = (room: ChatRoom | undefined, message: ChatMessage): ChatRoom | undefined => {
  if (!room) return room;
  if (room.lastMessageAt && room.lastMessageAt > message.createdAt) return room;
  return { ...room, lastMessage: { text: message.text, sender: message.sender, createdAt: message.createdAt }, lastMessageAt: message.createdAt };
};

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'reset':
      return initialChatState(action.myId);

    case 'roomsLoaded': {
      const rooms: Record<string, ChatRoom> = {};
      for (const room of action.rooms) rooms[room._id] = room;
      // Открытый и видимый диалог прочитан, даже если сервер ещё не успел это записать
      if (state.viewing && state.activeRoomId && rooms[state.activeRoomId]) {
        rooms[state.activeRoomId] = { ...rooms[state.activeRoomId], unreadCount: 0 };
      }
      return { ...state, rooms };
    }

    case 'roomUpsert':
      return { ...state, rooms: { ...state.rooms, [action.room._id]: { ...state.rooms[action.room._id], ...action.room } } };

    case 'setActive':
      return { ...state, activeRoomId: action.roomId };

    case 'setViewing':
      return { ...state, viewing: action.viewing };

    case 'messagesLoaded': {
      const prev = roomMessages(state, action.roomId);
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: {
            items: mergeMessages(prev.items, action.items),
            // Более старые страницы задают hasMore; перезагрузка свежей — не сбрасывает уже известное
            hasMore: action.older || !prev.loaded ? action.hasMore : prev.hasMore,
            loaded: true,
          },
        },
      };
    }

    case 'sendStarted': {
      const { message } = action;
      const prev = roomMessages(state, message.room);
      return {
        ...state,
        messages: { ...state.messages, [message.room]: { ...prev, items: mergeMessages(prev.items, [{ ...message, status: 'pending' }]) } },
        rooms: { ...state.rooms, ...(state.rooms[message.room] ? { [message.room]: withLast(state.rooms[message.room], message)! } : {}) },
      };
    }

    case 'sendConfirmed': {
      const { message } = action;
      const prev = roomMessages(state, message.room);
      return {
        ...state,
        messages: { ...state.messages, [message.room]: { ...prev, items: mergeMessages(prev.items, [{ ...message, clientId: action.clientId, status: undefined }]) } },
      };
    }

    case 'sendFailed': {
      const prev = roomMessages(state, action.roomId);
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: { ...prev, items: prev.items.map((m) => (m.clientId === action.clientId && m.status === 'pending' ? { ...m, status: 'failed' } : m)) },
        },
      };
    }

    case 'incoming': {
      const { roomId, message } = action;
      const prev = roomMessages(state, roomId);
      const known = prev.items.some((m) => m._id === message._id || (!!message.clientId && m.clientId === message.clientId));
      const fromOther = message.sender !== state.myId;
      const seenNow = state.viewing && state.activeRoomId === roomId;
      const room = state.rooms[roomId];
      const nextRoom = room && withLast({ ...room, unreadCount: fromOther && !known && !seenNow ? room.unreadCount + 1 : room.unreadCount }, message);
      return {
        ...state,
        // Историю незагруженной комнаты не начинаем с середины: она загрузится целиком при открытии
        messages: prev.loaded
          ? { ...state.messages, [roomId]: { ...prev, items: mergeMessages(prev.items, [{ ...message, status: undefined }]) } }
          : state.messages,
        rooms: nextRoom ? { ...state.rooms, [roomId]: nextRoom } : state.rooms,
        typing: fromOther ? { ...state.typing, [roomId]: false } : state.typing,
      };
    }

    case 'read': {
      const { roomId, readerId, readAt } = action;
      const prev = roomMessages(state, roomId);
      if (readerId === state.myId) {
        // Я прочитал (в этой или другой вкладке) — счётчик в ноль, входящие прочитаны
        const room = state.rooms[roomId];
        return {
          ...state,
          rooms: room ? { ...state.rooms, [roomId]: { ...room, unreadCount: 0 } } : state.rooms,
          messages: state.messages[roomId]
            ? { ...state.messages, [roomId]: { ...prev, items: prev.items.map((m) => (m.sender !== state.myId && !m.readAt ? { ...m, readAt } : m)) } }
            : state.messages,
        };
      }
      // Собеседник прочитал мои сообщения — ✓✓
      return {
        ...state,
        messages: {
          ...state.messages,
          [roomId]: { ...prev, items: prev.items.map((m) => (m.sender === state.myId && !m.readAt && !m.status ? { ...m, readAt } : m)) },
        },
      };
    }

    case 'typing':
      return { ...state, typing: { ...state.typing, [action.roomId]: action.typing } };

    default:
      return state;
  }
};

/** Диалоги: свежие сверху */
export const sortedRooms = (state: ChatState): ChatRoom[] =>
  Object.values(state.rooms).sort((a, b) => (b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt));

export const totalUnread = (state: ChatState): number =>
  Object.values(state.rooms).reduce((sum, r) => sum + (r.unreadCount || 0), 0);
