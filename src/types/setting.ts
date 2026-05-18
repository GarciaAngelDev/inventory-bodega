import { RateType } from "./rates";

export interface Setting {
  id?: string;
  enableRate: boolean;
  rateType: RateType;
  rateCustom: number;
  enableIva: boolean;
  iva: number;
}