import axiosInstance from '@/api';

interface ReviewPayload {
  status: 'approved' | 'rejected';
  comment: string;
}

export const reviewHomework = async (homeworkId: string, payload: ReviewPayload): Promise<any> => {
  const response = await axiosInstance.put(`/homework/${homeworkId}/review`, payload);
  return response.data;
};