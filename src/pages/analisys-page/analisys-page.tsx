import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChessBoard from '../../components/ChessGame/ChessBoard';
import MoveHistory from '../../components/ChessGame/MoveHistory';
import { Typography, Button, Stack, CircularProgress } from '@mui/material';
import { Chess, Square } from 'chess.js';

interface Variation {
  move: string;
  fen: string;
  parentIndex: number; // Индекс хода, к которому относится подвариант
}
export const AnalysisPage: React.FC = () => {
    const location = useLocation();
    const { history: initialHistory } = location.state as { history: string[] };
  
    const [chess] = useState(new Chess());
    const [fen, setFen] = useState(chess.fen()); // Добавляем состояние для FEN
    const [history, setHistory] = useState(initialHistory); // Основная линия ходов
    const [variations, setVariations] = useState<Variation[]>([]); // Список подвариантов
    const [currentMoveIndex, setCurrentMoveIndex] = useState(initialHistory.length); // Последний ход
    const [evaluations, setEvaluations] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
  
    // Устанавливаем доску на текущий ход
    useEffect(() => {
      chess.reset();
      for (let i = 0; i < currentMoveIndex; i++) {
        chess.move(history[i]);
      }
      setFen(chess.fen()); // Обновляем состояние FEN
    }, [currentMoveIndex, history, chess]);
  
    // Обработчик кликов по ходу
    const goToMove = (index: number) => {
      if (index >= 0 && index <= history.length) {
        setCurrentMoveIndex(index); // Устанавливаем текущий индекс
        chess.reset(); // Сбрасываем позицию до начальной
        for (let i = 0; i < index; i++) {
          chess.move(history[i]); // Загружаем ходы до нужного индекса включительно
        }
        setFen(chess.fen()); // Обновляем состояние доски
      }
    };
  
    // Добавление нового подварианта
    const handleNewVariation = (source: Square, target: Square): boolean => {
      const validMove = chess.moves({ square: source, verbose: true }).find((move) => move.to === target);
      if (!validMove) {
        console.error(`Invalid move from ${source} to ${target}`);
        return false;
      }
  
      const move = chess.move({ from: source, to: target, promotion: 'q' }); // Делаем ход
      if (move) {
        const newVariation: Variation = {
          move: move.san,
          fen: chess.fen(),
          parentIndex: currentMoveIndex, // Привязываем подвариант к текущей позиции
        };
        setVariations((prev) => [...prev, newVariation]);
        chess.undo(); // Откатываем ход
        return true;
      }
      return false;
    };
  
    // Обработка клика на подвариант
    const handleVariationClick = (variationIndex: number) => {
      const variation = variations[variationIndex];
      if (variation) {
        chess.load(variation.fen); // Загружаем позицию подварианта
        setFen(variation.fen); // Устанавливаем FEN из подварианта
        setCurrentMoveIndex(variation.parentIndex + 1); // Переход на подвариант
      }
    };
  
    // Анализ всей партии
    const analyzeGame = () => {
      setLoading(true);
      setTimeout(() => {
        const analyzedEvaluations = history.map(() => Math.random() * 2 - 1); // Генерация случайных оценок
        setEvaluations(analyzedEvaluations);
        setLoading(false);
      }, 2000);
    };
  
    return (
      <div>
        <Typography variant="h4">Анализ партии</Typography>
        <Stack direction="row" spacing={4}>
          {/* Шахматная доска */}
          <div>
            <ChessBoard
              position={fen} // Используем состояние FEN
              onMove={(source, target) => handleNewVariation(source, target)} // Обрабатываем альтернативные ходы
            />
            <Stack direction="row" spacing={1} style={{ marginTop: '20px' }}>
              <Button onClick={() => goToMove(0)}>{'<<'}</Button>
              <Button onClick={() => goToMove(currentMoveIndex - 1)}>{'<'}</Button>
              <Button onClick={() => goToMove(currentMoveIndex + 1)}>{'>'}</Button>
              <Button onClick={() => goToMove(history.length)}>{'>>'}</Button>
            </Stack>
            <Button
              variant="contained"
              color="primary"
              onClick={analyzeGame}
              style={{ marginTop: '20px' }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Анализировать партию'}
            </Button>
          </div>
  
          {/* История ходов с подвариантами */}
          <div>
            <MoveHistory
              history={history}
              evaluations={evaluations}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={goToMove}
              variations={variations}
              onVariationClick={(index) => handleVariationClick(index)}
            />
          </div>
        </Stack>
      </div>
    );
  };
  
  export default AnalysisPage;
  