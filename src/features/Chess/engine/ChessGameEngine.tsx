// engine/ChessGameEngine.ts (ОНОВЛЕНА ВЕРСІЯ)

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

  // --- КЛЮЧОВА ЗМІНА ТУТ ---
  // Додаємо третій, необов'язковий аргумент `promotionPiece`
  handleMove(source: Square, target: Square, promotionPiece?: string): Move | null {
    try {
      // Використовуємо `promotionPiece`. Якщо він не переданий,
      // `chess.js` автоматично вибере ферзя ('q'), що є хорошою поведінкою за замовчуванням.
      const move = this.game.move({ 
        from: source, 
        to: target, 
        promotion: promotionPiece 
      });

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
      // Скидаємо гру перед завантаженням нового PGN, щоб уникнути конфліктів
      this.game.reset(); 
      this.game.loadPgn(pgn);
      this.fullHistory = this.game.history(); 
      return true; 
    } catch (e) {
      console.error("Invalid PGN:", e); 
      return false;
    }
  }
  
  goToMove(moveIndex: number): void {
    // Створюємо нову гру з початкової позиції
    const tempGame = new Chess();
    // Проходимо по повній історії до потрібного ходу
    for (let i = 0; i < moveIndex; i++) {
        if (this.fullHistory[i]) {
            tempGame.move(this.fullHistory[i]);
        }
    }
    // Замінюємо основний об'єкт гри на тимчасовий
    this.game = tempGame;
  }

  uciToSan(uci: string): string | null {
    // Цей метод можна спростити, оскільки він не повинен змінювати стан гри
    const tempGame = new Chess(this.game.fen());
    const move = tempGame.move({
      from: uci.substring(0, 2),
      to: uci.substring(2, 4),
      promotion: uci.length === 5 ? uci.substring(4) : undefined,
    });
    return move ? move.san : null;
  }
}

export default ChessGameEngine;