import { MyAssignment } from '@/types/Homework';

/** Состояние ДЗ глазами ученика: к сдаче / просрочено / на проверке / на доработку / принято */
export type AssignmentState = 'todo' | 'overdue' | 'submitted' | 'needs_revision' | 'approved';

export const STATE_COLORS: Record<AssignmentState, 'default' | 'info' | 'warning' | 'error' | 'success'> = {
  todo: 'info',
  overdue: 'error',
  submitted: 'default',
  needs_revision: 'warning',
  approved: 'success',
};

// Порядок в списке: сначала то, что требует действия ученика
export const STATE_ORDER: AssignmentState[] = ['needs_revision', 'overdue', 'todo', 'submitted', 'approved'];

const DAY_MS = 24 * 60 * 60 * 1000;

export const assignmentState = (assignment: MyAssignment, now = new Date()): AssignmentState => {
  if (assignment.submission) return assignment.submission.status;
  // Срок — дата («сдать до 10 января»): просрочено только после конца этого дня, а не с полуночи
  if (assignment.dueDate && new Date(assignment.dueDate).getTime() + DAY_MS < now.getTime()) return 'overdue';
  return 'todo';
};
