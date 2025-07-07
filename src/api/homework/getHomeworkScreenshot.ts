import axiosInstance from '@/api';

export const getHomeworkScreenshot = async (homeworkId: string): Promise<Blob> => {
  const response = await axiosInstance.get(
    `/homework/${homeworkId}/screenshot`, 
    { responseType: 'blob' } 
  );
  return response.data;
};