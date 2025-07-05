import axiosInstance from '@/api';
import { ScheduleEvent, ScheduleEventPayload } from '@/types/SheduleEvent'; 

export const createScheduleEvent = async (payload: ScheduleEventPayload): Promise<ScheduleEvent> => {
  const response = await axiosInstance.post('/schedule/create', payload);
  return response.data;
};
