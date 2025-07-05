import axiosInstance from '@/api';

export const deleteScheduleEvent = async (eventId: string): Promise<void> => {
  await axiosInstance.delete(`/schedule/${eventId}`);
};