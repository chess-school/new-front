import axios from '..';

export const fetchRequests = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/trainer/requests', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

