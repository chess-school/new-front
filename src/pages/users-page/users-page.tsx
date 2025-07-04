// src/pages/users-page/users-page.tsx

import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

import axiosInstance from "@/api"; 
import CustomTable, { Column } from "@/shared/components/CustomTable/CustomTable";
import { User } from "@/types/User";

// Обновляем тип для данных с бэкенда, чтобы он соответствовал реальности
interface BackendUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  registrationDate: string; // С бэкенда приходит строка!
  // Добавляем опциональные поля, если они могут прийти
  students?: any[]; // Замените any на Student, если есть импорт
  trainer?: string;
  trainerEmail?: string;
  firebaseUID?: string;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const [open, setOpen] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get<BackendUser[]>("/users");

        // ИСПРАВЛЕНИЕ: Создаем объекты, которые ПОЛНОСТЬЮ соответствуют типу User
        const mappedUsers: User[] = response.data.map((user) => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles,
          
          // 👇 Вот ключевые исправления, которые решают ошибку
          _id: user._id, // 1. Добавляем обязательное поле _id
          registrationDate: new Date(user.registrationDate), // 2. Преобразуем строку в объект Date

          // 3. (Хорошая практика) Прокидываем опциональные поля
          firebaseUID: user.firebaseUID,
          students: user.students,
          trainer: user.trainer,
          trainerEmail: user.trainerEmail,
        }));
        setUsers(mappedUsers);
      } catch (error) {
        console.error("Ошибка при получении списка пользователей:", error);
      }
    };
    fetchUsers();
  }, []);

  // ... остальной код компонента без изменений ...
  const handleOpen = (user: User) => {
    setSelectedUser(user);
    setNewRole("");
    setActionType("add");
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedUser(null);
    setOpen(false);
  };

  const handleConfirmDeleteOpen = (user: User) => {
    setSelectedUser(user);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    try {
      await axiosInstance.put("/admin/update-role", {
        userEmail: selectedUser.email,
        role: newRole,
        action: actionType,
      });

      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? {
              ...user,
              roles: actionType === "add" ? [...user.roles, newRole] : user.roles.filter(role => role !== newRole),
            }
          : user
      ));
      setSnackbar({ open: true, message: "Роль успешно изменена", severity: "success" });
      handleClose();
    } catch (error) {
      console.error("Ошибка при изменении роли:", error);
      setSnackbar({ open: true, message: "Ошибка при изменении роли", severity: "error" });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await axiosInstance.delete(`/admin/delete-user/${selectedUser.id}`);
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setSnackbar({ open: true, message: "Пользователь удалён", severity: "success" });
      handleConfirmDeleteClose();
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      setSnackbar({ open: true, message: "Ошибка при удалении пользователя", severity: "error" });
    }
  };

  const columns: Column<User>[] = [
    { field: "firstName", label: "Имя" },
    { field: "lastName", label: "Фамилия" },
    { field: "email", label: "Email" },
    { field: "roles", label: "Роли", render: (user) => user.roles.join(', ') },
    {
      field: "actions",
      label: "Действия",
      render: (user: User) => (
        <>
          <IconButton size="small" onClick={() => handleOpen(user)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleConfirmDeleteOpen(user)}>
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Список пользователей</Typography>
      <CustomTable columns={columns} data={users} />

      {/* Диалоговые окна без изменений... */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Управление ролями</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Пользователь: <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
          </DialogContentText>
          <FormControl fullWidth sx={{ marginTop: 2 }}>
            <InputLabel>Роль</InputLabel>
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value)} label="Роль">
              <MenuItem value="student">Студент</MenuItem>
              <MenuItem value="coach">Тренер</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleRoleChange} color="primary" disabled={!newRole}>Сохранить</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose}>
        <DialogTitle>Подтвердите удаление</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Вы уверены, что хотите удалить пользователя {selectedUser?.email}? Это действие необратимо.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDeleteClose}>Нет</Button>
          <Button onClick={handleDeleteUser} color="error">Да, удалить</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};