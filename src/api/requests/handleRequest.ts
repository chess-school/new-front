import axiosInstance from '@/api'; 

export const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    await axiosInstance.patch(
      `/trainer/request?request_id=${requestId}`,
      { status },
    );
  };