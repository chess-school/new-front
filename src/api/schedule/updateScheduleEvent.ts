import axiosInstance from '@/api';
import { ScheduleEvent, ScheduleEventPayload } from '@/types/SheduleEvent';

export const updateScheduleEvent = async (eventId: string, payload: ScheduleEventPayload): Promise<ScheduleEvent> => {
  const response = await axiosInstance.put(`/schedule/${eventId}`, payload);
  return response.data;
};