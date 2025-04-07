import axios from '..';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const deleteNotification = async (notificationId: string) => {
  const response = await axios.delete(
    `/notifications?notification_id=${notificationId}`,
    getAuthHeaders()
  );
  return response.data;
};
