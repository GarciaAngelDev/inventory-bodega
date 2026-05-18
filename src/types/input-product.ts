export enum MeasureUnit {
  KG = "KG",
  G = "G",
  L = "L",
  ML = "ML",
  // UND = "UND",
}

export enum InputProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface InputProduct {
  id?: string;
  name: string;
  description?: string;
  measureUnit: MeasureUnit;
  minQuantity?: number;
  maxQuantity?: number;
  status?: InputProductStatus;
}
