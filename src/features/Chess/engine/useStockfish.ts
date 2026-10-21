import { useCallback, useEffect, useRef, useState } from 'react';
import { AnalysisResult, StockfishEngine, WorkerLike } from './stockfish';

/**
 * Движок на время жизни компонента. Воркер создаётся лениво — когда движок впервые нужен
 * (enabled или вызов ensure()), и уничтожается (worker.terminate()) при размонтировании:
 * страница без включённого анализа не грузит 1,3 МБ движка и не тратит CPU.
 */
export const useStockfishEngine = (enabled: boolean, createWorker?: () => WorkerLike) => {
  const ref = useRef<StockfishEngine | null>(null);
  const [engine, setEngine] = useState<StockfishEngine | null>(null);

  const ensure = useCallback((): StockfishEngine => {
    if (!ref.current) {
      ref.current = new StockfishEngine(createWorker);
      setEngine(ref.current);
    }
    return ref.current;
  }, [createWorker]);

  useEffect(() => {
    if (enabled) ensure();
  }, [enabled, ensure]);

  useEffect(() => () => {
    ref.current?.terminate();
    ref.current = null;
  }, []);

  return { engine, ensure };
};

interface EngineAnalysisOptions {
  enabled: boolean;
  depth?: number;
  multiPv?: number;
  /** Задержка перед анализом новой позиции: быстрые переходы по ходам не запускают лишних поисков */
  debounceMs?: number;
  /** Сменить, чтобы перезапустить анализ той же позиции */
  refreshKey?: unknown;
}

/** Живой анализ позиции: перезапускается при смене fen, останавливается при выключении/размонтировании */
export const useEngineAnalysis = (engine: StockfishEngine | null, fen: string | null, options: EngineAnalysisOptions) => {
  const { enabled, depth = 16, multiPv = 1, debounceMs = 150, refreshKey } = options;
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!engine || !enabled || !fen) {
      setResult(null);
      setAnalyzing(false);
      return undefined;
    }
    let cancelled = false;
    const owner = {}; // метка поисков этого запуска эффекта
    setResult(null);
    const timer = setTimeout(() => {
      setAnalyzing(true);
      engine
        .analyze(fen, { depth, multiPv, owner, onUpdate: (partial) => { if (!cancelled) setResult(partial); } })
        .then((final) => {
          if (cancelled) return;
          if (final.lines.length) setResult(final);
          setAnalyzing(false);
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      // Только свой поиск: чужой (проверка решения, разбор хода) продолжается
      engine.release(owner);
    };
  }, [engine, enabled, fen, depth, multiPv, debounceMs, refreshKey]);

  return { result, analyzing };
};
