import axios from '..';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  };
};

export const getProfile = async () => {
  const response = await axios.get('/auth/profile', getAuthHeaders());
  return response.data;
};

export const updateProfile = async (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatar?: File; // добавим сюда
}) => {
  const formData = new FormData();

  if (data.firstName) formData.append('firstName', data.firstName);
  if (data.lastName) formData.append('lastName', data.lastName);
  if (data.email) formData.append('email', data.email);
  if (data.currentPassword) formData.append('currentPassword', data.currentPassword);
  if (data.newPassword) formData.append('newPassword', data.newPassword);
  if (data.avatar) formData.append('avatar', data.avatar); // добавим файл

  const response = await axios.put('/auth/profile', formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
  });

  return response.data;
};


export const getPlayerStats = async (userId: string) => {
  const response = await axios.get(`/player/${userId}`, getAuthHeaders());
  return response.data;
};

export const getAvatarUrl = (userId: string): string => {
  return `http://localhost:3000/api/auth/avatar/${userId}`;
};

