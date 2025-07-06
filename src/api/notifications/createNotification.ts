import axiosInstance from '@/api'; 

interface NotificationPayload {
  recipient: string;
  type: string;
  content: string;
  metadata?: { [key: string]: any };
}

export const createNotification = async (data: NotificationPayload) => {
    const response = await axiosInstance.post('/notifications', data);
    return response.data;
};