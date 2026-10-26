// Типы онлайн-партий — ответы /api/v2/play и события socket.io /play (backend/docs/PLAY_API.md)

export type Speed = 'bullet' | 'blitz' | 'rapid' | 'classical';
export type Color = 'white' | 'black';
export type GameStatus = 'created' | 'active' | 'finished' | 'aborted';
export type EndReason =
  | 'checkmate' | 'timeout' | 'resignation' | 'draw_agreement' | 'stalemate'
  | 'insufficient_material' | 'threefold_repetition' | 'fifty_moves' | 'aborted';

export interface TimeControl {
  type: Speed;
  initialSeconds: number;
  incrementSeconds: number;
  custom: boolean;
}

export interface ClockState {
  whiteMs: number;
  blackMs: number;
  turn: Color;
  running: boolean;
  serverNow: number;
}

export interface PlayPlayer {
  _id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  rating: number;
  provisional: boolean;
}

export interface RatingSnapshot {
  before: number;
  after: number;
  diff: number;
  provisional: boolean;
}

export interface PlayGame {
  _id: string;
  status: GameStatus;
  source: 'challenge' | 'lobby' | 'pairing' | 'rematch';
  isPrivate: boolean;
  isRated: boolean;
  timeControl: TimeControl;
  creatorColor: 'white' | 'black' | 'random';
  createdBy: { _id: string; uuid: string; firstName: string; lastName: string } | null;
  white: PlayPlayer | null;
  black: PlayPlayer | null;
  fen: string;
  moves: string[];
  sanMoves: string[];
  clock: ClockState;
  drawOfferBy: Color | null;
  winner: Color | 'draw' | null;
  endReason: EndReason | null;
  ratingChanges: { white: number | null; black: number | null } | null;
  ratings: { white?: RatingSnapshot; black?: RatingSnapshot } | null;
  rematchOf: string | null;
  pgn: string;
  abortTimeoutMs: number;
}

export interface MoveEvent {
  gameId: string;
  uci: string;
  san: string;
  fen: string;
  ply: number;
  clock: ClockState;
  drawOfferBy: Color | null;
}

export interface GameOverEvent {
  gameId: string;
  status: 'finished' | 'aborted';
  winner: Color | 'draw' | null;
  endReason: EndReason;
  ratingChanges: { white: number; black: number } | null;
  ratings: { white: RatingSnapshot; black: RatingSnapshot } | null;
  clock: ClockState;
  pgn: string;
}

export interface MyGamePlayer {
  _id: string;
  uuid: string;
  firstName: string;
  lastName: string;
}

/** Строка списка «Мои партии» (GET /api/v2/play/games) */
export interface MyGame {
  _id: string;
  status: 'finished' | 'aborted';
  winner: Color | 'draw' | null;
  endReason: EndReason | null;
  isRated: boolean;
  timeControl: TimeControl;
  white: MyGamePlayer | null;
  black: MyGamePlayer | null;
  ratingChanges: { white: number | null; black: number | null } | null;
  finishedAt: string | null;
  /** Число сделанных ходов (полуходов) */
  moves: number;
}

export interface Challenge {
  _id: string;
  status: GameStatus;
  isPrivate: boolean;
  isRated: boolean;
  timeControl: TimeControl;
  creatorColor: 'white' | 'black' | 'random';
  ratingRange: number | null;
  source: string;
  createdAt: string;
  mine: boolean;
  creator: (Omit<PlayPlayer, 'rating' | 'provisional'> & { rating: number; provisional: boolean }) | null;
}

export interface PlayOverview {
  ratings: Record<Speed, { rating: number; rd: number; games: number; provisional: boolean }>;
  activeGames: { _id: string; timeControl: TimeControl }[];
  challenges: Challenge[];
}

export interface Preset {
  id: string;
  minutes: number;
  increment: number;
}

export interface Ack<T = unknown> {
  ok: boolean;
  data?: T;
  error?: { msg: string; code: string };
}
