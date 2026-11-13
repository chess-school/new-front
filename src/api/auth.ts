import axiosInstance from '@/api';

/** Выход: сервер удаляет HttpOnly-cookie с токеном. Идемпотентно — ошибки глотаем. */
export const logoutUser = async (): Promise<void> => {
  try {
    await axiosInstance.post('/auth/logout', undefined, { silent: true });
  } catch {
    // неважно: cookie всё равно протухнет, локальное состояние сбрасываем в любом случае
  }
};
