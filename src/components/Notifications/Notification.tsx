import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
  Divider,
  Box,
  Typography
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { getNotifications, markAsRead, deleteNotification } from '@/api/notifications';

interface Notification {
  _id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsProps {
  navigateToRequests: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ navigateToRequests }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { t } = useTranslation();

  const open = Boolean(anchorEl);
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Обновляем каждые 30 секунд
    return () => clearInterval(interval); // Очищаем интервал при размонтировании
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    // При открытии можно пометить видимые как прочитанные или просто обновить
    fetchNotifications(); 
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // 👇 ИСПРАВЛЕНИЕ: Добавляем `event` в аргументы
  const handleDeleteNotification = async (event: React.MouseEvent, notificationId: string) => {
    event.stopPropagation(); // 👈 ГЛАВНОЕ ИСПРАВЛЕНИЕ! Останавливаем всплытие.
    try {
      await deleteNotification(notificationId);
      // Оптимистичное обновление UI для мгновенной реакции
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Помечаем как прочитанное, только если оно не было прочитано
    if (!notification.read) {
      markAsRead(notification._id);
      // Оптимистичное обновление
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
    }

    // Если это заявка, переходим во "Входящие"
    if (notification.type === 'request' || notification.type === 'homework_submission') {
      navigateToRequests();
    }
    
    handleMenuClose();
  };
  
  const handleViewAllClick = () => {
    navigateToRequests();
    handleMenuClose();
  }

  return (
    <div>
      <IconButton onClick={handleMenuOpen} aria-label={t('notifications.title', 'Notifications')} sx={{ color: 'text.primary' }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { maxHeight: 420, width: 400, maxWidth: 'calc(100vw - 32px)' } }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">{t('notifications.title', 'Notifications')}</Typography>
        </Box>
        {notifications.length === 0 ? (
          <MenuItem disabled>{t('notifications.empty', 'No notifications')}</MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{ 
                bgcolor: notification.read ? 'transparent' : 'action.hover',
                whiteSpace: 'normal',
                alignItems: 'flex-start',
                pr: 6,
              }}
            >
              <ListItemText
                primary={notification.content}
                secondary={new Date(notification.createdAt).toLocaleString()}
              />
              <ListItemSecondaryAction>
                {/* 👇 Передаем `event` в обработчик */}
                <MuiIconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(event) => handleDeleteNotification(event, notification._id)}
                >
                  <DeleteIcon fontSize="small" />
                </MuiIconButton>
              </ListItemSecondaryAction>
            </MenuItem>
          ))
        )}
        <Divider />
        <MenuItem onClick={handleViewAllClick}>
            <ListItemText primary={t('notifications.viewAll', 'View all in Inbox')} primaryTypographyProps={{ color: 'primary', fontWeight: 600 }} sx={{ textAlign: 'center' }} />
        </MenuItem>
      </Menu>
    </div>
  );
};