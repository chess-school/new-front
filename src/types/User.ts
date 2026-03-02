import { Student } from "./Student";

export interface User {
  uuid: string;
  _id: string; // Внутренний ID MongoDB
  firstName: string;
  lastName: string;
  email: string;
  roles: ('USER' | 'COACH' | 'ADMIN')[];
  avatarUrl?: string; // У нас теперь URL, а не Buffer
  createdAt: string;
    
    firebaseUID?: string;
    students?: Student[];
    trainer?: string;
    trainerEmail?: string;
}
