// src/shared/components/CustomTable/CustomTable.tsx

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TablePagination,
} from '@mui/material';

// Универсальный тип строки таблицы. Гарантирует наличие `id`.
interface RowData {
  id: string | number;
  [key: string]: any;
}

// ИСПРАВЛЕНИЕ: Мы экспортируем этот тип, чтобы другие компоненты могли его использовать.
// Также, `field` теперь может быть специальным значением 'actions',
// а для таких полей мы добавим опциональный `render`.
export interface Column<T> {
  field: keyof T | 'actions';
  label: string;
  render?: (row: T) => React.ReactNode;
}

// Пропсы для нашего универсального компонента.
interface CustomTableProps<T extends RowData> {
  columns: Column<T>[];
  data: T[];
}

const CustomTable = <T extends RowData>({ columns, data }: CustomTableProps<T>) => {
  const [search, setSearch] = useState<string>('');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0); // Сбрасываем на первую страницу при поиске
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const filteredData = data.filter((row) =>
    columns.some((column) => {
      // Не ищем по колонке 'actions'
      if (column.field === 'actions') return false;
      const value = row[column.field as keyof T];
      return value?.toString().toLowerCase().includes(search.toLowerCase());
    })
  );

  return (
    <Paper>
      <TextField
        fullWidth
        label="Поиск"
        variant="outlined"
        value={search}
        onChange={handleSearch}
        style={{ padding: '16px' }}
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={String(column.field)}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={String(column.field)}>
                    {column.render ? column.render(row) : row[column.field as keyof T]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default CustomTable;