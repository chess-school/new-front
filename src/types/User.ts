import { Student } from "./Student";

/** Рейтинг в одной категории контроля времени (Glicko-2) */
export interface PerfRating {
  rating: number;
  /** Отклонение рейтинга (надёжность): чем меньше, тем точнее */
  rd: number;
  /** Волатильность */
  vol: number;
  /** Число рейтинговых партий */
  games: number;
}

export type RatingCategory = 'bullet' | 'blitz' | 'rapid' | 'classical';

export type UserRatings = Record<RatingCategory, PerfRating>;

export interface User {
  uuid: string;
  _id: string; // Внутренний ID MongoDB
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles: ('USER' | 'COACH' | 'ADMIN')[];
  avatarUrl?: string; // У нас теперь URL, а не Buffer
  createdAt: string;
  /** Рейтинги онлайн-партий по категориям контроля времени (Glicko-2) */
  ratings?: UserRatings;

    firebaseUID?: string;
    students?: Student[];
    trainer?: string;
    trainerEmail?: string;
}
