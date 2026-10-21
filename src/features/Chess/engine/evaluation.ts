// Представление оценки движка в интерфейсе: шкала (eval bar), короткая подпись и стрелки ходов.
import { Arrow } from 'react-chessboard/dist/chessboard/types';
import { Square } from 'chess.js';
import { AnalysisResult, EngineLine } from './stockfish';

/** Коэффициент сигмоиды Lichess: «шансы на победу» из сантипешек */
const LICHESS_K = 0.00368208;
/** Дальше этой оценки шкала визуально не растёт (как на Lichess) */
const CP_CLAMP = 1000;

/** Шансы белых в диапазоне [-1, 1] по формуле Lichess: 2 / (1 + e^(-k·cp)) - 1 */
export const winningChances = (cp: number): number => {
  const clamped = Math.max(-CP_CLAMP, Math.min(CP_CLAMP, cp));
  return 2 / (1 + Math.exp(-LICHESS_K * clamped)) - 1;
};

/**
 * Заполнение шкалы белым, % (0 — у чёрных решающий перевес, 100 — у белых).
 * Мат — край шкалы; мат на доске — у той стороны, которая поставила мат.
 */
export const whitePercent = (result: AnalysisResult | null | undefined): number => {
  if (!result) return 50;
  if (result.terminal === 'checkmate') return result.fen.split(' ')[1] === 'w' ? 0 : 100;
  if (result.terminal === 'stalemate') return 50;
  const line = result.lines[0];
  if (!line) return 50;
  if (line.mate !== undefined) return line.mate > 0 ? 100 : line.mate < 0 ? 0 : 50;
  return 50 + 50 * winningChances(line.scoreCp ?? 0);
};

/** Короткая подпись шкалы: '+0.87', '-7.8', '+12', 'M2', '-M3', '#', '½' */
export const formatEvalShort = (result: AnalysisResult | null | undefined): string => {
  if (!result) return '';
  if (result.terminal === 'checkmate') return '#';
  if (result.terminal === 'stalemate') return '½';
  const line = result.lines[0];
  if (!line) return '';
  if (line.mate !== undefined) return line.mate > 0 ? `M${line.mate}` : line.mate < 0 ? `-M${-line.mate}` : '#';
  const pawns = (line.scoreCp ?? 0) / 100;
  const abs = Math.abs(pawns);
  const digits = abs >= 10 ? 0 : abs >= 1 ? 1 : 2;
  const text = abs.toFixed(digits);
  return pawns > 0 ? `+${text}` : pawns < 0 ? `-${text}` : text;
};

// Цвета стрелок как на Lichess: лучший ход — зелёный, следующие линии — синие, полупрозрачные
export const ARROW_COLORS = ['rgba(21, 120, 27, 0.85)', 'rgba(0, 48, 136, 0.55)', 'rgba(0, 48, 136, 0.35)'];

/** Стрелки первых ходов лучших линий; без повторов одного и того же хода */
export const engineArrows = (result: AnalysisResult | null | undefined, maxArrows = 2): Arrow[] => {
  if (!result || result.terminal) return [];
  const seen = new Set<string>();
  const arrows: Arrow[] = [];
  const lines: EngineLine[] = result.lines.length ? result.lines : [];
  for (const line of lines) {
    const uci = line.multipv === 1 && result.bestMove ? result.bestMove : line.pv[0];
    if (!uci || seen.has(uci) || arrows.length >= maxArrows) continue;
    seen.add(uci);
    arrows.push([uci.slice(0, 2) as Square, uci.slice(2, 4) as Square, ARROW_COLORS[arrows.length] ?? ARROW_COLORS[ARROW_COLORS.length - 1]]);
  }
  return arrows;
};
