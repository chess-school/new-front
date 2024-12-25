import React, { useState } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { Container, Stack, Button, TextField, Typography, Box } from '@mui/material';
import { notification } from 'antd';
import ChessBoard from '../ChessGame/ChessBoard';

interface PuzzleEditorProps {
  initialFen?: string; // FEN-позиция для загрузки
}

const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ initialFen }) => {
  const defaultFen = initialFen || 'start';
  const [chess] = useState(new Chess(defaultFen === 'start' ? undefined : defaultFen));
  const [fen, setFen] = useState(chess.fen());
  const [draggedPiece, setDraggedPiece] = useState<{ type: PieceSymbol; color: Color } | null>(null);

  const pieces: { type: PieceSymbol; color: Color; icon: string }[] = [
    { type: 'k', color: 'b', icon: '♚' },
    { type: 'q', color: 'b', icon: '♛' },
    { type: 'r', color: 'b', icon: '♜' },
    { type: 'b', color: 'b', icon: '♝' },
    { type: 'n', color: 'b', icon: '♞' },
    { type: 'p', color: 'b', icon: '♟' },
    { type: 'k', color: 'w', icon: '♔' },
    { type: 'q', color: 'w', icon: '♕' },
    { type: 'r', color: 'w', icon: '♖' },
    { type: 'b', color: 'w', icon: '♗' },
    { type: 'n', color: 'w', icon: '♘' },
    { type: 'p', color: 'w', icon: '♙' },
  ];

  // Добавление фигуры на доску
  const handleSquareClick = (square: Square) => {
    if (draggedPiece) {
      chess.put(draggedPiece, square); // Устанавливаем фигуру
      setFen(chess.fen());
    }
  };

  // Очистка доски
  const clearBoard = () => {
    chess.clear(); // Полностью очищаем доску
    setFen(chess.fen());
    notification.success({
        message: 'Доска очищена!',
        description: undefined
    });
  };

  // Установка начальной позиции
  const setInitialPosition = () => {
    chess.reset(); // Устанавливаем начальную позицию
    setFen(chess.fen());
    notification.success({
        message: 'Установлена начальная позиция!',
        description: undefined
    });
  };

  // Сохранение позиции
  const savePosition = () => {
    try {
      chess.load(fen); // Проверяем FEN на валидность
      notification.success({
        message: 'Позиция успешно сохранена!',
        description: `FEN: ${fen}`,
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка сохранения',
        description: 'Некорректная FEN-позиция: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'),
      });
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Редактор шахматной задачи
      </Typography>

      <Box display="flex" alignItems="center">
        {/* Шахматная доска */}
        <ChessBoard
          position={fen}
          onMove={(_sourceSquare, targetSquare) => {
            handleSquareClick(targetSquare);
            return true;
          }}
          boardWidth={500}
        />

        {/* Панель фигур */}
        <Box ml={2} display="flex" flexDirection="column">
  {pieces.map((piece, index) => (
    <div
      key={index}
      draggable
      onDragStart={() => setDraggedPiece(piece)} // Захват фигуры
      style={{
        margin: '5px 0',
        padding: '10px',
        textAlign: 'center',
        backgroundColor: '#e0e0e0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'grab',
        fontSize: '24px', // Увеличиваем размер иконок
      }}
    >
      {piece.icon}
    </div>
  ))}
</Box>
      </Box>

      <Stack direction="row" spacing={2} style={{ marginTop: 20 }}>
        <Button variant="contained" color="primary" onClick={clearBoard}>
          Очистить доску
        </Button>
        <Button variant="contained" color="secondary" onClick={setInitialPosition}>
          Начальная позиция
        </Button>
        <Button variant="contained" color="secondary" onClick={savePosition}>
          Сохранить позицию
        </Button>
      </Stack>

      <TextField
        label="FEN позиции"
        value={fen}
        onChange={(e) => {
          const newFen = e.target.value.trim();
          try {
            chess.load(newFen); // Проверяем валидность введенного FEN
            setFen(newFen);
          } catch {
            notification.error({
              message: 'Некорректный FEN',
              description: 'Позиция не может быть загружена.',
            });
          }
        }}
        fullWidth
        multiline
        rows={2}
        style={{ marginTop: 20 }}
      />
    </Container>
  );
};

export default PuzzleEditor;
