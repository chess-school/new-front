// Типы модуля личных сообщений (ответы /api/v2/chat и события socket.io /chat)

export type ChatContextKind = 'direct' | 'puzzle' | 'homework' | 'book';

export interface ChatContext {
  kind: ChatContextKind;
  /** id задачи / задания / книги */
  refId?: string;
  /** Подпись для шапки диалога */
  title?: string;
}

export interface ChatUser {
  _id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface ChatContact extends ChatUser {
  /** Кем собеседник приходится мне */
  relation: 'student' | 'coach';
}

export interface ChatMessage {
  _id: string;
  room: string;
  sender: string;
  text: string;
  createdAt: string;
  readAt: string | null;
  clientId?: string;
  /** Только на клиенте: оптимистичная отправка ещё не подтверждена / не удалась */
  status?: 'pending' | 'failed';
}

export interface ChatRoom {
  _id: string;
  context: ChatContext;
  interlocutor: ChatUser | null;
  lastMessage: { text: string; sender: string; createdAt: string } | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
}

export interface ChatUnread {
  total: number;
  rooms: Record<string, number>;
}

/** Что передать в openChat(): с кем и о чём */
export interface OpenChatOptions {
  /** Собеседник; без него — единственный тренер ученика (или выбор из контактов) */
  withUserId?: string;
  context?: ChatContext;
}
