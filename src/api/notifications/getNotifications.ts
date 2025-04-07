import axios from '..';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getNotifications = async () => {
  const response = await axios.get('/notifications', getAuthHeaders());
  return response.data;
};
