export interface ScheduleEvent {
    _id: string;
    title: string;
    type: 'individual_lesson' | 'group_lesson' | 'homework' | 'opening_study' | 'tournament_participation';
    description?: string;
    link?: string;
    date: string;
    status: 'scheduled' | 'completed' | 'missed';
  }
  