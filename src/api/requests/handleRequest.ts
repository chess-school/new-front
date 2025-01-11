import axios from '..';

export const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('token');
    await axios.patch(
      `/trainer/request?request_id=${requestId}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };