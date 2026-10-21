import axiosInstance from '@/api';
import { ChatContact, ChatContext, ChatMessage, ChatRoom, ChatUnread } from '@/features/Chat/chatTypes';

// ---------- Личные сообщения (/api/v2/chat), см. backend/docs/CHAT_API.md ----------

export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await axiosInstance.get('/chat/rooms');
  return response.data.data;
};

/** Найти или создать диалог с пользователем (идемпотентно) */
export const openChatRoom = async (userId: string, context?: ChatContext): Promise<ChatRoom> => {
  const response = await axiosInstance.post('/chat/rooms', { userId, ...(context && context.kind !== 'direct' ? { context } : {}) });
  return response.data.data;
};

/** История: без before — самые свежие; before — id первого загруженного сообщения */
export const getChatMessages = async (roomId: string, params: { before?: string; limit?: number } = {}): Promise<{ data: ChatMessage[]; hasMore: boolean }> => {
  const response = await axiosInstance.get(`/chat/rooms/${roomId}/messages`, { params });
  return response.data;
};

export const sendChatMessage = async (roomId: string, text: string, clientId?: string): Promise<ChatMessage> => {
  const response = await axiosInstance.post(`/chat/rooms/${roomId}/messages`, { text, ...(clientId ? { clientId } : {}) });
  return response.data.data;
};

export const markChatRead = async (roomId: string): Promise<{ updated: number; readAt: string }> => {
  const response = await axiosInstance.post(`/chat/rooms/${roomId}/read`);
  return response.data.data;
};

export const getChatUnread = async (): Promise<ChatUnread> => {
  const response = await axiosInstance.get('/chat/unread');
  return response.data.data;
};

export const getChatContacts = async (): Promise<ChatContact[]> => {
  const response = await axiosInstance.get('/chat/contacts');
  return response.data.data;
};
