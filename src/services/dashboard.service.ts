import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { getVETDayBounds } from "@/utils/timezone";

type DateRange = {
  from: Date;
  to?: Date;
};

enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SOLD = 'SOLD'
}

const calculateDetailTotal = (detail: any) => {
  const price = detail.retailPrice > 0 ? detail.retailPrice : detail.wholesalePrice;
  const quantity = detail.measureUnitValue > 0 ? detail.measureUnitValue : detail.quantity;

  // Calcular subtotal
  let subtotal = 0;

  if (detail.measureUnitValue > 0) {
    // Lógica para unidades de medida
    const measureUnit = detail.inventaryItems?.[0]?.product?.inputProduct?.measureUnit as string;

    if (measureUnit === 'G' || measureUnit === 'ML') {
      subtotal = price * (quantity / 1000);
    } else {
      subtotal = price * quantity;
    }
  } else {
    // Lógica para cantidad normal
    subtotal = price * quantity;
  }

  // Calcular IVA si es mayor a 0
  const iva = detail.ivaPercentage > 0 ? (subtotal * detail.ivaPercentage) / 100 : 0;

  return {
    subtotal,
    iva,
    total: subtotal + iva
  };
};

// Exported function to fetch dashboard data
export async function getDashboardByDateOrDateRange(dateRange: DateRange) {
  // Configurar fechas para el rango solicitado usando zona VET
  let from: Date;
  let to: Date;

  if (dateRange.from) {
    const { start, end } = getVETDayBounds(dateRange.from);
    from = start;
    to = end;
  } else {
    const { start, end } = getVETDayBounds(new Date());
    from = start;
    to = end;
  }

  if (dateRange.to) {
    const { end } = getVETDayBounds(dateRange.to);
    to = end;
  }

  try {
    // Consulta para las ventas en el rango de fechas
    const allSales = await prisma.sale.findMany({
      where: {
        status: SaleStatus.SOLD, // Solo ventas completadas
        createdAt: {
          gte: from,
          lte: to
        }
      },
      include: {
        details: {
          where: {
            status: SaleStatus.SOLD // Solo detalles de ventas completadas
          },
          include: {
            inventaryItems: {
              include: {
                product: {
                  include: {
                    category: true,
                    inputProduct: true,
                  }
                },
              }
            }
          },
        },
      },
    });

    // Inicializar contadores
    let exemptAmount = 0;    // Monto exento (sin IVA)
    let taxableAmount = 0;   // Base imponible (BI G)
    let taxAmount = 0;       // IVA G
    let totalSurcharges = 0; // Recargos totales
    const productIds = new Set<string>(); // Para rastrear productos únicos
    const orderIds = new Set<string>();
    const soldProductsMap: Record<string, { id: string; name: string; quantity: number; total: number }> = {};
    const soldProductsMapSale: Record<string, number> = {};
    const soldProductsMapInternal: Record<string, number> = {};

    allSales.forEach(sale => {
      orderIds.add(sale.id);
      totalSurcharges += sale.discount || 0;

      if (sale.details) {
        sale.details.forEach(detail => {
          const { subtotal, iva, total } = calculateDetailTotal(detail);

          // Contar productos únicos vendidos a través de inventaryItems y agregarlos al mapa
          if (detail.inventaryItems && detail.inventaryItems.length > 0 && detail.inventaryItems[0].product) {
            const product = detail.inventaryItems[0].product;
            productIds.add(product.id);

            const productId = product.id;
            const productName = product.name;
            const qty = detail.measureUnitValue > 0 ? detail.measureUnitValue : detail.quantity;

            if (detail.inventaryType === 'INTERNAL') {
              soldProductsMapInternal[productId] = (soldProductsMapInternal[productId] || 0) + qty;
            } else {
              soldProductsMapSale[productId] = (soldProductsMapSale[productId] || 0) + qty;
            }

            if (!soldProductsMap[productId]) {
              soldProductsMap[productId] = {
                id: productId,
                name: productName,
                quantity: 0,
                total: 0
              };
            }
            soldProductsMap[productId].quantity += qty;
            soldProductsMap[productId].total += total;
          }

          if (detail.ivaPercentage > 0) {
            // Producto con IVA
            taxableAmount += subtotal;
            taxAmount += iva;
          } else {
            // Producto exento de IVA
            exemptAmount += subtotal;
          }
        });
      }
    });

    const total = exemptAmount + taxableAmount + taxAmount + totalSurcharges;

    const soldProductsList = Object.values(soldProductsMap)
      .map(p => ({
        id: p.id,
        name: p.name,
        quantity: parseFloat(p.quantity.toFixed(2)),
        total: parseFloat(p.total.toFixed(2))
      }))
      .sort((a, b) => b.total - a.total);

    const yesterdayDate = subDays(from, 1);
    const { start: yesterdayStart, end: yesterdayEnd } = getVETDayBounds(yesterdayDate);

    const yesterdaySales = await prisma.sale.findMany({
      where: {
        status: SaleStatus.SOLD,
        createdAt: {
          gte: yesterdayStart,
          lte: yesterdayEnd
        }
      },
      include: {
        details: {
          where: { status: SaleStatus.SOLD },
          include: {
            inventaryItems: {
              include: {
                product: {
                  include: {
                    inputProduct: true
                  }
                }
              }
            }
          }
        }
      }
    });

    let yesterdayTotal = 0;
    const yesterdayProductIds = new Set<string>(); // Para rastrear productos únicos de ayer
    const yesterdayOrderIds = new Set<string>();

    yesterdaySales.forEach(sale => {
      yesterdayOrderIds.add(sale.id);
      if (sale.details) {
        sale.details.forEach(detail => {
          const { total } = calculateDetailTotal(detail);
          yesterdayTotal += total;

          // Contar productos únicos vendidos ayer a través de inventaryItems
          if (detail.inventaryItems && detail.inventaryItems.length > 0 && detail.inventaryItems[0].product) {
            yesterdayProductIds.add(detail.inventaryItems[0].product.id);
          }
        });
      }
      yesterdayTotal += sale.discount || 0;
    });

    // const totalProducts = productIds.size;
    const totalProducts = allSales.reduce((acc, sale) => {
      return acc + sale.details.length;
    }, 0);

    // const yesterdayProducts = yesterdayProductIds.size;
    const yesterdayProducts = yesterdaySales.reduce((acc, sale) => {
      return acc + sale.details.length;
    }, 0);

    const yesterdayOrders = yesterdayOrderIds.size;

    // Calcular el porcentaje de cambio basado en el total
    let percentageChange = 0;
    if (yesterdayTotal > 0) {
      percentageChange = ((total - yesterdayTotal) / yesterdayTotal) * 100;
    } else if (total > 0) {
      percentageChange = 100; // Si no hay ventas ayer pero sí hoy, el cambio es del 100%
    }

    // Calcular el porcentaje de cambio en las órdenes
    let ordersPercentageChange = 0;
    if (yesterdayOrders > 0) {
      ordersPercentageChange = ((orderIds.size - yesterdayOrders) / yesterdayOrders) * 100;
    } else if (orderIds.size > 0) {
      ordersPercentageChange = 100; // Si no hay órdenes ayer pero sí hoy, el cambio es del 100%
    }

    // Calcular el porcentaje de cambio en productos
    let productsPercentageChange = 0;
    if (yesterdayProducts > 0) {
      productsPercentageChange = ((totalProducts - yesterdayProducts) / yesterdayProducts) * 100;
    } else if (totalProducts > 0) {
      productsPercentageChange = 100; // Si no había productos ayer pero sí hoy, el cambio es del 100%
    }

    // Obtener todos los inventarios en estado PREPARED (para tipo SALE e INTERNAL)
    const preparedInventories = await prisma.inventary.findMany({
      where: {
        status: 'PREPARED'
      },
      include: {
        inventaryItems: {
          where: {
            status: {
              in: ['AVAILABLE', 'RESERVED']
            }
          },
          include: {
            product: {
              include: {
                inputProduct: true
              }
            }
          }
        }
      }
    });



    const productStockSale: Record<string, {
      id: string;
      name: string;
      currentStock: number;
      initialStock: number;
      minStock: number;
      hasInputProduct: boolean;
      measureUnit?: string;
      measureUnitType?: string;
    }> = {};

    const productStockInternal: Record<string, {
      id: string;
      name: string;
      currentStock: number;
      initialStock: number;
      minStock: number;
      hasInputProduct: boolean;
      measureUnit?: string;
      measureUnitType?: string;
    }> = {};

    let reservedSaleCount = 0;
    let reservedInternalCount = 0;

    preparedInventories.forEach((inventory: any) => {
      inventory.inventaryItems.forEach((item: any) => {
        if (!item.product) return;

        if (item.status === 'RESERVED') {
          if (inventory.type === 'SALE') {
            reservedSaleCount++;
          } else {
            reservedInternalCount++;
          }
          return;
        }

        const productId = item.product.id;
        const hasInputProduct = !!item.product.inputProduct;
        const quantity = hasInputProduct ? item.measureUnitValue : item.stock;
        const initialQuantity = hasInputProduct ? item.initialMeasureUnitValue : item.initialStock;

        const targetMap = inventory.type === 'SALE' ? productStockSale : productStockInternal;

        if (!targetMap[productId]) {
          const minStock = hasInputProduct
            ? (item.product.inputProduct?.minQuantity || 0)
            : (item.product.minStock || 0);

          targetMap[productId] = {
            id: productId,
            name: item.product.name,
            currentStock: 0,
            initialStock: 0,
            minStock,
            hasInputProduct,
            measureUnit: hasInputProduct ? item.product.inputProduct?.measureUnit : 'UNIDAD',
            measureUnitType: hasInputProduct ? 'inputProduct' : 'product'
          };
        }

        targetMap[productId].currentStock += quantity || 0;
        targetMap[productId].initialStock += initialQuantity || 0;
      });
    });


    // Calcular distribución de stock para SALE
    let availableSale = 0;
    let lowStockSale = 0;
    let outOfStockSale = 0;

    Object.values(productStockSale).forEach(p => {
      if (p.currentStock <= 0) outOfStockSale++;
      else if (p.currentStock <= p.minStock) lowStockSale++;
      else availableSale++;
    });

    // Calcular distribución de stock para INTERNAL
    let availableInternal = 0;
    let lowStockInternal = 0;
    let outOfStockInternal = 0;

    Object.values(productStockInternal).forEach(p => {
      if (p.currentStock <= 0) outOfStockInternal++;
      else if (p.currentStock <= p.minStock) lowStockInternal++;
      else availableInternal++;
    });

    // Filtrar productos críticos (stock actual <= stock mínimo, basándose en tipo SALE)
    const criticalProducts = Object.values(productStockSale)
      .filter(product => {
        // Solo considerar productos con stock mayor a 0 para la comparación
        if (product.currentStock <= 0) return false;

        // Verificar si el stock actual es menor o igual al mínimo
        return product.currentStock <= product.minStock;
      })
      .map(product => ({
        id: product.id,
        name: product.name,
        currentStock: parseFloat(product.currentStock.toFixed(2)),
        minStock: product.minStock,
        hasInputProduct: product.hasInputProduct,
        measureUnit: product.measureUnit,
        measureUnitType: product.measureUnitType
      }));

    // Calcular las listas detalladas de stock por producto
    const saleProductsList = Object.values(productStockSale).map(p => {
      const difference = soldProductsMapSale[p.id] || 0;
      const current = parseFloat(p.currentStock.toFixed(2));
      const initial = parseFloat((current + difference).toFixed(2));
      return {
        id: p.id,
        name: p.name,
        initialStock: initial,
        currentStock: current,
        difference: parseFloat(difference.toFixed(2)),
        measureUnit: p.measureUnit || 'UNIDAD',
        hasInputProduct: p.hasInputProduct
      };
    }).sort((a, b) => b.difference - a.difference);

    const internalProductsList = Object.values(productStockInternal).map(p => {
      const difference = soldProductsMapInternal[p.id] || 0;
      const current = parseFloat(p.currentStock.toFixed(2));
      const initial = parseFloat((current + difference).toFixed(2));
      return {
        id: p.id,
        name: p.name,
        initialStock: initial,
        currentStock: current,
        difference: parseFloat(difference.toFixed(2)),
        measureUnit: p.measureUnit || 'UNIDAD',
        hasInputProduct: p.hasInputProduct
      };
    }).sort((a, b) => b.difference - a.difference);

    // Retornar los datos del dashboard
    return {
      sales: {
        exemptAmount: parseFloat(exemptAmount.toFixed(2)),
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        yesterdayTotal: parseFloat(yesterdayTotal.toFixed(2)),
        yesterdayOrders: yesterdayOrders,
        totalOrders: orderIds.size,
        percentageChange: parseFloat(percentageChange.toFixed(2)),
        ordersPercentageChange: parseFloat(ordersPercentageChange.toFixed(2))
      },
      products: {
        today: totalProducts,
        yesterday: yesterdayProducts,
        percentageChange: parseFloat(productsPercentageChange.toFixed(2))
      },
      criticalProducts: {
        count: criticalProducts.length,
        products: criticalProducts
      },
      soldProducts: soldProductsList,
      inventoryStatus: {
        sale: {
          available: availableSale,
          lowStock: lowStockSale,
          outOfStock: outOfStockSale,
          reserved: reservedSaleCount,
          total: availableSale + lowStockSale + outOfStockSale + reservedSaleCount,
          products: saleProductsList
        },
        internal: {
          available: availableInternal,
          lowStock: lowStockInternal,
          outOfStock: outOfStockInternal,
          reserved: reservedInternalCount,
          total: availableInternal + lowStockInternal + outOfStockInternal + reservedInternalCount,
          products: internalProductsList
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
