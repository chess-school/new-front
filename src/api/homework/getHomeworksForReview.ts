import axiosInstance from '@/api';

export const getHomeworksForReview = async (): Promise<any[]> => {
  const response = await axiosInstance.get('/homework/coach');
  return response.data;
};
