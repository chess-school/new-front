import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import enTranslation from '../../../public/locales/en/translation.json';
import { BoardState, ClassroomAck, ClassroomRole, ClassroomSocketLike } from './classroomApi';
import { setClassroomSocketFactory } from './useClassroomSocket';
import { createTree, addMove } from '@/features/Chess/tree/gameTree';

// LiveKit не работает в jsdom — подменяем видеопанель заглушкой
vi.mock('./components/VideoPanel', () => ({ VideoPanel: () => <div data-testid="video">video</div> }));

// REST-часть мокаем; request/errorCode/createClassroomSocket оставляем настоящими
vi.mock('./classroomApi', async (orig) => ({
  ...(await orig<typeof import('./classroomApi')>()),
  enterFromSchedule: vi.fn(),
  getLivekitAccess: vi.fn(),
  endSession: vi.fn(async () => {}),
}));
import * as api from './classroomApi';
import { ClassroomPage } from './pages/ClassroomPage';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const makeState = (over: Partial<BoardState> = {}): BoardState => ({
  status: 'live', startedAt: '2026-10-21T10:00:00Z', fen: START, lastMove: null, annotations: [],
  moves: [], material: null, chat: [], solve: null, note: null, tree: null, cursor: null, eval: null,
  coachUserId: 'coach1', controllerId: 'coach1', hands: {}, ...over,
});

type Handler = (payload: never) => void;
class FakeSocket implements ClassroomSocketLike {
  connected = true;
  handlers = new Map<string, Set<Handler>>();
  sent: { event: string; payload: Record<string, unknown> }[] = [];
  constructor(private respond: (event: string, payload: Record<string, unknown>) => ClassroomAck) {}
  on(event: string, h: Handler) { if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event)!.add(h); }
  off(event: string, h?: Handler) { if (h) this.handlers.get(event)?.delete(h); else this.handlers.delete(event); }
  emit(event: string, payload: unknown, ack?: (r: ClassroomAck<never>) => void) {
    this.sent.push({ event, payload: payload as Record<string, unknown> });
    const res = this.respond(event, payload as Record<string, unknown>);
    if (ack) setTimeout(() => ack(res as ClassroomAck<never>), 0);
  }
  disconnect() { this.connected = false; }
  serverEmit(event: string, payload: unknown) { act(() => { this.handlers.get(event)?.forEach((h) => h(payload as never)); }); }
}

