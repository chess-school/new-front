import { Chess } from 'chess.js';
import { ClockState, Color, GameOverEvent, MoveEvent, PlayGame } from './playTypes';

// Состояние партии на клиенте. Источник истины — сервер:
//   snapshot — полное состояние (вход в партию, переподключение);
//   move — ход (свой ход сначала применяется сразу — «оптимистично», эхо сервера его подтверждает);
//   over — конец партии. Пропуск хода (ply не следующий) -> needsSync: клиент перечитает состояние.

export interface PlayState {
  game: PlayGame | null;
  /** Локальное время получения последнего снимка часов (performance-независимо: Date.now) */
  receivedAt: number;
  /** Свой ход отправлен и ждёт подтверждения: номер полухода */
  pendingPly: number | null;
  needsSync: boolean;
  rematch: { newGameId: string; by: Color } | null;
  /** Последний ход — для звука и подсветки */
  lastSan: string | null;
}

export const initialPlayState: PlayState = { game: null, receivedAt: 0, pendingPly: null, needsSync: false, rematch: null, lastSan: null };

export type PlayAction =
  | { type: 'snapshot'; game: PlayGame; at: number }
  | { type: 'localMove'; uci: string; at: number }
  | { type: 'moveRejected' }
  | { type: 'move'; event: MoveEvent; at: number }
  | { type: 'over'; event: GameOverEvent; at: number }
  | { type: 'drawOffer'; by: Color }
  | { type: 'drawCleared' }
  | { type: 'rematchOffer'; newGameId: string; by: Color };

const swap = (c: Color): Color => (c === 'white' ? 'black' : 'white');

/** Часы в момент at, чтобы локальный ход «остановил» свои часы без ожидания сервера */
const advanceClock = (clock: ClockState, receivedAt: number, at: number, incrementMs: number): ClockState => {
  if (!clock.running) return { ...clock, turn: swap(clock.turn) };
  const key = clock.turn === 'white' ? 'whiteMs' : 'blackMs';
  const left = Math.max(0, clock[key] - (at - receivedAt)) + incrementMs;
  return { ...clock, [key]: left, turn: swap(clock.turn) };
};

export const playReducer = (state: PlayState, action: PlayAction): PlayState => {
  const { game } = state;
  switch (action.type) {
    case 'snapshot':
      return { ...state, game: action.game, receivedAt: action.at, pendingPly: null, needsSync: false, lastSan: null };

    case 'localMove': {
      if (!game || game.status !== 'active') return state;
      const chess = new Chess(game.fen);
      let move;
      try {
        move = chess.move({ from: action.uci.slice(0, 2), to: action.uci.slice(2, 4), promotion: action.uci[4] });
      } catch {
        return state;
      }
      const uci = `${move.from}${move.to}${move.promotion ?? ''}`;
      const ply = game.moves.length + 1;
      // Часы запускаются после первого хода чёрных: до этого время не идёт
      const clock = advanceClock(game.clock, state.receivedAt, action.at, ply > 2 ? game.timeControl.incrementSeconds * 1000 : 0);
      return {
        ...state,
        receivedAt: action.at,
        pendingPly: ply,
        lastSan: move.san,
        game: {
          ...game, fen: chess.fen(), moves: [...game.moves, uci], sanMoves: [...game.sanMoves, move.san],
          clock: { ...clock, running: ply >= 2 },
          // Свой ход отклоняет предложение ничьей соперника (как на сервере)
          drawOfferBy: game.drawOfferBy && game.drawOfferBy !== (move.color === 'w' ? 'white' : 'black') ? null : game.drawOfferBy,
        },
      };
    }

    case 'moveRejected':
      // Сервер не принял ход — перечитать состояние
      return { ...state, pendingPly: null, needsSync: true };

    case 'move': {
      if (!game || action.event.gameId !== game._id) return state;
      const { event } = action;
      const known = game.moves.length;
      if (event.ply <= known) {
        // Эхо своего хода (или повтор) — совпало: берём серверные часы; не совпало — пересинхронизация
        if (game.moves[event.ply - 1] !== event.uci) return { ...state, needsSync: true };
        return {
          ...state,
          receivedAt: event.ply === known ? action.at : state.receivedAt,
          pendingPly: state.pendingPly === event.ply ? null : state.pendingPly,
          game: event.ply === known ? { ...game, clock: event.clock, drawOfferBy: event.drawOfferBy } : game,
        };
      }
      if (event.ply !== known + 1) return { ...state, needsSync: true };
      return {
        ...state,
        receivedAt: action.at,
        lastSan: event.san,
        game: {
          ...game, fen: event.fen, moves: [...game.moves, event.uci], sanMoves: [...game.sanMoves, event.san],
          clock: event.clock, drawOfferBy: event.drawOfferBy,
        },
      };
    }

    case 'over': {
      if (!game || action.event.gameId !== game._id) return state;
      const { event } = action;
      return {
        ...state,
        receivedAt: action.at,
        pendingPly: null,
        game: {
          ...game, status: event.status, winner: event.winner, endReason: event.endReason,
          ratingChanges: event.ratingChanges, ratings: event.ratings, clock: { ...event.clock, running: false },
          drawOfferBy: null, pgn: event.pgn,
        },
      };
    }

    case 'drawOffer':
      return game ? { ...state, game: { ...game, drawOfferBy: action.by } } : state;
    case 'drawCleared':
      return game ? { ...state, game: { ...game, drawOfferBy: null } } : state;
    case 'rematchOffer':
      return { ...state, rematch: { newGameId: action.newGameId, by: action.by } };
    default:
      return state;
  }
};
