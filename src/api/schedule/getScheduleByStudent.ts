import axiosInstance from '@/api';
import { ScheduleEvent } from '@/types/SheduleEvent'; 

export const getScheduleByStudent = async (studentId: string): Promise<ScheduleEvent[]> => {
  const response = await axiosInstance.get(`/schedule/student/${studentId}`);
  return response.data;
};
