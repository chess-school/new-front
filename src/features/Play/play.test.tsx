import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import { formatClock, remainingMs } from './clock';
import { initialPlayState, playReducer, PlayState } from './gameReducer';
import { Ack, ClockState, PlayGame } from './playTypes';
import { PlaySocketLike } from './playApi';
import { setPlaySocketFactory } from './usePlaySocket';
import { PlayGamePage } from './pages/PlayGamePage';
import { PlayLobbyPage } from './pages/PlayLobbyPage';

vi.mock('./sounds', () => ({ sounds: { move: vi.fn(), capture: vi.fn(), check: vi.fn(), start: vi.fn(), end: vi.fn(), lowTime: vi.fn() }, playMoveSound: vi.fn(), isMuted: () => false, setMuted: vi.fn() }));
vi.mock('./playApi', async (orig) => ({
  ...(await orig<typeof import('./playApi')>()),
  getPlayOverview: vi.fn(async () => ({ ratings: { bullet: { rating: 1500, rd: 350, games: 0, provisional: true }, blitz: { rating: 1623, rd: 80, games: 12, provisional: false }, rapid: { rating: 1500, rd: 350, games: 0, provisional: true }, classical: { rating: 1500, rd: 350, games: 0, provisional: true } }, activeGames: [], challenges: [] })),
  getOpenChallenges: vi.fn(async () => []),
  createChallenge: vi.fn(async () => ({ _id: 'ch1' })),
  acceptChallenge: vi.fn(async () => 'g1'),
}));
import * as api from './playApi';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const clock = (over: Partial<ClockState> = {}): ClockState => ({ whiteMs: 180000, blackMs: 180000, turn: 'white', running: false, serverNow: 0, ...over });
const player = (id: string, firstName: string, rating = 1500) => ({ _id: id, uuid: `u-${id}`, firstName, lastName: 'P', avatarUrl: null, rating, provisional: false });
const makeGame = (over: Partial<PlayGame> = {}): PlayGame => ({
  _id: 'g1', status: 'active', source: 'challenge', isPrivate: true, isRated: true,
  timeControl: { type: 'blitz', initialSeconds: 180, incrementSeconds: 2, custom: false },
  creatorColor: 'white', createdBy: { _id: 'me', uuid: 'u-me', firstName: 'Me', lastName: 'P' },
  white: player('me', 'Me'), black: player('opp', 'Opponent', 1610), fen: START, moves: [], sanMoves: [], clock: clock(),
  drawOfferBy: null, winner: null, endReason: null, ratingChanges: null, ratings: null, rematchOf: null, pgn: '', abortTimeoutMs: 30000, ...over,
});

describe('часы', () => {
  it('формат: часы, минуты, десятые при < 10 с', () => {
    expect(formatClock(3 * 3600000 + 5 * 60000 + 9000)).toBe('3:05:09');
    expect(formatClock(247000)).toBe('4:07');
    expect(formatClock(42000)).toBe('0:42');
    expect(formatClock(9340)).toBe('9.3');
    expect(formatClock(-5)).toBe('0.0');
  });
  it('тикает только у стороны, чей ход, и только пока часы идут', () => {
    const c = clock({ whiteMs: 60000, blackMs: 50000, turn: 'white', running: true });
    expect(remainingMs(c, 'white', 1000, 4000)).toBe(57000);
    expect(remainingMs(c, 'black', 1000, 4000)).toBe(50000);
    expect(remainingMs({ ...c, running: false }, 'white', 1000, 4000)).toBe(60000);
    expect(remainingMs(c, 'white', 1000, 999999)).toBe(0);
  });
});

describe('редьюсер партии', () => {
  const base = (): PlayState => playReducer(initialPlayState, { type: 'snapshot', game: makeGame(), at: 0 });

  it('свой ход сразу на доске; эхо сервера подтверждает и приносит серверные часы', () => {
    let s = playReducer(base(), { type: 'localMove', uci: 'e2e4', at: 100 });
    expect(s.game!.sanMoves).toEqual(['e4']);
    expect(s.pendingPly).toBe(1);
    expect(s.game!.clock.turn).toBe('black');
    s = playReducer(s, { type: 'move', event: { gameId: 'g1', uci: 'e2e4', san: 'e4', fen: s.game!.fen, ply: 1, clock: clock({ turn: 'black' }), drawOfferBy: null }, at: 150 });
    expect(s.pendingPly).toBeNull();
    expect(s.game!.moves).toEqual(['e2e4']);
  });

  it('ход соперника добавляется; пропуск хода или расхождение — пересинхронизация', () => {
    const s = playReducer(base(), { type: 'move', event: { gameId: 'g1', uci: 'e2e4', san: 'e4', fen: 'x', ply: 1, clock: clock(), drawOfferBy: null }, at: 1 });
    expect(s.game!.sanMoves).toEqual(['e4']);
    expect(playReducer(s, { type: 'move', event: { gameId: 'g1', uci: 'g1f3', san: 'Nf3', fen: 'y', ply: 3, clock: clock(), drawOfferBy: null }, at: 2 }).needsSync).toBe(true);
    expect(playReducer(s, { type: 'move', event: { gameId: 'g1', uci: 'd2d4', san: 'd4', fen: 'y', ply: 1, clock: clock(), drawOfferBy: null }, at: 2 }).needsSync).toBe(true);
    expect(playReducer(s, { type: 'move', event: { gameId: 'other', uci: 'e7e5', san: 'e5', fen: 'y', ply: 2, clock: clock(), drawOfferBy: null }, at: 2 })).toBe(s);
  });

  it('нелегальный локальный ход не меняет партию; свой ход снимает предложение ничьей соперника', () => {
    const s = base();
    expect(playReducer(s, { type: 'localMove', uci: 'e2e5', at: 1 })).toBe(s);
    const offered = playReducer(s, { type: 'drawOffer', by: 'black' });
    expect(playReducer(offered, { type: 'localMove', uci: 'e2e4', at: 1 }).game!.drawOfferBy).toBeNull();
  });
});

