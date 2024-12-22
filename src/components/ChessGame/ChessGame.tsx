import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Container, Typography, Button, Paper, Stack, TextField, CircularProgress } from '@mui/material';
import { notification } from 'antd';
import ChessGameEngine from '../../utils/ChessGameEngine';

const ChessGame: React.FC = () => {
    const [engine] = useState(new ChessGameEngine());
    const [fen, setFen] = useState(engine.getFen());
    const [status, setStatus] = useState('');
    const [pgn, setPgn] = useState(engine.getPgn());
    const [inputPgn, setInputPgn] = useState('');
    const [history, setHistory] = useState<string[]>(engine.getHistory());
    const [currentMoveIndex, setCurrentMoveIndex] = useState(history.length);
    const [evaluation, setEvaluation] = useState<number | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [engineWorker, setEngineWorker] = useState<Worker | null>(null);
    const [variant, setVariant] = useState('');

    const updateGame = () => {
        setFen(engine.getFen());
        setPgn(engine.getPgn());
        setHistory(engine.getHistory());
        setCurrentMoveIndex(engine.getHistory().length);
        setStatus(engine.getStatus());
      };

  const handleMove = (sourceSquare: Square, targetSquare: Square) => {
    const moveSuccessful = engine.handleMove(sourceSquare, targetSquare);
    if (moveSuccessful) {
      updateGame();
      return true;
    }
    return false;
  };
  
  
  const resetGame = () => {
    engine.resetGame();
    updateGame();
    notification.success({
      message: 'Игра сброшена',
      description: 'Начните новую партию!',
    });
  };
  

  const loadPgn = () => {
    try {
      engine.loadPgn(inputPgn.trim());
      updateGame();
      notification.success({
        message: 'Партия успешно загружена',
        description: 'Партия из PGN загружена успешно.',
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка загрузки партии',
        description: 'Проверьте формат PGN и попробуйте снова.',
      });
    }
  };
  

  const analyzePosition = () => {
    if (engineWorker) {
      setAnalyzing(true);
      engineWorker.postMessage({ fen: engine.getFen });
    }
  };

  useEffect(() => {
    const worker = new Worker('/stockfishWorker.js');
    setEngineWorker(worker);

    worker.onmessage = (event) => {
      const { variant, evaluation } = event.data;

      if (variant) {
        const formattedVariant = formatVariantToSAN(variant);
        setVariant(formattedVariant);
      }
      if (evaluation !== undefined) setEvaluation(evaluation);
      setAnalyzing(false);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const formatVariantToSAN = (variant: string) => {
    const chess = new Chess(fen);
    const moves = variant.split(' ');
    let formattedVariant = '';
    let moveNumber = Math.ceil(engine.getHistory.length / 2) + 1;
    let isWhiteTurn = engine.getMove() === 'w';

    moves.forEach((move) => {
      const moveObj = chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: 'q' });
      if (moveObj) {
        const sanMove = moveObj.san;
        if (isWhiteTurn) {
          formattedVariant += `${moveNumber}. ${sanMove} `;
        } else {
          formattedVariant += `${moveNumber}. ... ${sanMove} `;
          moveNumber++;
        }
        isWhiteTurn = !isWhiteTurn;
      }
    });

    return formattedVariant.trim();
  };

  
  const goToMove = (moveIndex: number) => {
    engine.goToMove(moveIndex);
    setCurrentMoveIndex(moveIndex);
    setFen(engine.getFen());
  };
  

  const goToStart = () => goToMove(0);
  const goToPrevious = () => {
    if (currentMoveIndex > 0) goToMove(currentMoveIndex - 1);
  };
  const goToNext = () => {
    if (currentMoveIndex < history.length) goToMove(currentMoveIndex + 1);
  };
  const goToEnd = () => goToMove(history.length);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Шахматная игра</Typography>
      <Paper style={{ padding: 20, marginTop: 20 }}>
        <Chessboard
          position={fen}
          onPieceDrop={(sourceSquare, targetSquare) => handleMove(sourceSquare, targetSquare)}
          boardWidth={500}
        />

        <Stack direction="row" spacing={2} style={{ marginTop: 20 }}>
          <Button variant="contained" color="primary" onClick={resetGame}>
            Сбросить игру
          </Button>
          <Button variant="contained" onClick={goToStart} disabled={currentMoveIndex === 0}>
            {'<<'}
          </Button>
          <Button variant="contained" onClick={goToPrevious} disabled={currentMoveIndex === 0}>
            {'<'}
          </Button>
          <Button variant="contained" onClick={goToNext} disabled={currentMoveIndex === history.length}>
            {'>'}
          </Button>
          <Button variant="contained" onClick={goToEnd} disabled={currentMoveIndex === history.length}>
            {'>>'}
          </Button>
          <Button variant="contained" color="secondary" onClick={analyzePosition}>
            {analyzing ? 'Анализируется...' : 'Анализировать позицию'}
          </Button>
        </Stack>

        <Typography variant="h6" color="error" style={{ marginTop: 20 }}>
          {status}
        </Typography>

        {analyzing && <CircularProgress style={{ marginTop: 20 }} />}

        {evaluation !== null && (
          <Typography variant="h6" style={{ marginTop: 10 }}>Оценка: {evaluation > 0 ? `+${evaluation}` : evaluation}</Typography>
        )}
        {variant && (
          <Typography variant="body2" style={{ marginTop: 10 }}>Вариант: {variant}</Typography>
        )}
        <Typography variant="h6" style={{ marginTop: 20 }}>PGN партии:</Typography>
        <Paper style={{ padding: 10, marginTop: 10, backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2">{pgn}</Typography>
        </Paper>

        <Typography variant="h6" style={{ marginTop: 20 }}>Вставить партию (PGN):</Typography>
        <TextField
          fullWidth
          label="Введите PGN"
          value={inputPgn}
          onChange={(e) => setInputPgn(e.target.value)}
          multiline
          rows={4}
          variant="outlined"
          style={{ marginTop: 10 }}
        />
        <Button variant="contained" color="info" onClick={loadPgn} style={{ marginTop: 20 }}>
          Вставить партию
        </Button>
      </Paper>
    </Container>
  );
};

export default ChessGame;