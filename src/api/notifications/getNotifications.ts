import axiosInstance from '@/api';

// GET /api/v2/notifications -> { data: Notification[], unreadCount, pagination }
export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications');
  return Array.isArray(response.data?.data) ? response.data.data : [];
};
