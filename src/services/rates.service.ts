import { Rate, RateType } from "@/types";
import axios, { AxiosError } from "axios";
import { getSetting, updateSetting } from "./setting.service";

const closeRatesSettings = async () => {
  try {
    const settings = await getSetting();
    if(settings) {
      await updateSetting({
        id: settings.id,
        enableRate: false,
        rateCustom: settings.rateCustom!,
        rateType: settings.rateType as RateType,
        enableIva: settings.enableIva!,
        iva: settings.iva!,
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getRates = async (rateType: RateType): Promise<Rate> => {

  let rate: number = 0;

  if(rateType === RateType.OFICIAL) {
    try {
      const { data } = await axios.get('https://ve.dolarapi.com/v1/dolares/oficial');
      rate = data.promedio || 0;
    } catch (error) {
      await closeRatesSettings();
      if(error instanceof AxiosError) {
        throw error;
      }
      throw error;
    }
  }

  if(rateType === RateType.PARALELO) {
    try {
      const { data } = await axios.get('https://ve.dolarapi.com/v1/dolares/paralelo');
      rate = data.promedio || 0;
    } catch (error) {
      await closeRatesSettings();
      if(error instanceof AxiosError) {
        throw error;
      }
      throw error;
    }
  }

  if(rateType === RateType.CUSTOM) {
    try {
      const settings = await getSetting();
      rate = settings?.rateCustom || 0;
    } catch (error) {
      throw error;
    }
  }

  return {
    rateType,
    rate
  };

}