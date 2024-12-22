importScripts('/stockfish.js');

const engine = new Worker('/stockfish.js');
engine.postMessage('uci');

self.onmessage = function (e) {
  const { fen } = e.data;
  engine.postMessage(`position fen ${fen}`);
  engine.postMessage('go depth 20'); // Анализ глубиной 20

  let variant = '';
  let evaluation = null;

  engine.onmessage = function (event) {
    const message = event.data;

    if (message.startsWith('bestmove')) {
      self.postMessage({ variant, evaluation });
    }

    if (message.includes('info depth')) {
      const scoreMatch = message.match(/score cp (-?\d+)/);
      const pvMatch = message.match(/ pv (.+)/);

      if (scoreMatch) {
        evaluation = parseInt(scoreMatch[1], 10) / 100;
      }

      if (pvMatch) {
        variant = pvMatch[1];
      }

      self.postMessage({ variant, evaluation });
    }
  };
};
