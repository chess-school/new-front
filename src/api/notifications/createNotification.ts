import axios from '..';

export const createNotification = async (data: {
  recipient: string;
  type: string;
  content: string;
}) => {
  const response = await axios.post('/notifications', data);
  return response.data;
};
