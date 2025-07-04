import { Student } from "./Student";

export interface User {
    id: string; 
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    registrationDate: Date; 
    
    firebaseUID?: string;
    students?: Student[];
    trainer?: string;
    trainerEmail?: string;
}