import axiosInstance from '@/api';
import { User } from '@/types/User';

export const getUserProfileById = async (userId: string): Promise<User> => {
    const response = await axiosInstance.get(`/auth/profile/${userId}`); 
    return response.data;
};