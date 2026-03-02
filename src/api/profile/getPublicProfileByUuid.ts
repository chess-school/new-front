import axiosInstance from '@/api';

export const getPublicProfileByUuid = async (uuid: string): Promise<any> => {
    // В будущем это может быть /users/:uuid, но сейчас ищем тренера
    const response = await axiosInstance.get(`/coaches?uuid=${uuid}`);
    // Ответ getCoaches возвращает coach DTO, который содержит user object
    return response.data?.user;
};
