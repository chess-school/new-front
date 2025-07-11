import axios, { AxiosResponse, AxiosError } from 'axios';
import { notification } from 'antd';

import i18n from '@/i18n'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; 

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const reduceMessage = (arr: string[]) => arr?.reduce((acc, item) => (acc += item), '');
const getIssueMessage = (error: AxiosError<any>, description: string) => {
  notification.error({
    message: 'Ошибка', 
    description,
  });
  return Promise.reject(error);
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const language = i18n.language; 
    if (language) {
      config.headers['Accept-Language'] = language;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<any>) => {
    if (error.response?.status !== 401 && error.response?.status !== 504) {
      if (error.message === 'Network Error' || !error.response) {
        return getIssueMessage(error, 'Ошибка сети или сервер недоступен. Попробуйте позже.');
      }
      const data = error.response?.data;
      let message = typeof data === 'string' ? data : '';
      if (Array.isArray(data)) { return getIssueMessage(error, reduceMessage(data)); }
      if (Array.isArray(data?.data)) { return getIssueMessage(error, reduceMessage(data.data)); }
      if (data?.detail) { return getIssueMessage(error, data.detail); }
      if (data instanceof Object) {
        const description = data.msg || Object.keys(data).reduce(
          (acc, key) => (acc += `${key}: ${data[key]?.[0] || data[key]} `),''
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