import { SaleDetailStatus } from "@/generated/prisma";
import { AvaliableProduct, CreateSaleData, MeasureUnit, SaleFetch } from "@/types";

// Función para buscar el producto relacionado
export const findProduct = (id: string, availableProducts: AvaliableProduct[]) => {
  return availableProducts.find((product) => product.product.id === id)?.product;
}

// Función para verificar si la unidad de medida es base (KG o L)
export const isBaseUnit = (measureUnit: MeasureUnit): boolean => {
  return measureUnit === MeasureUnit.KG || measureUnit === MeasureUnit.L;
};

// Función para calcular el subtotal basado en el tipo de venta (retail o wholesale)
export const calculateCreateSaleSubtotal = (sale: CreateSaleData, availableProducts: AvaliableProduct[]) => {
  return sale.details.reduce((sum, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = findProduct(item.productId, availableProducts);
    const price = item.isRetailPrice ? item.retailPrice : item.wholesalePrice;

    // Si es un producto insumo (tiene inputProduct)
    if (product?.inputProduct) {
      // Si es KG o L, multiplicamos por el valor de la unidad
      // Si es G o ML, dividimos entre 1000 para convertirlo a la unidad base (KG o L)
      const unitMultiplier = isBaseUnit(product.inputProduct.measureUnit) ? 1 : 1 / 1000;
      return sum + (price * item.measureUnitValue! * unitMultiplier);
    }

    // Para productos normales, simplemente multiplicamos precio por cantidad
    return sum + (price * item.quantity!);
  }, 0);
};

export const calculateSubtotal = (sale: SaleFetch, availableProducts: AvaliableProduct[]) => {
  return sale.details.reduce((sum, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = findProduct(item.inventaryItems[0].productId, availableProducts);
    const price = item.isRetailPrice ? item.retailPrice : item.wholesalePrice;

    // Si es un producto insumo (tiene inputProduct)
    if (product?.inputProduct) {
      // Si es KG o L, multiplicamos por el valor de la unidad
      // Si es G o ML, dividimos entre 1000 para convertirlo a la unidad base (KG o L)
      const unitMultiplier = isBaseUnit(product.inputProduct.measureUnit) ? 1 : 1 / 1000;
      return sum + (price * item.measureUnitValue * unitMultiplier);
    }

    // Para productos normales, simplemente multiplicamos precio por cantidad
    return sum + (price * item.quantity);
  }, 0);
};

// Calculate tax-related values
export const calculateExemptCreateSaleProducts = (sale: CreateSaleData, availableProducts: AvaliableProduct[]) => {
  return (sale.details || []).reduce((sum: number, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = availableProducts.find(p => p.product.id === item.productId);
    if (!product) return sum;

    // If product has 0% IVA or no IVA, it's exempt
    if (!product.ivaPercentage || product.ivaPercentage === 0) {
      const price = item.isRetailPrice ? item.retailPrice : item.wholesalePrice;

      if (product.product.inputProduct) {
        // For input products, we need to consider the measure unit
        const isBaseUnit = ['KG', 'L'].includes(product.product.inputProduct.measureUnit);
        const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
        return sum + (price * item.measureUnitValue! * unitMultiplier);
      }

      // For regular products, just multiply price by quantity
      return sum + (price * item.quantity!);
    }
    return sum;
  }, 0);
};

// Calculate tax-related values
export const calculateExemptProducts = (sale: SaleFetch, availableProducts: AvaliableProduct[]) => {
  return (sale.details || []).reduce((sum: number, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = availableProducts.find(p => p.product.id === item.inventaryItems[0].productId);
    if (!product) return sum;

    // If product has 0% IVA or no IVA, it's exempt
    if (!product.ivaPercentage || product.ivaPercentage === 0) {
      const price = item.isRetailPrice ? item.retailPrice : item.wholesalePrice;

      if (product.product.inputProduct) {
        // For input products, we need to consider the measure unit
        const isBaseUnit = ['KG', 'L'].includes(product.product.inputProduct.measureUnit);
        const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
        return sum + (price * item.measureUnitValue * unitMultiplier);
      }

      // For regular products, just multiply price by quantity
      return sum + (price * item.quantity);
    }
    return sum;
  }, 0);
};