// ---------------------------------------------------------------- страницы с фейковым сокетом

type Handler = (payload: never) => void;
class FakeSocket implements PlaySocketLike {
  connected = true;
  handlers = new Map<string, Set<Handler>>();
  sent: { event: string; payload: Record<string, unknown> }[] = [];
  constructor(private respond: (event: string, payload: Record<string, unknown>) => Ack) {}
  on(event: string, h: Handler) { if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event)!.add(h); }
  off(event: string, h?: Handler) { if (h) this.handlers.get(event)?.delete(h); else this.handlers.delete(event); }
  emit(event: string, payload: unknown, ack?: (r: Ack<never>) => void) {
    this.sent.push({ event, payload: payload as Record<string, unknown> });
    const res = this.respond(event, payload as Record<string, unknown>);
    if (ack) setTimeout(() => ack(res as Ack<never>), 0);
  }
  disconnect() { this.connected = false; }
  serverEmit(event: string, payload: unknown) { act(() => { this.handlers.get(event)?.forEach((h) => h(payload as never)); }); }
}

const Where = () => <span data-testid="where">{useLocation().pathname}</span>;
const renderAt = (path: string, ui: React.ReactElement, route: string) => render(
  <AuthContext.Provider value={{
    user: { _id: 'me', uuid: 'u-me', firstName: 'Me', lastName: 'P', email: 'me@x', roles: ['USER'], createdAt: '' } as never,
    loading: false, isAuthenticated: true, login: async () => ({} as never), logout: () => {}, refetchUser: async () => {},
  }}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={ui} />
        <Route path="*" element={<Where />} />
      </Routes>
      <Where />
    </MemoryRouter>
  </AuthContext.Provider>,
);
const square = (sq: string) => document.querySelector(`[data-square="${sq}"]`) as HTMLElement;

