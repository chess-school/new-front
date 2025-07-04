import axiosInstance from '@/api'; 

export const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('token');
    await axiosInstance.patch(
      `/trainer/request?request_id=${requestId}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };