import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { ChatAck, ChatSocketLike } from './chatSocket';
import { ChatMessage, ChatRoom } from './chatTypes';

vi.mock('@/api/chat', () => ({
  getChatRooms: vi.fn(),
  getChatMessages: vi.fn(),
  getChatContacts: vi.fn(),
  openChatRoom: vi.fn(),
  sendChatMessage: vi.fn(),
  markChatRead: vi.fn(),
  getChatUnread: vi.fn(),
}));
vi.mock('./notify', () => ({ playMessageTone: vi.fn(), setTitleBadge: vi.fn() }));

import * as api from '@/api/chat';
import * as notify from './notify';
import { ChatProvider } from './ChatProvider';
import { ChatDrawer } from './ChatDrawer';
import { ChatButton } from './ChatButton';
import { useChat } from './chatContext';

const ME = 'student-1';
const COACH = { _id: 'coach-1', uuid: 'u-c', firstName: 'Anna', lastName: 'Coach', avatarUrl: null };

/** Фейковый socket.io: записывает emit, события сервера подаются через serverEmit */
class FakeSocket implements ChatSocketLike {
  connected = true;
  handlers = new Map<string, Set<(payload: never) => void>>();
  sent: { event: string; payload: unknown; ack?: (r: ChatAck<never>) => void }[] = [];
  disconnected = false;
  on(event: string, fn: (payload: never) => void) { (this.handlers.get(event) ?? this.handlers.set(event, new Set()).get(event)!).add(fn); }
  off(event: string, fn?: (payload: never) => void) { if (fn) this.handlers.get(event)?.delete(fn); else this.handlers.delete(event); }
  emit(event: string, payload: unknown, ack?: (r: ChatAck<never>) => void) { this.sent.push({ event, payload, ack }); }
  disconnect() { this.disconnected = true; this.connected = false; }
  serverEmit(event: string, payload: unknown) { this.handlers.get(event)?.forEach((fn) => (fn as (p: unknown) => void)(payload)); }
  last(event: string) { return [...this.sent].reverse().find((s) => s.event === event); }
}

const directRoom: ChatRoom = {
  _id: 'room-1', context: { kind: 'direct' }, interlocutor: COACH, unreadCount: 2,
  lastMessage: { text: 'Как дела с задачей?', sender: COACH._id, createdAt: '2026-10-20T09:00:00.000Z' },
  lastMessageAt: '2026-10-20T09:00:00.000Z', createdAt: '2026-10-01T09:00:00.000Z',
};
const history: ChatMessage[] = [
  { _id: 'm1', room: 'room-1', sender: ME, text: 'Здравствуйте!', createdAt: '2026-10-19T18:00:00.000Z', readAt: '2026-10-19T18:01:00.000Z' },
  { _id: 'm2', room: 'room-1', sender: COACH._id, text: 'Привет', createdAt: '2026-10-20T08:59:00.000Z', readAt: null },
  { _id: 'm3', room: 'room-1', sender: COACH._id, text: 'Как дела с задачей?', createdAt: '2026-10-20T09:00:00.000Z', readAt: null },
];

let socket: FakeSocket;
let chatApi: ReturnType<typeof useChat>;
const Probe = () => { chatApi = useChat(); return null; };

const mount = () => render(
  <AuthContext.Provider value={{
    user: { _id: ME, uuid: 'u-s', firstName: 'Ivan', lastName: 'Student', email: 's@x', roles: ['USER'], createdAt: '' } as never,
    loading: false, isAuthenticated: true, login: async () => ({} as never), logout: () => {}, refetchUser: async () => {},
  }}>
    <ChatProvider socketFactory={() => socket}>
      <ChatButton />
      <ChatDrawer />
      <Probe />
    </ChatProvider>
  </AuthContext.Provider>,
);

beforeAll(async () => {
  await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: {} } }, interpolation: { escapeValue: false } });
});

afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.setItem('token', 'jwt');
  socket = new FakeSocket();
  vi.mocked(api.getChatRooms).mockResolvedValue([directRoom]);
  vi.mocked(api.getChatMessages).mockResolvedValue({ data: history, hasMore: false });
  vi.mocked(api.getChatContacts).mockResolvedValue([{ ...COACH, relation: 'coach' }]);
});

