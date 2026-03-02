import axiosInstance from '@/api';
import { User } from '@/types/User';

interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatar?: File;
}

export const updateProfile = async (data: UpdateProfilePayload): Promise<User> => {
  const formData = new FormData();

  (Object.keys(data) as Array<keyof UpdateProfilePayload>).forEach(key => {
    const value = data[key];
    if (value) {
      formData.append(key, value);
    }
  });

  const response = await axiosInstance.put('/users/me', formData);
  return response.data.user;
};
