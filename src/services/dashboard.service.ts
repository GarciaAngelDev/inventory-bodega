import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

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

export const getDashboardByDateOrDateRange = async (dateRange: DateRange = { from: new Date(), to: undefined }) => {
  // Configurar fechas para el rango solicitado
  const from = dateRange.from ? new Date(dateRange.from) : new Date();
  from.setHours(0, 0, 0, 0);

  // Si no hay fecha de fin, usamos la misma fecha de inicio
  let to = dateRange.to ? new Date(dateRange.to) : new Date(from);
  to.setHours(23, 59, 59, 999);

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
    const productIds = new Set<string>(); // Para rastrear productos únicos
    const orderIds = new Set<string>();

    allSales.forEach(sale => {
      orderIds.add(sale.id);
      
      if (sale.details) {
        sale.details.forEach(detail => {
          const { subtotal, iva } = calculateDetailTotal(detail);
          
          // Contar productos únicos vendidos a través de inventaryItems
          if (detail.inventaryItems && detail.inventaryItems.length > 0 && detail.inventaryItems[0].product) {
            productIds.add(detail.inventaryItems[0].product.id);
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
    
    const total = exemptAmount + taxableAmount + taxAmount;

    // Calcular porcentaje de cambio respecto al día anterior
    const yesterdayStart = subDays(new Date(from), 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

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

    // Obtener inventarios con status PREPARED y tipo SALE
    const preparedInventories = await prisma.inventary.findMany({
      where: {
        status: 'PREPARED',
        type: 'SALE'
      },
      include: {
        inventaryItems: {
          where: {
            status: 'AVAILABLE'
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

    // Procesar productos para identificar los críticos
    const productStock: Record<string, {
      id: string;
      name: string;
      currentStock: number;
      minStock: number;
      hasInputProduct: boolean;
      measureUnit?: string;
      measureUnitType?: string;
    }> = {};

    // Calcular el stock actual de cada producto
    preparedInventories.forEach((inventory: any) => {
      inventory.inventaryItems.forEach((item: any) => {
        if (!item.product) return;
        
        const productId = item.product.id;
        const hasInputProduct = !!item.product.inputProduct;
        
        // Determinar la cantidad basada en si el producto usa medida o no
        const quantity = hasInputProduct ? item.measureUnitValue : item.stock;
        
        if (!productStock[productId]) {
          // Determinar el stock mínimo basado en si tiene InputProduct o no
          const minStock = hasInputProduct 
            ? (item.product.inputProduct?.minQuantity || 0)
            : (item.product.minStock || 0);
            
          productStock[productId] = {
            id: productId,
            name: item.product.name,
            currentStock: 0,
            minStock,
            hasInputProduct,
            measureUnit: hasInputProduct ? item.product.inputProduct?.measureUnit : 'UNIDAD',
            measureUnitType: hasInputProduct ? 'inputProduct' : 'product'
          };
        }
        
        // Sumar al stock actual según el tipo de producto
        productStock[productId].currentStock += quantity || 0;
      });
    });

    // Filtrar productos críticos (stock actual <= stock mínimo)
    const criticalProducts = Object.values(productStock)
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
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};
