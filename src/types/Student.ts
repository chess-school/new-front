// Модуль студентов API v2 (/api/v2/students). Студент — пользователь, записанный на курс.

export type EnrollmentStatus =
  | 'pending_payment'
  | 'pending_approval'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'pending_payment', 'pending_approval', 'active', 'completed', 'cancelled', 'refunded',
];

/** Допустимые переходы статуса — те же, что проверяет бэкенд (student.service.js) */
export const STATUS_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  pending_payment: ['pending_approval', 'active', 'cancelled'],
  pending_approval: ['active', 'cancelled'],
  active: ['completed', 'cancelled', 'refunded'],
  completed: ['active', 'refunded'],
  cancelled: ['active', 'refunded'],
  refunded: [],
};

export interface Enrollment {
  _id: string;
  status: EnrollmentStatus;
  course: { _id: string; title: string | null };
  group: { _id: string; name: string | null } | null;
  coach: string;
  progress: { percentage: number };
  startDate: string | null;
  endDate: string | null;
  payment: { paid: boolean; amountPaid: number };
  createdAt: string;
}

export interface Student {
  _id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  enrollments: Enrollment[];
  lastEnrolledAt?: string;
}

export interface StudentsPage {
  data: Student[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface StudentsQuery {
  status?: EnrollmentStatus;
  courseId?: string;
  groupId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EnrollPayload {
  email?: string;
  userUuid?: string;
  courseId: string;
  groupId?: string;
  startDate?: string;
  endDate?: string;
}

export interface EnrollmentUpdate {
  status?: EnrollmentStatus;
  groupId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  progressPercentage?: number;
}

/** Ошибка API v2: { msg, code, details? } */
export interface ApiErrorBody {
  msg: string;
  code: string;
  details?: { field: string; message: string; location: string }[];
}
