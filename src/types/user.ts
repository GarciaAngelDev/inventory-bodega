export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum UserRole {
  SUPER = 'SUPER',
  ADMIN = 'ADMIN',
  AUXILIAR = 'AUXILIAR',
  INVENTORY = 'INVENTORY',
  SELLER = 'SELLER',
  PRODUCER = 'PRODUCER',
}

export interface User {
  id?: string;
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  status?: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}