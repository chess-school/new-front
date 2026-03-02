// import React, { useState, useEffect, useRef } from 'react';
// import { Chess, Square, PieceSymbol, Color } from 'chess.js';
// import {
//   Checkbox,
//   Container,
//   Stack,
//   Button,
//   TextField,
//   Typography,
//   Box,
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   FormGroup,
//   Paper,
// } from '@mui/material';
// import { notification } from 'antd';
// import ChessBoard from '../ChessGame/ChessBoard';

// interface PuzzleEditorProps {
//   initialFen?: string;
// }

// const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ initialFen }) => {
//   const defaultFen = initialFen || '8/8/8/8/8/8/8/8 w - - 0 1';
//   const [isCursorOnBoard, setIsCursorOnBoard] = useState(false);
//   const [chess] = useState(() => {
//     const instance = new Chess();
//     instance.clear();
//     return instance;
//   });
//   const [fen, setFen] = useState(defaultFen);
//   const [draggedPiece, setDraggedPiece] = useState<{
//     icon: string;
//     type: PieceSymbol;
//     color: Color;
//   } | null>(null);
//   const [cursorStyle, setCursorStyle] = useState<React.CSSProperties | null>(null);

//   const pieces: { type: PieceSymbol; color: Color; icon: string }[] = [
//     { type: 'k', color: 'b', icon: '♚' },
//     { type: 'q', color: 'b', icon: '♛' },
//     { type: 'r', color: 'b', icon: '♜' },
//     { type: 'b', color: 'b', icon: '♝' },
//     { type: 'n', color: 'b', icon: '♞' },
//     { type: 'p', color: 'b', icon: '♟' },
//     { type: 'k', color: 'w', icon: '♔' },
//     { type: 'q', color: 'w', icon: '♕' },
//     { type: 'r', color: 'w', icon: '♖' },
//     { type: 'b', color: 'w', icon: '♗' },
//     { type: 'n', color: 'w', icon: '♘' },
//     { type: 'p', color: 'w', icon: '♙' },
//   ];

//   const boardRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       if (!draggedPiece || !isCursorOnBoard || !boardRef.current) return;
  
//       const rect = boardRef.current.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;
  
//       if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
//         setCursorStyle({
//           left: x,
//           top: y,
//         });
//       }
//     };
  
//     window.addEventListener('mousemove', handleMouseMove);
//     return () => window.removeEventListener('mousemove', handleMouseMove);
//   }, [draggedPiece, isCursorOnBoard]);
  
  

//   const updateCastlingRights = (
//     _rights: string,
//     checked: boolean,
//     flag: 'K' | 'Q' | 'k' | 'q'
//   ) => {
//     let parts = fen.split(' ');
//     let castling = parts[2] === '-' ? '' : parts[2];
//     if (checked) {
//       castling = (castling + flag).split('').sort().join('');
//     } else {
//       castling = castling.replace(flag, '');
//     }
//     parts[2] = castling || '-';
//     const updatedFen = parts.join(' ');
//     try {
//       chess.load(updatedFen);
//       setFen(updatedFen);
//     } catch {
//       notification.error({
//         message: 'Ошибка рокировки',
//         description: undefined
//       });
//     }
//   };

//   const handleSquareClick = (square: Square) => {
//     const [file, rank] = [square.charCodeAt(0) - 97, 8 - parseInt(square[1])];
//     const board = chess.board();
//     const existingPiece = board[rank][file];
  
//     if (draggedPiece) {
//       // если фигура уже стоит там — удалим её
//       if (
//         existingPiece &&
//         existingPiece.type === draggedPiece.type &&
//         existingPiece.color === draggedPiece.color
//       ) {
//         chess.remove(square);
//       } else {
//         chess.put(draggedPiece, square);
//       }
//       setFen(chess.fen());
//       return;
//     }
  
//     if (existingPiece) {
//       chess.remove(square);
//       setFen(chess.fen());
//     }
//   };
  

//   const clearBoard = () => {
//     chess.clear();
//     setFen(chess.fen());
//     notification.success({
//       message: 'Доска очищена!',
//       description: undefined
//     });
//   };

//   const setInitialPosition = () => {
//     chess.reset();
//     setFen(chess.fen());
//     notification.success({
//       message: 'Установлена начальная позиция!',
//       description: undefined
//     });
//   };

//   const removeDraggedPiece = () => {
//     setDraggedPiece(null);
//     setCursorStyle(null);
//   };

//   const savePosition = () => {
//     const kingCount = fen.split('').filter((char) => char.toLowerCase() === 'k').length;
//     if (kingCount < 2) {
//       notification.error({
//         message: 'Некорректная позиция',
//         description: 'На доске должно быть как минимум два короля.',
//       });
//       return;
//     }

//     try {
//       chess.load(fen);
//       notification.success({ message: 'Позиция сохранена', description: `FEN: ${fen}` });
//     } catch (error) {
//       notification.error({
//         message: 'Ошибка сохранения',
//         description: 'Некорректная FEN-позиция',
//       });
//     }
//   };

