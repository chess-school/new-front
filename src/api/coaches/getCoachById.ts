import axiosInstance from '@/api'; 
import { User } from '@/types/User';

export const getCoachById = async (coachId: string): Promise<User> => {
    const response = await axiosInstance.get(`/coach/${coachId}`);
    return response.data;
};