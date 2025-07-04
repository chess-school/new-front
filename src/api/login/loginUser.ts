import axiosInstance from '@/api'; 
import { LoginCredentials, LoginResponse } from '@/types/Auth'; 

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axiosInstance.post('/auth/login', credentials);
  
  return response.data;
};