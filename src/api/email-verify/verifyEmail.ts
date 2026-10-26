import axiosInstance from '@/api';

/** Подтверждение email по токену из письма: GET /auth/verify-email?token=... */
export const verifyEmail = async (token: string): Promise<{ msg: string }> => {
  const response = await axiosInstance.get('/auth/verify-email', {
    params: { token },
    silent: true, // страница сама покажет результат
  });
  return response.data;
};
