import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton as MuiIconButton,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const [unreadCount, setUnreadCount] = useState(0);

  const open = Boolean(anchorEl);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((notif: Notification) => !notif.read).length);
    } catch (error) {
      console.error('Ошибка при получении уведомлений:', error);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Ошибка при пометке уведомления как прочитанного:', error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error('Ошибка при удалении уведомления:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'request') {
      navigateToRequests();
    }
    handleMarkAsRead(notification._id);
    handleMenuClose();
  };
  return (
    <div>
      <IconButton color="inherit" onClick={handleMenuOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: 48 * 4.5,
            width: '400px',
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem onClick={handleMenuClose}>Уведомлений нет</MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
            >
              <ListItemText
                primary={notification.content}
                secondary={new Date(notification.createdAt).toLocaleString()}
                style={{
                  textDecoration: notification.read ? 'line-through' : 'none',
                }}
              />
              <ListItemSecondaryAction>
                <MuiIconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDeleteNotification(notification._id)}
                >
                  <DeleteIcon />
                </MuiIconButton>
              </ListItemSecondaryAction>
            </MenuItem>
          ))
        )}
      </Menu>
    </div>
  );
};
