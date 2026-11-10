import { describe, expect, it } from 'vitest';
import {
  BlindfoldLine, BlindfoldSession, Piece, buildLineBlock, buildQuestion, generateLine,
  generatePosition, generatePuzzle, generateSession, legalDestinations, makeRng, reachMap,
  uniqueReachTargets,
} from './blindfoldTrainerEngine';

/**
 * Проигрывает линию от initial, на КАЖДОМ ходу проверяя инвариант:
 *   — до цели достаёт РОВНО одна фигура;
 *   — это фигура с указанными type/color, стоящая на `from`;
 *   — цель пуста (ход без взятия).
 * Возвращает фактическую длину проверенной линии.
 */
const verifyLineInvariant = (line: BlindfoldLine): number => {
  const live: Record<string, Piece> = {};
  for (const p of line.initial) live[p.square] = { ...p };
  for (const step of line.steps) {
    const reach = reachMap(live);
    const reachers = reach.get(step.target) ?? [];
    expect(reachers.length).toBe(1); // ровно одна фигура достаёт до цели
    const mover = reachers[0];
    expect(mover.square).toBe(step.from);
    expect(mover.type).toBe(step.pieceType);
    expect(mover.color).toBe(step.pieceColor);
    expect(live[step.target]).toBeUndefined(); // цель пуста
    // применяем ход
    delete live[step.from];
    mover.square = step.target;
    live[step.target] = mover;
  }
  return line.steps.length;
};

/** Проверка, что поле лежит на доске 'a1'..'h8' */
const onBoard = (sq: string) =>
  /^[a-h][1-8]$/.test(sq);

/** Проиграть шаги от initial, вернуть список снимков позиции (поле→фигура) после каждого шага,
 *  плюс стартовую позицию в начале */
const replay = (session: BlindfoldSession) => {
  const live: Record<string, Piece> = {};
  for (const p of session.initial) live[p.square] = { ...p };
  const snapshots: Record<string, Piece>[] = [{ ...live }];
  for (const step of session.steps) {
    // Фигура действительно стоит на from
    const moving = live[step.from];
    expect(moving).toBeDefined();
    expect(moving.id).toBe(step.pieceId);
    // Применяем ход
    delete live[step.from];
    moving.square = step.to;
    live[step.to] = moving;
    snapshots.push({ ...live });
  }
  return snapshots;
};

