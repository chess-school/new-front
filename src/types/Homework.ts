// Домашние задания API v2: /api/v2/assignments и /api/v2/submissions

export type SubmissionStatus = 'submitted' | 'needs_revision' | 'approved';

export interface SubmissionAttachment {
  contentType: string;
  size: number;
  filename: string;
}

export interface Submission {
  _id: string;
  status: SubmissionStatus;
  contentText: string;
  attachment: SubmissionAttachment | null;
  review: { comment: string; reviewedAt: string } | null;
  submittedAt: string;
}

/** ДЗ глазами студента: задание + его сдача (если была) */
export interface MyAssignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string | null;
  lesson: { _id: string; title: string; date: string } | null;
  createdAt: string;
  submission: Submission | null;
}

/** ДЗ глазами тренера */
export interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate?: string | null;
  schedule?: string | null;
  context: { type: 'student' | 'group' | 'course'; refId: string };
}

/** Сдача в очереди проверки тренера */
export interface SubmissionForReview extends Submission {
  student: { _id: string; uuid: string; firstName: string; lastName: string; email: string };
  assignment: { _id: string; title: string; description?: string; dueDate?: string; schedule?: { _id: string; title: string; date: string } | null };
}
