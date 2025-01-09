import axios from '..';

export const getCoaches = async () => {
  const response = await axios.get('/coaches');
  return response.data;
};