describe('blindfoldTrainerEngine', () => {
  it('детерминизм: одинаковый seed → полностью одинаковые сессии', () => {
    const a = generateSession({ pieceCount: 7, moveCount: 25, rng: makeRng(12345) });
    const b = generateSession({ pieceCount: 7, moveCount: 25, rng: makeRng(12345) });
    expect(a).toEqual(b);
    // Разный seed обычно даёт другую сессию
    const c = generateSession({ pieceCount: 7, moveCount: 25, rng: makeRng(999) });
    expect(c).not.toEqual(a);
  });

  it('инвариант числа фигур: после каждого шага занято ровно pieceCount разных полей на доске', () => {
    const pieceCount = 8;
    const session = generateSession({ pieceCount, moveCount: 40, rng: makeRng(42) });
    const snapshots = replay(session);
    for (const snap of snapshots) {
      const squares = Object.keys(snap);
      expect(squares.length).toBe(pieceCount);         // ничего не исчезло и не прибавилось
      expect(new Set(squares).size).toBe(pieceCount);   // поля различны
      for (const sq of squares) expect(onBoard(sq)).toBe(true);
    }
  });

  it('легальность: каждый шаг — легальный ход без взятия из позиции ДО него', () => {
    for (const seed of [1, 2, 3, 7, 101, 55555]) {
      const session = generateSession({ pieceCount: 6, moveCount: 30, rng: makeRng(seed) });
      // Независимо воспроизводим позицию и для каждого шага пересчитываем легальные поля
      const live: Record<string, Piece> = {};
      for (const p of session.initial) live[p.square] = { ...p };
      for (const step of session.steps) {
        const moving = live[step.from];
        expect(moving).toBeDefined();          // from держал эту фигуру
        expect(moving.id).toBe(step.pieceId);
        const legal = legalDestinations(moving, live);
        expect(legal).toContain(step.to);      // пункт назначения действительно легален
        expect(live[step.to]).toBeUndefined(); // и поле было пустым (без взятий)
        // применяем
        delete live[step.from];
        moving.square = step.to;
        live[step.to] = moving;
      }
    }
  });

  it('подсчёты и зажим диапазонов', () => {
    const s = generateSession({ pieceCount: 6, moveCount: 30, rng: makeRng(7) });
    expect(s.steps.length).toBe(30);
    expect(s.initial.length).toBe(6);

    // pieceCount=100 → 10
    const big = generateSession({ pieceCount: 100, moveCount: 30, rng: makeRng(7) });
    expect(big.initial.length).toBe(10);

    // moveCount=1 → 10
    const few = generateSession({ pieceCount: 6, moveCount: 1, rng: makeRng(7) });
    expect(few.steps.length).toBe(10);
  });

  it('пешки: без диагоналей, двойной ход лишь со старта, без превращения', () => {
    // Белая пешка на e2: один шаг e3, двойной e4; никаких диагоналей
    const e2: Piece = { id: 'x', type: 'p', color: 'w', square: 'e2' };
    expect(new Set(legalDestinations(e2, { e2 }))).toEqual(new Set(['e3', 'e4']));
    // С e3 — только e4 (нет двойного не со старта)
    const e3: Piece = { id: 'x', type: 'p', color: 'w', square: 'e3' };
    expect(legalDestinations(e3, { e3 })).toEqual(['e4']);
    // Пешка на 7-й горизонтали белых не ходит (ход был бы на 8-ю — превращение исключено)
    const e7: Piece = { id: 'x', type: 'p', color: 'w', square: 'e7' };
    expect(legalDestinations(e7, { e7 })).toEqual([]);
    // Чёрная пешка на d7: d6, d5
    const d7: Piece = { id: 'y', type: 'p', color: 'b', square: 'd7' };
    expect(new Set(legalDestinations(d7, { d7 }))).toEqual(new Set(['d6', 'd5']));
    // Заблокированная пешка не ходит
    const blocker: Piece = { id: 'z', type: 'n', color: 'b', square: 'e3' };
    expect(legalDestinations(e2, { e2, e3: blocker })).toEqual([]);
  });

  it('скользящие не перепрыгивают фигуры', () => {
    const rook: Piece = { id: 'r', type: 'r', color: 'w', square: 'a1' };
    const block: Piece = { id: 'b', type: 'p', color: 'w', square: 'a4' };
    const dests = legalDestinations(rook, { a1: rook, a4: block });
    expect(dests).toContain('a2');
    expect(dests).toContain('a3');
    expect(dests).not.toContain('a4'); // занято — не берём
    expect(dests).not.toContain('a5'); // за препятствием — не перепрыгиваем
  });

  it('buildQuestion: where-piece указывает на реальную фигуру, what-on-square совпадает с позицией', () => {
    const session = generateSession({ pieceCount: 6, moveCount: 20, rng: makeRng(2024) });

    // where-piece (rng<0.5)
    const wp = buildQuestion(session, makeRng(1)); // makeRng(1) первый вызов < 0.5? проверим обе ветки явно ниже
    // Явно вынудим обе ветки своими rng-заглушками:
    let calls = 0;
    const alwaysWhere = () => (calls++ === 0 ? 0 : 0.42); // первый вызов (выбор kind) < 0.5
    const q1 = buildQuestion(session, alwaysWhere);
    expect(q1.kind).toBe('where-piece');
    expect(q1.answerSquare).toBeDefined();
    const here = session.finalBySquare[q1.answerSquare!];
    expect(here).toBeDefined();
    expect(here.type).toBe(q1.piece!.type);
    expect(here.color).toBe(q1.piece!.color);
    expect(q1.square).toBe(q1.answerSquare);

    calls = 0;
    const alwaysWhat = () => (calls++ === 0 ? 0.9 : 0.42); // первый вызов >= 0.5
    const q2 = buildQuestion(session, alwaysWhat);
    expect(q2.kind).toBe('what-on-square');
    expect(q2.answerPiece).toBeDefined();
    const expected = session.finalBySquare[q2.square];
    expect(expected).toBeDefined();
    expect(q2.answerPiece!.type).toBe(expected.type);
    expect(q2.answerPiece!.color).toBe(expected.color);
    expect(q2.answerPiece!.square).toBe(q2.square);

    // wp использован, чтобы не ругался линтер на неиспользуемую переменную
    expect(['where-piece', 'what-on-square']).toContain(wp.kind);
  });

  describe('generatePuzzle: «одна фигура достаёт до поля»', () => {
    it('детерминизм: одинаковый seed → одинаковый пазл', () => {
      const a = generatePuzzle({ pieceCount: 6, rng: makeRng(2024) });
      const b = generatePuzzle({ pieceCount: 6, rng: makeRng(2024) });
      expect(a).toEqual(b);
    });

    it('инвариант: цель пуста и достижима РОВНО одной фигурой — ответной', () => {
      for (const seed of [1, 2, 3, 7, 42, 101, 777, 55555]) {
        for (const pieceCount of [4, 6, 8, 10]) {
          const puz = generatePuzzle({ pieceCount, rng: makeRng(seed) });
          // Цель — пустое поле
          expect(puz.bySquare[puz.target]).toBeUndefined();
          // До цели достаёт ровно одна фигура
          const reach = reachMap(puz.bySquare);
          const reachers = reach.get(puz.target) ?? [];
          expect(reachers.length).toBe(1);
          // И это ответная фигура на своём поле
          expect(reachers[0].square).toBe(puz.answerSquare);
          expect(puz.bySquare[puz.answerSquare]).toBeDefined();
          expect(puz.answerPiece.square).toBe(puz.answerSquare);
          // Фигур ровно pieceCount, поля различны
          expect(puz.pieces.length).toBe(pieceCount);
          expect(new Set(puz.pieces.map((p) => p.square)).size).toBe(pieceCount);
        }
      }
    });

    it('фолбэк при maxAttempts=0 всё равно корректен (конь d4 → c6)', () => {
      const puz = generatePuzzle({ pieceCount: 6, rng: makeRng(1), maxAttempts: 0 });
      expect(puz.target).toBe('c6');
      expect(puz.answerSquare).toBe('d4');
      const reachers = reachMap(puz.bySquare).get('c6') ?? [];
      expect(reachers.length).toBe(1);
      expect(reachers[0].square).toBe('d4');
    });
  });

  describe('generatePosition: одна позиция + пул целей', () => {
    it('каждая цель достижима ровно одной фигурой — своей', () => {
      for (const seed of [1, 5, 42, 777, 20240]) {
        for (const pieceCount of [4, 6, 8, 10]) {
          const pos = generatePosition({ pieceCount, rng: makeRng(seed) });
          expect(pos.pieces.length).toBe(pieceCount);
          expect(pos.targets.length).toBeGreaterThan(0);
          const reach = reachMap(pos.bySquare);
          for (const { target, piece } of pos.targets) {
            // цель пуста
            expect(pos.bySquare[target]).toBeUndefined();
            // ровно одна достающая фигура — именно эта, на своём поле
            const reachers = reach.get(target) ?? [];
            expect(reachers.length).toBe(1);
            expect(reachers[0].square).toBe(piece.square);
            expect(pos.bySquare[piece.square]).toBeDefined();
          }
        }
      }
    });

    it('детерминизм: одинаковый seed → одинаковая позиция', () => {
      const a = generatePosition({ pieceCount: 6, rng: makeRng(2024) });
      const b = generatePosition({ pieceCount: 6, rng: makeRng(2024) });
      expect(a).toEqual(b);
    });

    it('uniqueReachTargets на пустой позиции = []', () => {
      expect(uniqueReachTargets({})).toEqual([]);
    });
  });

  // Максимум ходов подряд одной и той же фигурой (смена вектора): фигура, сходившая на `target`,
  // при следующем ходе стоит на этом `target` (её новый `from`). Так считаем непрерывный прогон.
  const maxSamePieceRun = (line: BlindfoldLine): number => {
    let run = 1, best = line.steps.length ? 1 : 0;
    for (let i = 1; i < line.steps.length; i++) {
      const s = line.steps[i], p = line.steps[i - 1];
      const samePiece = s.from === p.target && s.pieceType === p.pieceType && s.pieceColor === p.pieceColor;
      run = samePiece ? run + 1 : 1;
      if (run > best) best = run;
    }
    return best;
  };

  describe('generateLine: эволюция позиции, инвариант на каждом ходу', () => {
    it('на каждом ходу до цели достаёт ровно одна фигура — именно ходящая', () => {
      for (const seed of [1, 2, 7, 42, 101, 2024, 55555]) {
        for (const pieceCount of [4, 6, 8, 10]) {
          const line = generateLine({ pieceCount, maxMoves: 75, rng: makeRng(seed) });
          expect(line.initial.length).toBe(pieceCount);
          expect(line.steps.length).toBeGreaterThan(0);
          verifyLineInvariant(line);
        }
      }
    });

    it('состав: в каждой линии есть конь, ладья, слон и ферзь (нет пешек/королей)', () => {
      for (const seed of [1, 3, 9, 50, 404, 9999]) {
        for (const pieceCount of [4, 6, 8, 10]) {
          const line = generateLine({ pieceCount, maxMoves: 75, rng: makeRng(seed) });
          const types = new Set(line.initial.map((p) => p.type));
          for (const req of ['n', 'r', 'b', 'q']) expect(types.has(req as never)).toBe(true);
          expect(types.has('p' as never)).toBe(false);
          expect(types.has('k' as never)).toBe(false);
        }
      }
    });

    it('смена вектора: одна фигура не ходит больше 2 раз подряд', () => {
      for (const seed of [1, 2, 7, 42, 101, 2024, 55555, 123, 777]) {
        for (const pieceCount of [4, 6, 8, 10]) {
          const line = generateLine({ pieceCount, maxMoves: 75, rng: makeRng(seed) });
          expect(maxSamePieceRun(line)).toBeLessThanOrEqual(2);
        }
      }
    });

    it('детерминизм: одинаковый seed → одинаковая линия', () => {
      const a = generateLine({ pieceCount: 6, maxMoves: 40, rng: makeRng(123) });
      const b = generateLine({ pieceCount: 6, maxMoves: 40, rng: makeRng(123) });
      expect(a).toEqual(b);
    });
  });

  describe('buildLineBlock: блок заранее подготовленных и протестированных линий', () => {
    it('набирает нужное число линий требуемой длины, инвариант держится у ВСЕХ', () => {
      for (const pieceCount of [4, 6, 8, 10]) {
        const block = buildLineBlock({ pieceCount, count: 8, minMoves: 75, maxMoves: 75, maxSeeds: 2000 });
        expect(block.length).toBe(8);
        for (const line of block) {
          expect(line.steps.length).toBeGreaterThanOrEqual(75);
          verifyLineInvariant(line);
        }
      }
    });

    it('детерминизм: один и тот же блок при тех же параметрах', () => {
      const a = buildLineBlock({ pieceCount: 6, count: 4, minMoves: 60, maxMoves: 75, maxSeeds: 2000 });
      const b = buildLineBlock({ pieceCount: 6, count: 4, minMoves: 60, maxMoves: 75, maxSeeds: 2000 });
      expect(a).toEqual(b);
    });
  });
});
