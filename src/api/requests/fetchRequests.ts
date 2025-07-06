import axiosInstance from '@/api'; 

export const fetchRequests = async () => {
  const response = await axiosInstance.get('/trainer/requests', {
  });
  return response.data;
};