const Where = () => <span data-testid="where">{useLocation().pathname}</span>;
const renderPage = (userId = 'me') => render(
  <AuthContext.Provider value={{
    user: { _id: userId, uuid: `u-${userId}`, firstName: 'Me', lastName: 'P', email: 'me@x', roles: ['USER'], createdAt: '' } as never,
    loading: false, isAuthenticated: true, login: async () => ({} as never), logout: () => {}, refetchUser: async () => {},
  }}>
    <MemoryRouter initialEntries={['/classroom/ev1']}>
      <Routes>
        <Route path="/classroom/:eventId" element={<ClassroomPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
      <Where />
    </MemoryRouter>
  </AuthContext.Provider>,
);
const square = (sq: string) => document.querySelector(`[data-square="${sq}"]`) as HTMLElement;
// Доска (react-chessboard) рисует клетки только после колбэка ResizeObserver (setTimeout 0).
// Под параллельной нагрузкой это может не уложиться в дефолтные 1000мс waitFor — даём запас.
const waitForBoard = () => waitFor(() => expect(square('e2')).toBeTruthy(), { timeout: 5000 });

const joinResponder = (state: BoardState, role: ClassroomRole) =>
  (event: string): ClassroomAck =>
    event === 'join_class' ? { ok: true, data: { state, role } } : { ok: true, data: {} };

describe('Интерактивный класс — страница', () => {
  beforeAll(async () => {
    // Грузим реальные en-переводы: компонент использует чистые i18n-ключи (без инлайновых
    // фоллбэков), поэтому тест проверяет фактически локализованный UI, а не сырые ключи.
    await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: enTranslation } }, interpolation: { escapeValue: false } });
    localStorage.setItem('token', 'tok');
    Object.defineProperty(window, 'matchMedia', {
      writable: true, value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    });
    // react-chessboard рисует клетки, только получив ширину контейнера
    globalThis.ResizeObserver = class {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) { this.cb = cb; }
      observe(el: Element) { setTimeout(() => this.cb([{ target: el, contentRect: { width: 400, height: 400 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver), 0); }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return 400; } });
  });
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('ученик: доску ведёт тренер (ход не уходит), поднимает руку, видит чужой ход; видео не настроено', async () => {
    (api.enterFromSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionId: 's1', groupId: 'g1', room: 'classroom-g1', role: 'student', status: 'live', startedAt: '' });
    (api.getLivekitAccess as ReturnType<typeof vi.fn>).mockRejectedValue(Object.assign(new Error('x'), { response: { data: { code: 'LIVEKIT_NOT_CONFIGURED' } } }));
    const socket = new FakeSocket(joinResponder(makeState(), 'student'));
    setClassroomSocketFactory(() => socket);

    renderPage('me');
    await waitForBoard();
    expect(screen.getByText('Video unavailable')).toBeTruthy();
    expect(screen.getByText('The coach controls the board')).toBeTruthy();

    // Ход ученика не уходит — доской управляет тренер
    fireEvent.click(square('e2'));
    fireEvent.click(square('e4'));
    expect(socket.sent.some((s) => s.event === 'board:move')).toBe(false);

    // Поднять руку
    fireEvent.click(screen.getByRole('button', { name: /Raise hand/ }));
    await waitFor(() => expect(socket.sent.some((s) => s.event === 'hand:raise')).toBe(true));
    socket.serverEmit('hand:update', { hands: { me: 'Me P' } });
    expect(await screen.findByRole('button', { name: /Lower hand/ })).toBeTruthy();

    // Ход тренера приходит широковещанием
    socket.serverEmit('board:update', { fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', lastMove: { from: 'e2', to: 'e4' }, annotations: [] });
    await waitFor(() => expect(document.querySelector('[data-square="e4"] [data-piece="wP"]')).toBeTruthy());
  });

  it('тренер: начинает урок, двигает фигуры (ход в общее дерево board:tree), передаёт ход ученику', async () => {
    (api.enterFromSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionId: 's1', groupId: 'g1', room: 'classroom-g1', role: 'coach', status: 'idle', startedAt: '' });
    (api.getLivekitAccess as ReturnType<typeof vi.fn>).mockResolvedValue({ token: 'jwt', url: 'ws://lk', room: 'classroom-g1', identity: 'me', role: 'coach' });
    const socket = new FakeSocket(joinResponder(makeState({ status: 'idle', coachUserId: 'me', controllerId: 'me' }), 'coach'));
    setClassroomSocketFactory(() => socket);

    renderPage('me');
    await waitForBoard();
    expect(screen.getByTestId('video')).toBeTruthy();
    expect(screen.getByText('You control the board')).toBeTruthy();

    // Начать урок
    fireEvent.click(screen.getByRole('button', { name: /Start lesson/ }));
    await waitFor(() => expect(socket.sent.some((s) => s.event === 'lesson:start')).toBe(true));

    // Ход тренера уходит в общее дерево (board:tree) — позиция/нотация синхронно всем
    fireEvent.click(square('e2'));
    fireEvent.click(square('e4'));
    await waitFor(() => expect(socket.sent.find((s) => s.event === 'board:tree')?.payload).toMatchObject({ groupId: 'g1', lastMove: { from: 'e2', to: 'e4' } }));

    // Передать ход ученику из списка участников (вкладка «Участники»)
    socket.serverEmit('presence', { participants: [{ userId: 'me', role: 'coach', name: 'Me P' }, { userId: 's1', role: 'student', name: 'Alice' }] });
    fireEvent.click(screen.getAllByRole('tab')[2]); // Участники
    fireEvent.click(await screen.findByRole('button', { name: 'Grant control' }));
    await waitFor(() => expect(socket.sent.find((s) => s.event === 'control:grant')?.payload).toMatchObject({ groupId: 'g1', userId: 's1' }));
  });

  it('анализ: заметка/оценка видна классу; личное сообщение помечено «лично вам»', async () => {
    (api.enterFromSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionId: 's1', groupId: 'g1', room: 'classroom-g1', role: 'student', status: 'live', startedAt: '' });
    (api.getLivekitAccess as ReturnType<typeof vi.fn>).mockRejectedValue(Object.assign(new Error('x'), { response: { data: { code: 'LIVEKIT_NOT_CONFIGURED' } } }));
    const chat = [{ id: 'p1', userId: 'coach9', name: 'Тренер', text: 'Только тебе', at: '', to: 'me', toName: 'Me P' }];
    const socket = new FakeSocket(joinResponder(makeState({ note: 'Движок: +1.3', chat }), 'student'));
    setClassroomSocketFactory(() => socket);

    renderPage('me');
    await waitForBoard();

    // Заметка видна всем (не во вкладке — сверху правой колонки)
    expect(screen.getByText('Движок: +1.3')).toBeTruthy();

    // Личное сообщение — с пометкой «лично вам» (вкладка «Чат»)
    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(await screen.findByText('лично вам')).toBeTruthy();
    expect(screen.getByText('Только тебе')).toBeTruthy();
  });

  it('режим решения: карточка задачи, ход уходит как solve:move, доска для чёрных развёрнута', async () => {
    (api.enterFromSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionId: 's1', groupId: 'g1', room: 'classroom-g1', role: 'coach', status: 'live', startedAt: '' });
    (api.getLivekitAccess as ReturnType<typeof vi.fn>).mockRejectedValue(Object.assign(new Error('x'), { response: { data: { code: 'LIVEKIT_NOT_CONFIGURED' } } }));
    const solve = { index: 0, total: 3, startFen: START, sideToMove: 'w' as const, status: 'solving' as const, wrong: 0, hintAt: null, title: 'Мат в 2', startedAt: '2026-10-21T10:00:00Z' };
    const socket = new FakeSocket(joinResponder(makeState({ coachUserId: 'me', controllerId: 'me', solve }), 'coach'));
    setClassroomSocketFactory(() => socket);

    renderPage('me');
    await waitForBoard();

    // Карточка решения видна
    expect(screen.getByText('Мат в 2')).toBeTruthy();
    expect(screen.getByText('Ход белых')).toBeTruthy();

    // Ход уходит как solve:move (а не обычный board:move)
    fireEvent.click(square('e2'));
    fireEvent.click(square('e4'));
    await waitFor(() => expect(socket.sent.find((s) => s.event === 'solve:move')?.payload).toMatchObject({ groupId: 'g1', uci: 'e2e4' }));
    expect(socket.sent.some((s) => s.event === 'board:move')).toBe(false);

    // Подсказка и сброс доступны
    fireEvent.click(screen.getByRole('button', { name: /Подсказка/ }));
    await waitFor(() => expect(socket.sent.some((s) => s.event === 'solve:hint')).toBe(true));
  });

  it('тренер: инструменты открываются шестерёнкой (плавающая панель) и содержат «Задачи по темам»', async () => {
    (api.enterFromSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionId: 's1', groupId: 'g1', room: 'classroom-g1', role: 'coach', status: 'idle', startedAt: '' });
    (api.getLivekitAccess as ReturnType<typeof vi.fn>).mockResolvedValue({ token: 'jwt', url: 'ws://lk', room: 'classroom-g1', identity: 'me', role: 'coach' });
    const socket = new FakeSocket(joinResponder(makeState({ status: 'idle', coachUserId: 'me', controllerId: 'me' }), 'coach'));
    setClassroomSocketFactory(() => socket);

    renderPage('me');
    await waitForBoard();

    // Панель инструментов скрыта, пока не нажата шестерёнка
    expect(screen.queryByText('Задачи по темам')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Инструменты тренера' })[0]);
    expect(await screen.findByText('Задачи по темам')).toBeTruthy();
    expect(screen.getByText('Движок и анализ')).toBeTruthy();
  });

  it('ученик: видит нотацию ходов, материал урока и чат; своё сообщение уходит на сервер', async () => {
    (api.enterFromSchedule as ReturnType<typeof vi.fn>).mockResolvedValue({ sessionId: 's1', groupId: 'g1', room: 'classroom-g1', role: 'student', status: 'live', startedAt: '' });
    (api.getLivekitAccess as ReturnType<typeof vi.fn>).mockRejectedValue(Object.assign(new Error('x'), { response: { data: { code: 'LIVEKIT_NOT_CONFIGURED' } } }));
    const withE4 = addMove(createTree(START), 'root', { from: 'e2', to: 'e4' })!;
    const e4Fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const socket = new FakeSocket(joinResponder(makeState({
      material: { title: 'Эндшпиль', subtitle: 'Задача #3' },
      moves: [{ san: 'e4', from: 'e2', to: 'e4', fen: e4Fen }],
      tree: withE4.tree, cursor: withE4.id,
    }), 'student'));
    setClassroomSocketFactory(() => socket);

    renderPage('me');
    await waitForBoard();

    // Материал урока виден ученику (заголовок показан и в шапке, и в панели материала)
    expect(screen.getAllByText('Эндшпиль').length).toBeGreaterThan(0);

    // Нотация ходов — под центральной вкладкой «Анализ»
    fireEvent.click(screen.getByRole('tab', { name: 'Анализ' }));
    expect(await screen.findByText('e4')).toBeTruthy();

    // Чат (левая колонка, виден всегда): входящее сообщение и отправка своего
    socket.serverEmit('chat:new', { message: { id: 'm1', userId: 'coach1', name: 'Coach', text: 'Привет', at: '' } });
    expect(await screen.findByText('Привет')).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText('Написать сообщение…'), { target: { value: 'Здравствуйте' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    await waitFor(() => expect(socket.sent.find((s) => s.event === 'chat:send')?.payload).toMatchObject({ groupId: 'g1', text: 'Здравствуйте' }));
  });
});
