import { CreateSaleDetailData, Product, ProductFetch, SaleDetail, SaleDetailStatus } from "@/types";
import { MeasureUnit } from "@/generated/prisma";

export const detailPrice = (product: Product | ProductFetch, detail: CreateSaleDetailData | SaleDetail, isRetailPrice: boolean) => {
  if (detail.status === SaleDetailStatus.CANCELLED) return 0;
  return product.inputProduct
    ? product.inputProduct.measureUnit === MeasureUnit.G || product.inputProduct.measureUnit === MeasureUnit.ML
      ? isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
      : isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
    : isRetailPrice ? detail.retailPrice * detail.quantity! : detail.wholesalePrice * detail.quantity!;
}

export const detailPriceServer = (product: ProductFetch | Product, detail: SaleDetail, isRetailPrice: boolean) => {
  if (detail.status === SaleDetailStatus.CANCELLED) return 0;
  return product.inputProduct
    ? product.inputProduct.measureUnit === MeasureUnit.G || product.inputProduct.measureUnit === MeasureUnit.ML
      ? isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
      : isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
    : isRetailPrice ? detail.retailPrice * detail.quantity! : detail.wholesalePrice * detail.quantity!;
}

export const calculateDetailIva = (detail: SaleDetail ) => {
  if (detail.status === SaleDetailStatus.CANCELLED) return 0;
  if (detail.ivaPercentage > 0) {
    const price = detail.isRetailPrice ? detail.retailPrice : detail.wholesalePrice;
    if (detail.inventaryItems[0].product?.inputProduct) {
      const isBaseUnit = ['KG', 'L'].includes(detail.inventaryItems[0].product?.inputProduct.measureUnit);
      const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
      return (price * detail.measureUnitValue * unitMultiplier) * (detail.ivaPercentage / 100);
    }
    return (price * detail.quantity!) * (detail.ivaPercentage / 100);
  }
  return 0;
}