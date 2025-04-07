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
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import axios from "axios";
import CustomTable from "@/shared/components/CustomTable/CustomTable";
import { User } from "@/types/User";

interface Column<T> {
  field: keyof T | "actions";
  label: string;
  type?: "text" | "select";
  options?: string[];
  render?: (row: T) => JSX.Element;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [actionType, setActionType] = useState<string>("add");
  const [open, setOpen] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // 🔥 Загружаем список пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:3000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(response.data.map((user: any) => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles,
        })));
      } catch (error) {
        console.error("Ошибка при получении списка пользователей:", error);
      }
    };

    fetchUsers();
  }, []);

  // 🔥 Открываем модальное окно
  const handleOpen = (user: User) => {
    setSelectedUser(user);
    setNewRole("");
    setActionType("add");
    setOpen(true);
  };

  // 🔥 Закрываем модальное окно
  const handleClose = () => {
    setSelectedUser(null);
    setOpen(false);
  };

  // 🔥 Открываем подтверждающее окно удаления аккаунта
  const handleConfirmDeleteOpen = (user: User) => {
    setSelectedUser(user);
    setConfirmDeleteOpen(true);
  };

  // 🔥 Закрываем подтверждающее окно удаления аккаунта
  const handleConfirmDeleteClose = () => {
    setConfirmDeleteOpen(false);
    setSelectedUser(null);
  };

  // 🔥 Меняем роль пользователя
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem("token");

    try {
      await axios.put(
        "http://localhost:3000/api/admin/update-role",
        { userEmail: selectedUser.email, role: newRole, action: actionType },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? {
              ...user,
              roles: actionType === "add" ? [...user.roles, newRole] : user.roles.filter(role => role !== newRole),
            }
          : user
      ));

      setSnackbar({
        open: true,
        message: `Роль ${newRole} ${actionType === "add" ? "добавлена" : "удалена"}`,
        severity: "success",
      });

      handleClose();
    } catch (error) {
      console.error("Ошибка при изменении роли пользователя:", error);
      setSnackbar({ open: true, message: "Ошибка при изменении роли", severity: "error" });
    }
  };

  // 🔥 Удаление пользователя
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`http://localhost:3000/api/admin/delete-user/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(users.filter(user => user.id !== selectedUser.id));

      setSnackbar({ open: true, message: "Пользователь удалён", severity: "success" });

      handleClose();
      handleConfirmDeleteClose();
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      setSnackbar({ open: true, message: "Ошибка при удалении пользователя", severity: "error" });
    }
  };

  // 🔥 Определяем колонки таблицы
  const columns: Column<User>[] = [
    { field: "firstName", label: "Имя", type: "text" },
    { field: "lastName", label: "Фамилия", type: "text" },
    { field: "email", label: "Email", type: "text" },
    { field: "roles", label: "Роль", type: "select", options: ["user", "student", "coach", "admin"] },
    {
      field: "actions",
      label: "Действия",
      render: (user: User) => (
        <>
          <IconButton onClick={() => handleOpen(user)}>
            <Edit />
          </IconButton>
          <IconButton color="error" onClick={() => handleConfirmDeleteOpen(user)}>
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

      {/* 🔥 Основное модальное окно */}
      <Dialog open={open} onClose={handleClose} fullWidth>
        <DialogTitle>Управление пользователем</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Изменение ролей и управление пользователем: <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>
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
          <Button onClick={handleClose}>Закрыть</Button>
          <Button onClick={handleRoleChange} color="primary" disabled={!newRole}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* 🔥 Окно подтверждения удаления */}
      <Dialog open={confirmDeleteOpen} onClose={handleConfirmDeleteClose}>
        <DialogTitle>Подтвердите удаление</DialogTitle>
        <DialogActions>
          <Button onClick={handleConfirmDeleteClose}>Нет</Button>
          <Button onClick={handleDeleteUser} color="error">Да</Button>
        </DialogActions>
      </Dialog>

      {/* 🔥 Уведомление (Snackbar) */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};
