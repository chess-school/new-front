export interface ScheduleEvent {
  _id: string;
  student: string;
  coach?: string;
  title: string;
  description?: string;
  link?: string;
  type: 'individual_lesson' | 'group_lesson' | 'homework' | 'opening_study' | 'tournament_participation';
  date: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export type ScheduleEventPayload = Omit<ScheduleEvent, '_id' | 'coach' | 'student'> & { studentId: string };
