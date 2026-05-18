import { prisma } from "@/lib/prisma";
import { RateType, Setting } from "@/types";

export const generateSetting = async () => {
  try {
    const setting = await prisma.setting.create({
      data: {
        enableRate: false,
        rateCustom: 0,
        rateType: RateType.OFICIAL,
        enableIva: false,
        iva: 0,
      },
    });
    return setting;
  } catch (error) {
    console.error('Error al generar la configuración:', error);
    throw error;
  }
}

export const getSetting = async () => {
  try {
    let setting = await prisma.setting.findFirst();
    if(!setting) {
      setting = await generateSetting();
    }
    return {
      ...setting,
      iva: setting?.iva ? setting?.iva : 0,
    };
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    throw error;
  }
}

export const updateSetting = async (data: Setting) => {
  try {
    const setting = await prisma.setting.update({
      where: {
        id: data.id,
      },
      data: {
        enableRate: data.enableRate,
        rateCustom: data.rateCustom,
        rateType: data.rateType,
        enableIva: data.enableIva,
        iva: data.iva,
      },
    });
    return setting;
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    throw error;
  }
}
