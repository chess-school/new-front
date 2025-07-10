import axiosInstance from '@/api'; 
import { RegistrationData } from '@/types/Auth';

export const registerUser = async (data: RegistrationData) => {
  try {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  } catch (error) {
    console.error('Registration failed', error);
    throw error;
  }
};
