import axios from '..';

export const createNotification = async (data: {
  recipient: string;
  type: string;
  content: string;
  metadata?: { [key: string]: any };
}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Токен авторизации отсутствует');
  }

  try {
    const response = await axios.post('/notifications', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании уведомления:', error);
    throw error;
  }
};
