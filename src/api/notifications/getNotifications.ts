import axiosInstance from '@/api'; 

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getNotifications = async () => {
  const response = await axiosInstance.get('/notifications', getAuthHeaders());
  return response.data;
};
