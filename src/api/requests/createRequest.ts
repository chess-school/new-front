import axiosInstance from '@/api'; 

export const createRequest = async (coachId: string, experience: string, goals: string) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axiosInstance.post(
      '/trainer/request',
      {
        coachId,
        experience,
        goals,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error('Ошибка при отправке заявки. Попробуйте позже.');
  }
};
