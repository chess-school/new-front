import axiosInstance from '@/api';

export const resendVerificationEmail = async (token: string): Promise<{ msg: string }> => {
  const response = await axiosInstance.post('/auth/resend-verification', { token });
  return response.data;
};