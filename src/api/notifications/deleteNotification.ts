import axiosInstance from '@/api';

export const deleteNotification = async (notificationId: string) => {
  const response = await axiosInstance.delete('/notifications', {
    params: {
      notification_id: notificationId
    }
  });
  return response.data;
};