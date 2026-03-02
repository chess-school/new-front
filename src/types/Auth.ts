export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { 
    uuid: string;
    roles: string[];
  };
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}