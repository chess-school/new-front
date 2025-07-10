import { User } from './User'; 

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}