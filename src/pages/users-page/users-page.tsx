import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Select, FormControl, InputLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import axios from 'axios';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [actionType, setActionType] = useState<string>('add'); // "add" or "remove"
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Ошибка при получении списка пользователей:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleOpen = (user: User) => {
    setSelectedUser(user);
    setNewRole(''); // Reset role when opening dialog
    setActionType('add'); // Reset action type
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedUser(null);
    setOpen(false);
  };

  const handleRoleChange = async () => {
    const token = localStorage.getItem('token');

    try {
      let apiUrl = '';
      const requestBody: { userEmail: string; role?: string } = {
        userEmail: selectedUser?.email || '',
      };

      if (actionType === 'add') {
        apiUrl = newRole === 'student'
          ? 'http://localhost:3000/api/assign-user-to-student'
          : 'http://localhost:3000/api/admin/assign-coach';
      } else {
        apiUrl = 'http://localhost:3000/api/admin/remove-role';
        requestBody.role = newRole; 
      }

      await axios.post(apiUrl, requestBody, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setUsers(users.map(user => {
        if (user._id === selectedUser?._id) {
          return actionType === 'add'
            ? { ...user, roles: [...user.roles, newRole] }
            : { ...user, roles: user.roles.filter(role => role !== newRole) };
        }
        return user;
      }));

      handleClose();
    } catch (error) {
      console.error('Ошибка при изменении роли пользователя:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Список пользователей
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Имя</TableCell>
              <TableCell>Фамилия</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.firstName}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.roles.join(', ')}</TableCell>
                <TableCell>
                  <Button variant="outlined" onClick={() => handleOpen(user)}>
                    Редактировать
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Изменить роль пользователя</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Пожалуйста, выберите действие для пользователя: {selectedUser?.firstName} {selectedUser?.lastName}
          </DialogContentText>
          <FormControl component="fieldset">
            <RadioGroup row value={actionType} onChange={(e) => setActionType(e.target.value)}>
              <FormControlLabel value="add" control={<Radio />} label="Добавить роль" />
              <FormControlLabel value="remove" control={<Radio />} label="Удалить роль" />
            </RadioGroup>
          </FormControl>

          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="Роль"
            >
              {actionType === 'add' ? (
                <>
                  <MenuItem value="student">Студент</MenuItem>
                  <MenuItem value="coach">Тренер</MenuItem>
                </>
              ) : (
                selectedUser?.roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleRoleChange} color="primary" disabled={!newRole}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
