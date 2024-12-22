import axios from 'axios';
import { notification } from 'antd';

const API_URL = 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const reduceMessage = (arr: string[]) => arr?.reduce((acc, item) => (acc += item), '');

const getIssueMessage = (error: any, description: string) => {
  notification.error({
    message: 'Ошибка',
    description,
  });
  return Promise.reject(error);
};

// Настраиваем интерсептор для обработки ошибок
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка исключений 401 и 504
    if (error?.response?.status !== 401 && error?.response?.status !== 504) {
      if (error?.message === 'Network Error') {
        return getIssueMessage(error, 'Ошибка на сервере, попробуйте позже');
      }

      const data = error?.response?.data;
      let message = typeof data === 'string' && data;

      if (Array.isArray(data)) {
        return getIssueMessage(error, reduceMessage(data));
      }

      if (Array.isArray(data?.data)) {
        return getIssueMessage(error, reduceMessage(data?.data));
      }

      if (data?.detail) {
        return getIssueMessage(error, data.detail);
      }

      if (data instanceof Object) {
        const description = Object.keys(data).reduce(
          (acc, key) => (acc += `${key}: ${data[key]?.[0] || data[key]}`),
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