//   return (
//     <Container>
//       <Typography variant="h4" gutterBottom>
//         Редактор шахматной позиции
//       </Typography>

//       <Box display="flex">
//       <Box
//   onMouseEnter={() => setIsCursorOnBoard(true)}
//   onMouseLeave={() => setIsCursorOnBoard(false)}
//   style={{
//     cursor: draggedPiece ? 'none' : 'default',
//     position: 'relative',
//     width: 500, // такой же как boardWidth
//     height: 500,
//   }}
// >
//   <ChessBoard
//     position={fen}
//     onSquareClick={handleSquareClick}
//     boardWidth={500}
//   />
//   {cursorStyle && draggedPiece && (
//     <div
//       style={{
//         ...cursorStyle,
//         position: 'absolute',
//         pointerEvents: 'none',
//         left: cursorStyle.left,
//         top: cursorStyle.top,
//         fontSize: '32px',
//         zIndex: 1000,
//       }}
//     >
//       {draggedPiece.icon}
//     </div>
//   )}
// </Box>


//         <Box ml={3} display="flex" flexDirection="column">
//           <Paper elevation={3} style={{ padding: '10px', marginBottom: '20px' }}>
//             <Typography variant="h6" gutterBottom>Фигуры</Typography>
//             <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
//               {pieces.map((piece, idx) => (
//                 <Box
//                   key={idx}
//                   onClick={() => setDraggedPiece(piece)}
//                   style={{
//                     textAlign: 'center',
//                     cursor: 'pointer',
//                     padding: 6,
//                     border: '1px solid #aaa',
//                     borderRadius: 4,
//                     fontSize: 24,
//                     backgroundColor: draggedPiece === piece ? '#1976d2' : '#f5f5f5',
//                     color: draggedPiece === piece ? '#fff' : 'inherit',
//                   }}
//                 >
//                   {piece.icon}
//                 </Box>
//               ))}
//             </Box>
//           </Paper>

//           <Paper elevation={3} style={{ padding: '10px', marginBottom: '20px' }}>
//             <Typography variant="h6">Рокировка</Typography>
//             <FormGroup row>
//               <FormControlLabel
//                 control={<Checkbox checked={fen.includes('K')} onChange={(e) => updateCastlingRights(fen, e.target.checked, 'K')} />}
//                 label="Белые 0-0"
//               />
//               <FormControlLabel
//                 control={<Checkbox checked={fen.includes('Q')} onChange={(e) => updateCastlingRights(fen, e.target.checked, 'Q')} />}
//                 label="Белые 0-0-0"
//               />
//               <FormControlLabel
//                 control={<Checkbox checked={fen.includes('k')} onChange={(e) => updateCastlingRights(fen, e.target.checked, 'k')} />}
//                 label="Чёрные 0-0"
//               />
//               <FormControlLabel
//                 control={<Checkbox checked={fen.includes('q')} onChange={(e) => updateCastlingRights(fen, e.target.checked, 'q')} />}
//                 label="Чёрные 0-0-0"
//               />
//             </FormGroup>
//           </Paper>

//           <Paper elevation={3} style={{ padding: '10px' }}>
//             <Typography variant="h6">Ход</Typography>
//             <RadioGroup
//               row
//               value={chess.turn()}
//               onChange={(e) => {
//                 const newFen = fen.split(' ');
//                 newFen[1] = e.target.value;
//                 const updatedFen = newFen.join(' ');
//                 try {
//                   chess.load(updatedFen);
//                   setFen(updatedFen);
//                 } catch {
//                   notification.error({
//                     message: 'Ошибка изменения хода',
//                     description: undefined
//                   });
//                 }
//               }}
//             >
//               <FormControlLabel value="w" control={<Radio />} label="Белые" />
//               <FormControlLabel value="b" control={<Radio />} label="Чёрные" />
//             </RadioGroup>
//           </Paper>
//         </Box>
//       </Box>

//       <Stack direction="row" spacing={2} mt={3}>
//         <Button variant="contained" onClick={clearBoard}>Очистить доску</Button>
//         <Button variant="contained" onClick={setInitialPosition}>Начальная позиция</Button>
//         <Button variant="contained" onClick={removeDraggedPiece}>Убрать фигуру</Button>
//         <Button variant="contained" color="primary" onClick={savePosition}>Сохранить</Button>
//       </Stack>

//       <TextField
//         label="FEN"
//         value={fen}
//         fullWidth
//         multiline
//         rows={2}
//         onChange={(e) => {
//           const newFen = e.target.value;
//           try {
//             chess.load(newFen);
//             setFen(newFen);
//           } catch {
//             notification.error({
//               message: 'Некорректный FEN',
//               description: undefined
//             });
//           }
//         }}
//         style={{ marginTop: 20 }}
//       />

//       {cursorStyle && draggedPiece && (
//         <div style={cursorStyle}>{draggedPiece.icon}</div>
//       )}
//     </Container>
//   );
// };

// export default PuzzleEditor;
