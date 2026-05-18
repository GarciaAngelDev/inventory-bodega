export enum CategoryStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface Category {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  status?: CategoryStatus;
  createdAt?: Date;
  updatedAt?: Date;
}