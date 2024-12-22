import axios from '..';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  };
};

export const updateProfile = async (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}) => {
  const response = await axios.put('/auth/profile', data, getAuthHeaders());
  return response.data;
};
