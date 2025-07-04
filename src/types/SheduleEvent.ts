export interface ScheduleEvent {
  _id: string;
  title: string;
  date: Date; 
  type: 'individual_lesson' | 'group_lesson' | 'homework' | 'opening_study' | 'tournament_participation';
  status: 'planned' | 'completed' | 'cancelled';
  
  coach?: string;
  student?: string;
  description?: string;
  link?: string;
}