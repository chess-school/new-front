import axios, { AxiosResponse, AxiosError } from 'axios';
import { notification } from 'antd';

const API_URL = 
process.env.REACT_APP_API_URL 
// 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const reduceMessage = (arr: string[]) => arr?.reduce((acc, item) => (acc += item), '');
const getIssueMessage = (error: AxiosError<any>, description: string) => {
  notification.error({
    message: 'Ошибка',
    description,
  });
  return Promise.reject(error);
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status !== 401 && error.response?.status !== 504) {
      if (error.message === 'Network Error' || !error.response) {
        return getIssueMessage(error, 'Ошибка сети или сервер недоступен. Попробуйте позже.');
      }

      const data = error.response?.data;
      let message = typeof data === 'string' ? data : '';

      if (Array.isArray(data)) {
        return getIssueMessage(error, reduceMessage(data));
      }

      if (Array.isArray(data?.data)) {
        return getIssueMessage(error, reduceMessage(data.data));
      }

      if (data?.detail) {
        return getIssueMessage(error, data.detail);
      }

      if (data instanceof Object) {
        const description = Object.keys(data).reduce(
          (acc, key) => (acc += `${key}: ${data[key]?.[0] || data[key]} `), // добавил пробел для читаемости
          ''
        );
        return getIssueMessage(error, description);
      }

      notification.error({
        message: 'Ошибка',
        description: message || error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;