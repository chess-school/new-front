import { Chess, Square, Move } from 'chess.js';

export class ChessGameEngine {
  private game: Chess;

  constructor() {
    this.game = new Chess();
  }

  getFen() {
    return this.game.fen();
  }

  getMove() {
    return this.game.turn();
  }

  getPgn() {
    return this.game.pgn();
  }

  getHistory() {
    return this.game.history();
  }

  isGameOver() {
    return this.game.isGameOver();
  }

  getStatus() {
    if (this.game.isCheckmate()) return 'Шах и мат! Игра окончена.';
    if (this.game.isDraw()) return 'Ничья!';
    if (this.game.isStalemate()) return 'Пат!';
    if (this.game.isCheck()) return 'Шах!';
    return '';
  }

  handleMove(source: Square, target: Square): boolean {
    const possibleMoves = this.game.moves({ square: source });
  
    const isValidMove = possibleMoves.some(
      (move) => move.includes(target)
    );
  
    if (!isValidMove) {
      return false;
    }
  
    const move = this.game.move({ from: source, to: target, promotion: 'q' });
    return move !== null;
  }

  resetGame() {
    this.game.reset();
  }

  loadFen(fen: string) {
    this.game.load(fen);
  }

  loadPgn(pgn: string) {
    return this.game.loadPgn(pgn);
  }

  goToMove(moveIndex: number) {
    this.game.reset();
    const history = this.getHistory();
    for (let i = 0; i < moveIndex; i++) {
      this.game.move(history[i]);
    }
  }
}

export default ChessGameEngine;
