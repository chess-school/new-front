import { createContext, useContext } from 'react';
import { ChatState } from './chatReducer';
import { ChatContact, ChatContext as ChatTopic, ChatMessage, OpenChatOptions } from './chatTypes';

export interface ChatContextValue {
  /** Чат доступен (пользователь вошёл) */
  available: boolean;
  state: ChatState;
  isOpen: boolean;
  connected: boolean;
  unread: number;
  contacts: ChatContact[];
  /** Тема, для которой выбирается собеседник (несколько тренеров у ученика) */
  pendingContext: ChatTopic | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Открыть панель и диалог: с кем (по умолчанию — свой тренер) и о чём */
  openChat: (options?: OpenChatOptions) => Promise<void>;
  selectRoom: (roomId: string | null) => void;
  startWith: (contact: ChatContact) => Promise<void>;
  send: (text: string) => void;
  retry: (message: ChatMessage) => void;
  loadOlder: () => Promise<void>;
  setTyping: (typing: boolean) => void;
}

export const ChatCtx = createContext<ChatContextValue | null>(null);

/**
 * Доступ к чату из любой страницы:
 *   const { openChat } = useChat();
 *   openChat({ context: { kind: 'puzzle', refId: puzzle._id, title: 'Задача #12' } });
 * Вне ChatProvider возвращает null.
 */
export const useChat = () => useContext(ChatCtx);
