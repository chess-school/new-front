import axiosInstance from '@/api';
import { User } from '@/types/User';

/**
 * Профиль текущего пользователя. Авторизация — по HttpOnly-cookie (withCredentials).
 * skipAuthRedirect=true для начальной проверки сессии: 401 означает «гость», а не ошибку,
 * поэтому глобальный перехватчик не должен редиректить на /login.
 */
export const getMyProfile = async (opts?: { skipAuthRedirect?: boolean }): Promise<User> => {
  const response = await axiosInstance.get('/users/me', { skipAuthRedirect: opts?.skipAuthRedirect });
  return response.data;
};
