import React from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableRow, TableHead } from '@mui/material';

interface Variation {
  move: string; // Ход SAN
  fen: string; // FEN позиции для подварианта
  parentIndex: number; // Индекс хода, к которому относится подвариант
}

interface MoveHistoryProps {
  history: string[]; // История ходов
  evaluations?: number[]; // Оценки ходов (опционально)
  currentMoveIndex?: number; // Текущий индекс хода (для подсветки)
  onMoveClick?: (moveIndex: number) => void; // Обработчик кликов по основным ходам
  variations?: Variation[]; // Список подвариантов
  onVariationClick?: (variationIndex: number) => void; // Обработчик кликов по подвариантам
}

const MoveHistory: React.FC<MoveHistoryProps> = ({
  history,
  evaluations,
  currentMoveIndex,
  onMoveClick,
  variations = [],
  onVariationClick,
}) => {
  // Форматируем ходы для отображения в таблице
  const formattedMoves = history.reduce<string[][]>((acc, move, index) => {
    const moveNumber = Math.floor(index / 2) + 1;
    if (index % 2 === 0) {
      acc.push([`${moveNumber}.`, move]); // Белый ход
    } else {
      acc[acc.length - 1].push(move); // Черный ход
    }
    return acc;
  }, []);

  return (
    <Paper style={{ padding: 10, maxHeight: '400px', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        История ходов
      </Typography>
      {history.length === 0 ? (
        <Typography>Пока нет ходов</Typography>
      ) : (
        <Table size="small" style={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell>№</TableCell>
              <TableCell>Белые</TableCell>
              <TableCell>Черные</TableCell>
              {evaluations && <TableCell>Оценка</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {formattedMoves.map((pair, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {/* Основные ходы */}
                <TableRow>
                  <TableCell>{pair[0]}</TableCell>
                  {/* Кликабельный ход белых */}
                  <TableCell
                    onClick={onMoveClick ? () => onMoveClick(rowIndex * 2) : undefined}
                    style={{
                      cursor: onMoveClick ? 'pointer' : 'default',
                      backgroundColor:
                        currentMoveIndex === rowIndex * 2 ? '#f0f0f0' : 'transparent',
                    }}
                  >
                    {pair[1]}
                  </TableCell>
                  {/* Кликабельный ход черных */}
                  <TableCell
                    onClick={
                      pair[2] && onMoveClick ? () => onMoveClick(rowIndex * 2 + 1) : undefined
                    }
                    style={{
                      cursor: pair[2] && onMoveClick ? 'pointer' : 'default',
                      backgroundColor:
                        currentMoveIndex === rowIndex * 2 + 1 ? '#f0f0f0' : 'transparent',
                    }}
                  >
                    {pair[2] || ''}
                  </TableCell>
                  {evaluations && (
                    <TableCell>
                      {evaluations[rowIndex]
                        ? evaluations[rowIndex] > 0
                          ? `+${evaluations[rowIndex].toFixed(2)}`
                          : evaluations[rowIndex].toFixed(2)
                        : '-'}
                    </TableCell>
                  )}
                </TableRow>

                {/* Отображение подвариантов */}
                {variations
  .filter((variation) => variation.parentIndex === rowIndex * 2 || variation.parentIndex === rowIndex * 2 + 1)
  .map((variation, varIndex) => (
    <TableRow key={`variation-${rowIndex}-${varIndex}`}>
      <TableCell></TableCell>
      <TableCell
        onClick={() => onVariationClick?.(variations.indexOf(variation))}
        style={{
          cursor: 'pointer',
          paddingLeft: '20px',
          color: '#888',
          fontStyle: 'italic',
          backgroundColor:
            currentMoveIndex === variations.indexOf(variation) ? '#e0e0e0' : 'transparent',
        }}
      >
        {variation.move}
      </TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
    </TableRow>
  ))}

              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </Paper>
  );
};

export default MoveHistory;
