import axiosInstance from '@/api'; 

export const fetchRequests = async () => {
  const token = localStorage.getItem('token');
  const response = await axiosInstance.get('/trainer/requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

