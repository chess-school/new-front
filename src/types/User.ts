import { Student } from "./Student";

export interface User {
    firebaseUID?: string;
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    registrationDate: Date;
    students?: Student[];
    trainer?: string;
    trainerEmail?: string;
}