import axios from '..';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterData) => {
  try {
    const response = await axios.post('/auth/register', data);
    return response.data;
  } catch (error) {
    console.error('Registration failed', error);
    throw error;
  }
};
