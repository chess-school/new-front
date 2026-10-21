import axiosInstance from '@/api';
import { User } from '@/types/User';

export const getPublicProfileByUuid = async (uuid: string): Promise<User | undefined> => {
    // В будущем это может быть /users/:uuid, но сейчас ищем тренера
    const response = await axiosInstance.get(`/coaches?uuid=${uuid}`);
    // Ответ getCoaches возвращает coach DTO, который содержит user object
    return response.data?.user;
};
