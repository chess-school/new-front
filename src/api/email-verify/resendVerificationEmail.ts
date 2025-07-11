import axiosInstance from '@/api';

export const resendVerificationEmail = async (email: string): Promise<{ msg: string }> => {
  const response = await axiosInstance.post('/auth/resend-verification', { email });
  return response.data;
};