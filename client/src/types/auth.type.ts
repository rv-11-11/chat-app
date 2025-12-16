export type RegisterType = {
  name: string;
  email: string;
  password: string;
  avatar?: string;
};

export type LoginType = {
  email: string;
  password: string;
};

export interface UserType {
  _id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  isAI?: boolean;
  isAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
