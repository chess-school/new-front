import axiosInstance from '@/api';

// DELETE /api/v2/notifications/:id
export const deleteNotification = async (notificationId: string) => {
  const response = await axiosInstance.delete(`/notifications/${notificationId}`);
  return response.data;
};
