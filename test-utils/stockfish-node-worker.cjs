// Запускает public/workers/stockfish.js в worker_threads как Web Worker (postMessage/onmessage),
// чтобы интеграционные тесты проверяли модуль движка на настоящем Stockfish без браузера.
const { parentPort } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = {
  postMessage: (message) => parentPort.postMessage(message),
  importScripts: () => {},
  close: () => process.exit(0),
  location: { href: 'http://localhost/workers/stockfish.js' },
  setTimeout, clearTimeout, setInterval, clearInterval, console, Date, Math,
  performance: { now: () => performance.now() },
};
ctx.self = ctx;
vm.createContext(ctx);
// Чистый контекст без process/require: скрипт определяет окружение как Web Worker
vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/workers/stockfish.js'), 'utf8'), ctx, { filename: 'stockfish.js' });
parentPort.on('message', (message) => ctx.onmessage({ data: message }));
