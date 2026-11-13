import axios, { AxiosResponse, AxiosError } from 'axios';
import { notification } from 'antd';
import i18n from '@/i18n'; 

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Не показывать общее уведомление об ошибке — страница покажет своё */
    silent?: boolean;
    /** Не редиректить на /login при 401 (начальная проверка сессии — гость это норма) */
    skipAuthRedirect?: boolean;
  }
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/v2'; 

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});

const reduceMessage = (arr: string[]) => arr?.reduce((acc, item) => (acc += item), '');
// Тело ошибки бэкенда: v2 — { msg, code, details }, старые роуты — строка, массив или { поле: [ошибки] }
type ApiErrorData = { msg?: string; message?: string; detail?: string; data?: unknown; [field: string]: unknown };

const getIssueMessage = (error: AxiosError<ApiErrorData>, description: string) => {
  notification.error({
    message: i18n.t('common.error', 'Error'),
    description,
  });
  return Promise.reject(error);
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Токен авторизации теперь в HttpOnly-cookie (withCredentials: true) — JS его не трогает.
    const language = i18n.language;
    if (language) {
      config.headers['Accept-Language'] = language;
    }
    // Активный клуб (мульти-арендность): бэк скоупит данные по X-Club-Id
    const clubId = localStorage.getItem('debiut.activeClub');
    if (clubId) {
      config.headers['X-Club-Id'] = clubId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorData>) => {

    if (error.response?.status === 401) {
      // Начальная проверка сессии (AuthContext): 401 = гость, не ошибка — не редиректим/не шумим.
      if (error.config?.skipAuthRedirect) {
        return Promise.reject(error);
      }

      notification.error({
        message: i18n.t('common.sessionExpired', 'Session expired'),
        description: error.response?.data?.msg || error.response?.data?.message || i18n.t('common.pleaseLoginAgain', 'Please log in again.'),
      });

      localStorage.removeItem('user');

      window.location.href = '/login';

      return new Promise(() => {});
    }
    
    // Запрос с { silent: true } обрабатывает ошибку сам (ожидаемый 404, понятная 409 на странице)
    if (error.config?.silent) return Promise.reject(error);

    if (error.response?.status !== 504) { 
      if (error.message === 'Network Error' || !error.response) {
        return getIssueMessage(error, i18n.t('common.networkError', 'Network error or the server is unavailable. Please try again later.'));
      }
      const data: unknown = error.response?.data;
      const message = typeof data === 'string' ? data : '';
      if (Array.isArray(data)) { return getIssueMessage(error, reduceMessage(data)); }
      if (data && typeof data === 'object') {
        const body = data as ApiErrorData;
        if (Array.isArray(body.data)) { return getIssueMessage(error, reduceMessage(body.data)); }
        if (body.detail) { return getIssueMessage(error, body.detail); }
        const fieldText = (value: unknown) => (Array.isArray(value) ? value[0] : value);
        const description = body.msg || Object.keys(body).reduce(
          (acc, key) => (acc += `${key}: ${fieldText(body[key])} `), ''
        );
        return getIssueMessage(error, description);
      }
      notification.error({
        message: i18n.t('common.error', 'Error'),
        description: message || error.message,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;