describe('страница партии и лобби', () => {
  const realRO = globalThis.ResizeObserver;
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({ lng: 'en', resources: { en: { translation: {} } }, interpolation: { escapeValue: false } });
    localStorage.setItem('token', 'tok');
    globalThis.ResizeObserver = class {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) { this.cb = cb; }
      observe(el: Element) { setTimeout(() => this.cb([{ target: el, contentRect: { width: 400, height: 400 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver), 0); }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return 400; } });
  });
  afterAll(() => { globalThis.ResizeObserver = realRO; });
  afterEach(() => cleanup());

  it('партия: ход с доски уходит на сервер с ply; ответ соперника на доске; ничья; сдача; итог с ΔR и реванш', async () => {
    let game = makeGame();
    const socket = new FakeSocket((event) => (event === 'join_game' ? { ok: true, data: game } : event === 'rematch' ? { ok: true, data: { gameId: 'g2', accepted: false } } : { ok: true, data: {} }));
    setPlaySocketFactory(() => socket);
    renderAt('/play/g1', <PlayGamePage />, '/play/:gameId');
    await waitFor(() => expect(square('e2')).toBeTruthy());
    expect(screen.getByTestId('player-black').textContent).toContain('Opponent');
    expect(screen.getByTestId('player-white').textContent).toContain('you');

    fireEvent.click(square('e2'));
    fireEvent.click(square('e4'));
    await waitFor(() => expect(socket.sent.find((s) => s.event === 'make_move')?.payload).toMatchObject({ gameId: 'g1', uci: 'e2e4', ply: 0 }));
    expect(screen.getByTestId('play-moves').textContent).toContain('e4');
    expect(screen.getByRole('button', { name: 'Abort' })).toBeTruthy(); // до первых ходов обоих — отмена

    socket.serverEmit('move', { gameId: 'g1', uci: 'e2e4', san: 'e4', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', ply: 1, clock: clock({ turn: 'black' }), drawOfferBy: null });
    socket.serverEmit('move', { gameId: 'g1', uci: 'e7e5', san: 'e5', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2', ply: 2, clock: clock({ whiteMs: 8000, turn: 'white', running: true }), drawOfferBy: null });
    await waitFor(() => expect(document.querySelector('[data-square="e5"] [data-piece="bP"]')).toBeTruthy());
    expect(screen.getByTestId('clock-white').getAttribute('data-low')).toBe('true'); // < 10 с — красные часы

    socket.serverEmit('draw_offer', { gameId: 'g1', by: 'black' });
    fireEvent.click(await screen.findByRole('button', { name: 'Decline' }));
    await waitFor(() => expect(socket.sent.some((s) => s.event === 'decline_draw')).toBe(true));

    fireEvent.click(screen.getByRole('button', { name: 'Resign' }));
    fireEvent.click(screen.getByRole('button', { name: 'Resign?' })); // подтверждение
    await waitFor(() => expect(socket.sent.some((s) => s.event === 'resign')).toBe(true));

    game = { ...game, status: 'finished' };
    socket.serverEmit('game_over', {
      gameId: 'g1', status: 'finished', winner: 'black', endReason: 'resignation', pgn: '1. e4 e5 0-1',
      ratingChanges: { white: -9, black: 8 }, ratings: { white: { before: 1500, after: 1491, diff: -9, provisional: false }, black: { before: 1610, after: 1618, diff: 8, provisional: false } },
      clock: clock({ whiteMs: 7000 }),
    });
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('game-over-title').textContent).toBe('You lost');
    expect(within(dialog).getByTestId('delta-white').textContent).toBe('-9');
    expect(within(dialog).getByTestId('delta-black').textContent).toBe('+8');
    expect(screen.getByTestId('rating-diff-white').textContent).toBe('-9');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Rematch' }));
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Rematch offered…' })).toBeTruthy());
    socket.serverEmit('game_started', { gameId: 'g2' });            // соперник принял реванш
    await waitFor(() => expect(screen.getAllByTestId('where').some((w) => w.textContent === '/play/g2')).toBe(true));
  });

  it('вызов по ссылке: гость видит «Принять вызов» — принимает и входит в партию', async () => {
    let game = makeGame({ status: 'created', white: null, black: null, createdBy: { _id: 'friend', uuid: 'u-f', firstName: 'Friend', lastName: 'P' } });
    const socket = new FakeSocket((event) => (event === 'join_game' ? { ok: true, data: game } : { ok: true, data: {} }));
    setPlaySocketFactory(() => socket);
    renderAt('/play/g1', <PlayGamePage />, '/play/:gameId');
    expect(await screen.findByText(/Friend P challenges you/)).toBeTruthy();
    game = makeGame({ white: player('friend', 'Friend'), black: player('me', 'Me') });
    fireEvent.click(screen.getByRole('button', { name: 'Accept challenge' }));
    await waitFor(() => expect(api.acceptChallenge).toHaveBeenCalledWith('g1'));
    await waitFor(() => expect(screen.getByTestId('player-black').textContent).toContain('you'));
    // За чёрных доска перевёрнута: a8 снизу слева -> h1 сверху слева
    const squares = [...document.querySelectorAll('[data-square]')].map((el) => el.getAttribute('data-square'));
    expect(squares[0]).toBe('h1');
  });

  it('лобби: пресет 3+2 -> seek; найден соперник -> переход в партию; ссылка другу', async () => {
    const socket = new FakeSocket((event) => (event === 'seek' ? { ok: true, data: { seeking: true } } : { ok: true, data: {} }));
    setPlaySocketFactory(() => socket);
    renderAt('/play', <PlayLobbyPage />, '/play');
    await waitFor(() => expect(screen.getByTestId('my-ratings').textContent).toContain('1623'));
    fireEvent.click(screen.getByTestId('preset-3+2'));
    await waitFor(() => expect(socket.sent.find((s) => s.event === 'seek')?.payload).toEqual({ minutes: 3, increment: 2, rated: true, ratingRange: null }));
    expect(await screen.findByText(/Looking for an opponent 3\+2/)).toBeTruthy();
    socket.serverEmit('game_started', { gameId: 'g7' });
    await waitFor(() => expect(screen.getAllByTestId('where').some((w) => w.textContent === '/play/g7')).toBe(true));
  });

  it('свой контроль: категория по длительности; «Ссылка другу» создаёт закрытый вызов', async () => {
    const socket = new FakeSocket(() => ({ ok: true, data: {} }));
    setPlaySocketFactory(() => socket);
    renderAt('/play', <PlayLobbyPage />, '/play');
    fireEvent.click(await screen.findByRole('button', { name: 'Custom game' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByTestId('custom-speed').textContent).toContain('10+5 · rapid');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Black' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create link' }));
    await waitFor(() => expect(api.createChallenge).toHaveBeenCalledWith({ minutes: 10, increment: 5, rated: true, color: 'black', isPrivate: true, ratingRange: null }));
    await waitFor(() => expect(screen.getAllByTestId('where').some((w) => w.textContent === '/play/ch1')).toBe(true));
  });
});