export const calculateTaxableCreateSaleProducts = (sale: CreateSaleData, availableProducts: AvaliableProduct[]) => {
  return (sale.details || []).reduce((sum: number, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = availableProducts.find(p => p.product.id === item.productId);
    if (!product) return sum;

    // If product has IVA > 0, it's taxable
    if (product.ivaPercentage && product.ivaPercentage > 0) {
      const price = item.isRetailPrice ? item.retailPrice : item.wholesalePrice;

      if (product.product.inputProduct) {
        // For input products, we need to consider the measure unit
        const isBaseUnit = ['KG', 'L'].includes(product.product.inputProduct.measureUnit);
        const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
        return sum + (price * item.measureUnitValue! * unitMultiplier);
      }

      // For regular products, just multiply price by quantity
      return sum + (price * item.quantity!);
    }
    return sum;
  }, 0);
};

export const calculateTaxableProducts = (sale: SaleFetch, availableProducts: AvaliableProduct[]) => {
  return (sale.details || []).reduce((sum: number, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = availableProducts.find(p => p.product.id === item.inventaryItems[0].productId);
    const isRetailPrice = item.retailPrice > 0;
    if (!product) return sum;

    // If product has IVA > 0, it's taxable
    if (product.ivaPercentage && product.ivaPercentage > 0) {
      const price = isRetailPrice ? item.retailPrice : item.wholesalePrice;

      if (product.product.inputProduct) {
        // For input products, we need to consider the measure unit
        const isBaseUnit = ['KG', 'L'].includes(product.product.inputProduct.measureUnit);
        const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
        return sum + (price * item.measureUnitValue * unitMultiplier);
      }

      // For regular products, just multiply price by quantity
      return sum + (price * item.quantity);
    }
    return sum;
  }, 0);
};

export const calculateTaxAmountCreateSale = (sale: CreateSaleData, availableProducts: AvaliableProduct[]) => {
  return (sale.details || []).reduce((sum: number, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = availableProducts.find(p => p.product.id === item.productId);
    if (!product || !product.ivaPercentage || product.ivaPercentage <= 0) return sum;

    const price = item.isRetailPrice ? item.retailPrice : item.wholesalePrice;
    let itemAmount = 0;

    if (product.product.inputProduct) {
      // For input products, calculate based on measure unit
      const isBaseUnit = ['KG', 'L'].includes(product.product.inputProduct.measureUnit);
      const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
      itemAmount = price * item.measureUnitValue! * unitMultiplier;
    } else {
      // For regular products
      itemAmount = price * item.quantity!;
    }

    // Calculate tax amount (subtotal * ivaPercentage / 100)
    const taxAmount = itemAmount * (product.ivaPercentage / 100);
    return sum + taxAmount;
  }, 0);
};

export const calculateTaxAmount = (sale: SaleFetch, availableProducts: AvaliableProduct[]) => {
  return (sale.details || []).reduce((sum: number, item) => {
    if (item.status === SaleDetailStatus.CANCELLED) return sum;
    const product = availableProducts.find(p => p.product.id === item.inventaryItems[0].productId);
    if (!product || !product.ivaPercentage || product.ivaPercentage <= 0) return sum;

    const price = item.retailPrice > 0 ? item.retailPrice : item.wholesalePrice;
    let itemAmount = 0;

    if (product.product.inputProduct) {
      // For input products, calculate based on measure unit
      const isBaseUnit = ['KG', 'L'].includes(product.product.inputProduct.measureUnit);
      const unitMultiplier = isBaseUnit ? 1 : 1 / 1000;
      itemAmount = price * item.measureUnitValue * unitMultiplier;
    } else {
      // For regular products
      itemAmount = price * item.quantity;
    }

    // Calculate tax amount (subtotal * ivaPercentage / 100)
    const taxAmount = itemAmount * (product.ivaPercentage / 100);
    return sum + taxAmount;
  }, 0);
};
