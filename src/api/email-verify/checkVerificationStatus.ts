import axiosInstance from '@/api';

export const checkVerificationStatus = async (email: string): Promise<{ emailVerified: boolean }> => {
  const response = await axiosInstance.get('/auth/check-verification', {
    params: { email },
    silent: true, // опрос каждые 5с — не показываем глобальные уведомления об ошибках
  });
  return response.data;
};