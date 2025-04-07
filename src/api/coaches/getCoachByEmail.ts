import axios from '..';

export const getCoachesByEmail = async (emails: string[]) => {
    const response = await axios.post('/auth/coaches-by-email', { emails });
    return response.data;
  };