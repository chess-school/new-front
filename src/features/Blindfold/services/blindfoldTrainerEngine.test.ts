import { describe, expect, it } from 'vitest';
import {
  BlindfoldSession, Piece, buildQuestion, generateSession, legalDestinations, makeRng,
} from './blindfoldTrainerEngine';

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
});
