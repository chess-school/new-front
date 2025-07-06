import axiosInstance from '@/api';

export const checkVerificationStatus = async (token: string): Promise<{ emailVerified: boolean }> => {
  const response = await axiosInstance.post('/auth/check-verification', { token });
  return response.data;
};