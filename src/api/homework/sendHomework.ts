import axiosInstance from '@/api';

interface HomeworkPayload {
  studentId: string;
  scheduleId: string;
  homeworkText?: string;
  screenshot?: File;
}

export const sendHomework = async (payload: HomeworkPayload): Promise<void> => {
  const formData = new FormData();
  formData.append('studentId', payload.studentId);
  formData.append('scheduleId', payload.scheduleId);
  
  if (payload.homeworkText) {
    formData.append('homeworkText', payload.homeworkText);
  }
  if (payload.screenshot) {
    formData.append('screenshot', payload.screenshot);
  }

  await axiosInstance.post('/homework/send', formData);
};
