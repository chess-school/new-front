
import { Chess, Square, Move } from 'chess.js';

export interface IGameStatus {
  isCheckmate: boolean;
  isStalemate: boolean;
  isThreefoldRepetition: boolean;
  isInsufficientMaterial: boolean;
  isDraw: boolean;
  turn: 'w' | 'b';
}

export class ChessGameEngine {
  private game: Chess;
  private fullHistory: string[] = []; 

  constructor(fen?: string) {
    this.game = fen ? new Chess(fen) : new Chess();
    this.fullHistory = this.game.history();
  }

  getFen(): string {
    return this.game.fen();
  }

  getTurn(): 'w' | 'b' {
    return this.game.turn();
  }

  getHistory(): string[] {
    return this.fullHistory;
  }

  getMovesForSquare(square: Square): Move[] {
    return this.game.moves({ square, verbose: true });
  }

  getStatus(): IGameStatus {
    return {
      isCheckmate: this.game.isCheckmate(),
      isStalemate: this.game.isStalemate(),
      isThreefoldRepetition: this.game.isThreefoldRepetition(),
      isInsufficientMaterial: this.game.isInsufficientMaterial(),
      isDraw: this.game.isDraw(),
      turn: this.game.turn(),
    };
  }

  handleMove(source: Square, target: Square): Move | null {
    try {
      const move = this.game.move({ from: source, to: target, promotion: 'q' });
      if (move) {
        this.fullHistory = this.game.history();
      }
      return move;
    } catch (e) {
      return null;
    }
  }

  resetGame(): void {
    this.game.reset();
    this.fullHistory = []; 
  }

  loadPgn(pgn: string): boolean {
    try {
      this.game.loadPgn(pgn);

      this.fullHistory = this.game.history(); 
      return true; 
    } catch (e) {
      console.error("Invalid PGN:", e); 
      return false;
    }
  }
  
  goToMove(moveIndex: number): void {
    const tempGame = new Chess();
    for (let i = 0; i < moveIndex; i++) {
        if (this.fullHistory[i]) {
            tempGame.move(this.fullHistory[i]);
        }
    }
    this.game = tempGame;
  }

  uciToSan(uci: string): string | null {
    const move = this.game.move({
      from: uci.substring(0, 2),
      to: uci.substring(2, 4),
      promotion: uci.length === 5 ? uci.substring(4) : undefined,
    });
    if (move) {
      this.game.undo();
      return move.san;
    }
    return null;
  }
}

export default ChessGameEngine;