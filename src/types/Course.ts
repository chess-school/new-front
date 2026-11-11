import type { CourseContent } from '@/features/Courses/types/courseBlocks';

export type CourseStatus = 'draft' | 'published' | 'archived';
export type CourseVisibility = 'draft' | 'private' | 'group' | 'public';

/** Карточка курса в списке тренера. */
export interface CourseSummary {
  _id: string;
  title: string;
  description: string;
  status: CourseStatus;
  visibility?: CourseVisibility;
  level?: string | null;
  tags?: string[];
  language?: string;
  updatedAt?: string;
}

/** Полный курс. Бэк отдаёт modules нормализованным к {version,chapters[blocks]}. */
export interface CourseDetail extends CourseSummary {
  modules: CourseContent;
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  modules?: CourseContent;
  level?: string;
  language?: string;
  visibility?: CourseVisibility;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  modules?: CourseContent;
  visibility?: CourseVisibility;
}
