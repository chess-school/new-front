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
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

// Универсальный тип строки таблицы
interface RowData {
  id: string;
  [key: string]: any;
}

// Универсальный интерфейс для колонок таблицы
interface Column<T> {
  field: keyof T;
  label: string;
  type?: 'text' | 'select';
  options?: string[];
}

// Пропсы с поддержкой любого типа данных (User, Product и т.д.)
interface CustomTableProps<T extends RowData> {
  columns: Column<T>[];
  data: T[];
  onEdit: (updatedRow: T) => void;
}

const CustomTable = <T extends RowData>({ columns, data, onEdit }: CustomTableProps<T>) => {
  const [search, setSearch] = useState<string>('');
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const [editableRow, setEditableRow] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<T | null>(null);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (row: T) => {
    setEditableRow(row.id);
    setEditedValues({ ...row });
  };

  const handleSave = () => {
    if (editedValues) {
      onEdit(editedValues);
      setEditableRow(null);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>,
    field: keyof T
  ) => {
    const value = (event.target as HTMLInputElement).value || (event.target as { value: string | number }).value;
    if (editedValues) {
      setEditedValues({ ...editedValues, [field]: value });
    }
  };
  
  const filteredData = data.filter((row) =>
    columns.some((column) =>
      row[column.field]?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <TableContainer component={Paper}>
      <TextField
        fullWidth
        label="Поиск"
        variant="outlined"
        value={search}
        onChange={handleSearch}
        style={{ marginBottom: 10 }}
      />
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={String(column.field)}>{column.label}</TableCell>
            ))}
            <TableCell>Действия</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={String(column.field)}>
                  {editableRow === row.id ? (
                    column.type === 'select' ? (
                      <Select
                        value={editedValues ? editedValues[column.field] : ''}
                        onChange={(event) => handleChange(event, column.field)}
                        fullWidth
                      >
                        {column.options?.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <TextField
                        value={editedValues ? editedValues[column.field] : ''}
                        onChange={(event) => handleChange(event, column.field)}
                        fullWidth
                      />
                    )
                  ) : (
                    row[column.field]
                  )}
                </TableCell>
              ))}
              <TableCell>
                <IconButton onClick={() => handleEdit(row)}>
                  <EditIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

export default CustomTable;
