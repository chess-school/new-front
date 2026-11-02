import axiosInstance from '@/api';
import { User } from '@/types/User';

/**
 * Публичный профиль пользователя по uuid (GET /users/:uuid) — для просмотра чужого
 * профиля (тренер смотрит ученика и т.п.). Бэкенд отдаёт только несекретные поля
 * (без email/phone). Возвращает undefined, если профиль не найден/недоступен.
 */
export const getPublicProfileByUuid = async (uuid: string): Promise<User | undefined> => {
    try {
        const response = await axiosInstance.get(`/users/${encodeURIComponent(uuid)}`, { silent: true });
        return response.data as User;
    } catch {
        return undefined;
    }
};
