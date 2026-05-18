import { InventoryItem } from "./inventary";
import { User } from "./user";

export enum ProducerStatus {
  IN_PRODUCTION = "IN_PRODUCTION",
  PAUSED = "PAUSED",
  CANCELLED = "CANCELLED",
  FINISHED = "FINISHED",
  PRODUCED = "PRODUCED",
}

export enum ProducerDetailStatus {
  IN_PRODUCTION = "IN_PRODUCTION",
  PAUSED = "PAUSED",
  CANCELLED = "CANCELLED",
  FINISHED = "FINISHED",
  PRODUCED = "PRODUCED",
}

export interface Producer {
  id: string;
  status: ProducerStatus;
  userId: string;
  user: User;
  details: ProducerDetail[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProducerDetail {
  id: string;
  quantity: number;
  measureUnitValue: number;
  inventaryItems: InventoryItem[];
  producerId: string;
  producer: Producer;
  status: ProducerDetailStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProducerData {
  status: ProducerStatus;
  details: CreateProducerDetailData[];
}

export interface CreateProducerDetailData {
  productId: string;
  quantity: number;
  measureUnitValue: number;
  inventaryItems: CreateInventoryItemData[];
  status: ProducerDetailStatus;
}

export interface CreateInventoryItemData {
  inventoryId: string;
  inventoryItemId: string;
}

export interface ProducerHistory {
  id: string;
  date: Date;
  status: ProducerStatus;
  details: number;
}

export interface UserProducer {
  id: string;
  name: string;
  totalProducersToday: number;
  producers: ProducerHistory[];
}

export interface ProducersDaily {
  totalProducersAmountToday: number;
  users: UserProducer[];
}