describe('ChatDrawer + ChatProvider', () => {
  it('бейдж непрочитанного, диалог, прочтение, оптимистичная отправка, эхо без дубля, ✓✓ и «печатает»', async () => {
    mount();
    const badge = await screen.findByTestId('chat-unread-badge');
    await waitFor(() => expect(within(badge).getByText('2')).toBeTruthy());
    expect(notify.setTitleBadge).toHaveBeenLastCalledWith(2);

    fireEvent.click(screen.getByTestId('chat-button'));
    const roomRow = await screen.findByTestId('chat-room');
    expect(within(roomRow).getByTestId('chat-room-unread').textContent).toBe('2');
    fireEvent.click(roomRow);

    await screen.findByText('Как дела с задачей?', { selector: 'p' });
    expect(api.getChatMessages).toHaveBeenCalledWith('room-1');
    // Даты-разделители: вчера и сегодня
    expect(screen.getAllByTestId('chat-day')).toHaveLength(2);
    // Открыли диалог на видимой вкладке — прочитано (через сокет), бейдж в ноль
    await waitFor(() => expect(socket.last('message:read')?.payload).toEqual({ roomId: 'room-1' }));
    await waitFor(() => expect(notify.setTitleBadge).toHaveBeenLastCalledWith(0));

    // Enter — отправить
    const input = screen.getByRole('textbox', { name: 'Write a message…' });
    fireEvent.change(input, { target: { value: 'Решил, проверьте' } });
    expect(socket.last('typing')?.payload).toEqual({ roomId: 'room-1', typing: true });
    fireEvent.keyDown(input, { key: 'Enter' });
    const sendCall = socket.last('message:send')!;
    const { clientId } = sendCall.payload as { clientId: string };
    expect(sendCall.payload).toMatchObject({ roomId: 'room-1', text: 'Решил, проверьте' });
    const mine = () => screen.getAllByTestId('chat-message').filter((el) => el.dataset.mine === 'true' && /Решил/.test(el.textContent || ''));
    expect(mine()).toHaveLength(1);
    expect(mine()[0].querySelector('[data-status="pending"]')).toBeTruthy();
    expect((input as HTMLTextAreaElement).value).toBe('');

    const saved: ChatMessage = { _id: 'srv-9', room: 'room-1', sender: ME, text: 'Решил, проверьте', createdAt: new Date().toISOString(), readAt: null, clientId };
    act(() => { sendCall.ack!({ ok: true, data: saved as never }); });
    act(() => { socket.serverEmit('message:new', { roomId: 'room-1', message: saved }); });
    expect(mine()).toHaveLength(1);
    expect(mine()[0].querySelector('[data-status="sent"]')).toBeTruthy();

    act(() => { socket.serverEmit('message:read', { roomId: 'room-1', readerId: COACH._id, readAt: new Date().toISOString() }); });
    expect(mine()[0].querySelector('[data-status="read"]')).toBeTruthy();

    act(() => { socket.serverEmit('typing', { roomId: 'room-1', userId: COACH._id, typing: true }); });
    expect(screen.getByTestId('chat-typing').textContent).toContain('Anna');

    // Входящее в открытый диалог — сразу прочитано, без звука и без бейджа
    act(() => {
      socket.serverEmit('message:new', { roomId: 'room-1', message: { _id: 'm10', room: 'room-1', sender: COACH._id, text: 'Отлично!', createdAt: new Date().toISOString(), readAt: null } });
    });
    expect(screen.getByText('Отлично!')).toBeTruthy();
    expect(screen.queryByTestId('chat-typing')).toBeNull();
    expect(notify.playMessageTone).not.toHaveBeenCalled();
    await waitFor(() => expect(socket.sent.filter((s) => s.event === 'message:read').length).toBeGreaterThanOrEqual(2));
  });

  it('ошибка отправки -> «не отправлено», повтор с тем же clientId; входящее в закрытую панель — звук и бейдж', async () => {
    mount();
    await waitFor(() => expect(chatApi?.state.rooms['room-1']).toBeTruthy());
    act(() => { chatApi!.openDrawer(); chatApi!.selectRoom('room-1'); });
    const input = await screen.findByRole('textbox', { name: 'Write a message…' });
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const first = socket.last('message:send')!;
    act(() => { first.ack!({ ok: false, error: { msg: 'x', code: 'VALIDATION_ERROR' } } as never); });
    const retry = await screen.findByRole('button', { name: 'Not sent — tap to retry' });
    fireEvent.click(retry);
    const second = socket.last('message:send')!;
    expect(second).not.toBe(first);
    expect((second.payload as { clientId: string }).clientId).toBe((first.payload as { clientId: string }).clientId);

    act(() => { chatApi!.closeDrawer(); });
    act(() => {
      socket.serverEmit('message:new', { roomId: 'room-1', message: { _id: 'm20', room: 'room-1', sender: COACH._id, text: 'Новое', createdAt: new Date().toISOString(), readAt: null } });
    });
    expect(notify.playMessageTone).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(within(screen.getByTestId('chat-unread-badge')).getByText('1')).toBeTruthy());
  });

  it('openChat без собеседника: единственный тренер, тема домашки — чип в шапке; без сокета — отправка по REST', async () => {
    socket.connected = false;
    const homeworkRoom: ChatRoom = { ...directRoom, _id: 'room-hw', unreadCount: 0, lastMessage: null, lastMessageAt: null, context: { kind: 'homework', refId: 'as-1', title: 'Ладейные окончания' } };
    vi.mocked(api.openChatRoom).mockResolvedValue(homeworkRoom);
    vi.mocked(api.getChatMessages).mockResolvedValue({ data: [], hasMore: false });
    vi.mocked(api.sendChatMessage).mockImplementation(async (roomId, text, clientId) => ({ _id: 'rest-1', room: roomId, sender: ME, text, clientId, createdAt: new Date().toISOString(), readAt: null }));
    mount();
    await waitFor(() => expect(chatApi?.available).toBe(true));
    await act(async () => { await chatApi!.openChat({ context: { kind: 'homework', refId: 'as-1', title: 'Ладейные окончания' } }); });
    expect(api.openChatRoom).toHaveBeenCalledWith(COACH._id, { kind: 'homework', refId: 'as-1', title: 'Ладейные окончания' });
    expect((await screen.findByTestId('chat-context-chip')).textContent).toBe('Homework: Ладейные окончания');

    const input = await screen.findByRole('textbox', { name: 'Write a message…' });
    fireEvent.change(input, { target: { value: 'Вопрос по третьему ходу' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(api.sendChatMessage).toHaveBeenCalledWith('room-hw', 'Вопрос по третьему ходу', expect.stringMatching(/^c-/)));
    await waitFor(() => expect(document.querySelector('[data-status="sent"]')).toBeTruthy());
    expect(socket.sent.find((s) => s.event === 'message:send')).toBeUndefined();
  });

  it('несколько тренеров — выбор собеседника с запомненной темой; пустое состояние без контактов', async () => {
    vi.mocked(api.getChatRooms).mockResolvedValue([]);
    vi.mocked(api.getChatContacts).mockResolvedValue([{ ...COACH, relation: 'coach' }, { ...COACH, _id: 'coach-2', firstName: 'Boris', relation: 'coach' }]);
    vi.mocked(api.openChatRoom).mockResolvedValue({ ...directRoom, _id: 'room-p', unreadCount: 0, context: { kind: 'puzzle', refId: 'book-1', title: 'Exercise 1' } });
    mount();
    await waitFor(() => expect(chatApi?.available).toBe(true));
    await act(async () => { await chatApi!.openChat({ context: { kind: 'puzzle', refId: 'book-1', title: 'Exercise 1' } }); });
    expect(screen.getByTestId('chat-pick-coach')).toBeTruthy();
    expect(api.openChatRoom).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByTestId('chat-contact')[1]);
    await waitFor(() => expect(api.openChatRoom).toHaveBeenCalledWith('coach-2', { kind: 'puzzle', refId: 'book-1', title: 'Exercise 1' }));

    vi.mocked(api.getChatContacts).mockResolvedValue([]);
    act(() => { chatApi!.selectRoom(null); });
    await act(async () => { await chatApi!.openChat({ context: { kind: 'puzzle', refId: 'book-2' } }); });
    act(() => { chatApi!.selectRoom(null); });
  });
});
