import axiosInstance from '@/api';

// PATCH /api/v2/notifications/:id/read
export const markAsRead = async (notificationId: string) => {
  const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
  return response.data;
};
