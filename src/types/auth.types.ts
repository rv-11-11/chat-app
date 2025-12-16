export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  role?: 'USER' | 'MODERATOR' | 'ADMIN';
  isSuspended?: boolean;
  suspendedUntil?: Date;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
}


