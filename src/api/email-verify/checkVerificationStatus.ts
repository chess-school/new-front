import axiosInstance from '@/api';

export const checkVerificationStatus = async (email: string): Promise<{ emailVerified: boolean }> => {
  const response = await axiosInstance.get('/auth/check-verification', {
    params: { email }, 
  });
  return response.data;
};