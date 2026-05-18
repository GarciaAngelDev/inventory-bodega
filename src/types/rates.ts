export enum RateType {
  OFICIAL = "OFICIAL",
  PARALELO = "PARALELO",
  CUSTOM = "CUSTOM"
}

export interface Rate {
  rateType: RateType;
  rate: number;
}