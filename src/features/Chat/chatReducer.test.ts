import { describe, expect, it } from 'vitest';
import { chatReducer, ChatState, initialChatState, mergeMessages, sortedRooms, totalUnread } from './chatReducer';
import { ChatMessage, ChatRoom } from './chatTypes';

const ME = 'me';
const OTHER = 'coach';

const room = (id: string, extra: Partial<ChatRoom> = {}): ChatRoom => ({
  _id: id, context: { kind: 'direct' }, unreadCount: 0, lastMessage: null, lastMessageAt: null, createdAt: '2026-10-01T10:00:00.000Z',
  interlocutor: { _id: OTHER, uuid: 'u', firstName: 'Anna', lastName: 'Coach', avatarUrl: null }, ...extra,
});
const msg = (id: string, sender: string, at: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  _id: id, room: 'r1', sender, text: id, createdAt: at, readAt: null, ...extra,
});

const withRoom = (extra: Partial<ChatRoom> = {}): ChatState =>
  chatReducer(chatReducer(initialChatState(ME), { type: 'roomsLoaded', rooms: [room('r1', extra)] }),
    { type: 'messagesLoaded', roomId: 'r1', items: [], hasMore: false, older: false });

describe('chatReducer', () => {
  it('оптимистичная отправка: pending -> подтверждение по ack -> эхо из сокета, всё одно сообщение', () => {
    let s = withRoom();
    s = chatReducer(s, { type: 'sendStarted', message: msg('c-1', ME, '2026-10-20T10:00:00.000Z', { clientId: 'c-1' }) });
    expect(s.messages.r1.items).toHaveLength(1);
    expect(s.messages.r1.items[0].status).toBe('pending');
    expect(s.rooms.r1.lastMessage?.text).toBe('c-1');

    const saved = msg('srv-1', ME, '2026-10-20T10:00:01.000Z', { text: 'c-1', clientId: 'c-1' });
    s = chatReducer(s, { type: 'sendConfirmed', clientId: 'c-1', message: saved });
    expect(s.messages.r1.items).toEqual([expect.objectContaining({ _id: 'srv-1', clientId: 'c-1', status: undefined })]);

    // Эхо того же сообщения (во все вкладки отправителя) и повтор после переподключения
    s = chatReducer(s, { type: 'incoming', roomId: 'r1', message: saved });
    s = chatReducer(s, { type: 'incoming', roomId: 'r1', message: { ...saved, clientId: undefined } });
    expect(s.messages.r1.items).toHaveLength(1);
    expect(totalUnread(s)).toBe(0);
  });

  it('эхо пришло раньше ack — дубля нет', () => {
    let s = withRoom();
    s = chatReducer(s, { type: 'sendStarted', message: msg('c-2', ME, '2026-10-20T10:00:00.000Z', { clientId: 'c-2' }) });
    const saved = msg('srv-2', ME, '2026-10-20T10:00:01.000Z', { clientId: 'c-2' });
    s = chatReducer(s, { type: 'incoming', roomId: 'r1', message: saved });
    s = chatReducer(s, { type: 'sendConfirmed', clientId: 'c-2', message: saved });
    expect(s.messages.r1.items.map((m) => m._id)).toEqual(['srv-2']);
    expect(s.messages.r1.items[0].status).toBeUndefined();
  });

  it('неудачная отправка помечается failed', () => {
    let s = withRoom();
    s = chatReducer(s, { type: 'sendStarted', message: msg('c-3', ME, '2026-10-20T10:00:00.000Z', { clientId: 'c-3' }) });
    s = chatReducer(s, { type: 'sendFailed', roomId: 'r1', clientId: 'c-3' });
    expect(s.messages.r1.items[0].status).toBe('failed');
  });

  it('счётчик непрочитанных: растёт на входящие, не растёт в открытом диалоге и на дубли', () => {
    let s = withRoom({ unreadCount: 2 });
    const incoming = msg('m1', OTHER, '2026-10-20T11:00:00.000Z');
    s = chatReducer(s, { type: 'incoming', roomId: 'r1', message: incoming });
    s = chatReducer(s, { type: 'incoming', roomId: 'r1', message: incoming });
    expect(s.rooms.r1.unreadCount).toBe(3);
    expect(totalUnread(s)).toBe(3);

    s = chatReducer(s, { type: 'setActive', roomId: 'r1' });
    s = chatReducer(s, { type: 'setViewing', viewing: true });
    s = chatReducer(s, { type: 'incoming', roomId: 'r1', message: msg('m2', OTHER, '2026-10-20T11:01:00.000Z') });
    expect(s.rooms.r1.unreadCount).toBe(3);
    expect(s.rooms.r1.lastMessage?.text).toBe('m2');
  });

  it('прочтение: собеседник — мои ✓✓; я (в любой вкладке) — счётчик в ноль', () => {
    let s = withRoom({ unreadCount: 1 });
    s = chatReducer(s, { type: 'messagesLoaded', roomId: 'r1', items: [msg('a', ME, '2026-10-20T09:00:00.000Z'), msg('b', OTHER, '2026-10-20T09:01:00.000Z')], hasMore: false, older: false });
    s = chatReducer(s, { type: 'read', roomId: 'r1', readerId: OTHER, readAt: '2026-10-20T09:05:00.000Z' });
    expect(s.messages.r1.items.find((m) => m._id === 'a')?.readAt).toBe('2026-10-20T09:05:00.000Z');
    expect(s.messages.r1.items.find((m) => m._id === 'b')?.readAt).toBeNull();
    s = chatReducer(s, { type: 'read', roomId: 'r1', readerId: ME, readAt: '2026-10-20T09:06:00.000Z' });
    expect(s.rooms.r1.unreadCount).toBe(0);
    expect(s.messages.r1.items.find((m) => m._id === 'b')?.readAt).toBe('2026-10-20T09:06:00.000Z');
  });

  it('пагинация: старые страницы сливаются по времени, hasMore — от последней старой страницы', () => {
    let s = chatReducer(withRoom(), { type: 'messagesLoaded', roomId: 'r1', items: [msg('n2', OTHER, '2026-10-20T12:02:00.000Z'), msg('n3', ME, '2026-10-20T12:03:00.000Z')], hasMore: true, older: false });
    // ws-сообщение до догрузки
    s = chatReducer(s, { type: 'messagesLoaded', roomId: 'r1', items: [msg('n1', OTHER, '2026-10-20T12:01:00.000Z')], hasMore: false, older: true });
    expect(s.messages.r1.items.map((m) => m._id)).toEqual(['n1', 'n2', 'n3']);
    expect(s.messages.r1.hasMore).toBe(false);
    // Перезагрузка свежей страницы после переподключения не возвращает hasMore
    s = chatReducer(s, { type: 'messagesLoaded', roomId: 'r1', items: [msg('n3', ME, '2026-10-20T12:03:00.000Z')], hasMore: true, older: false });
    expect(s.messages.r1.hasMore).toBe(false);
    expect(s.messages.r1.items).toHaveLength(3);
  });

  it('входящее в незагруженную комнату не начинает историю с середины; сортировка комнат по свежести', () => {
    let s = chatReducer(initialChatState(ME), { type: 'roomsLoaded', rooms: [room('r1', { lastMessageAt: '2026-10-19T10:00:00.000Z' }), room('r2', { lastMessageAt: '2026-10-18T10:00:00.000Z' })] });
    s = chatReducer(s, { type: 'incoming', roomId: 'r2', message: { ...msg('x', OTHER, '2026-10-20T10:00:00.000Z'), room: 'r2' } });
    expect(s.messages.r2).toBeUndefined();
    expect(s.rooms.r2.unreadCount).toBe(1);
    expect(sortedRooms(s).map((r) => r._id)).toEqual(['r2', 'r1']);
  });

  it('mergeMessages не теряет порядок и заменяет по clientId', () => {
    const merged = mergeMessages(
      [msg('c-9', ME, '2026-10-20T10:00:05.000Z', { clientId: 'c-9', status: 'pending' }), msg('a', OTHER, '2026-10-20T10:00:00.000Z')],
      [msg('srv-9', ME, '2026-10-20T10:00:06.000Z', { clientId: 'c-9' })],
    );
    expect(merged.map((m) => m._id)).toEqual(['a', 'srv-9']);
  });
});
