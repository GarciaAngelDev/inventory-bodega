import { InventaryItemStatus, InventaryStatus, InventaryType, Prisma, SaleDetailStatus, SaleStatus } from "@/generated/prisma";
import { calculateDetailIva, detailPrice, detailPriceServer } from "@/lib/price";
import { prisma } from "@/lib/prisma";
import { CreateSaleData, CreateSaleDetailData, MeasureUnit, SaleDetail, UserRole } from "@/types";
import { getVETDayBounds } from "@/utils/timezone";

export const createSale = async (userId: string, data: CreateSaleData) => {
  console.log(data.deliveryDate)
  try {
    return await prisma.$transaction(async (tx) => {

      // TODO: validar si existe inventario

      // 1. Crear la venta
      const newSale = await tx.sale.create({
        data: {
          userId,
          enableIva: data.enableIva,
          ivaPercentage: data.ivaPercentage,
          discount: data.discount,
          status: data.status,
          clientId: data.clientId || null,
          deliveryDate: data.deliveryDate || null,
        },
        include: {
          user: true,
          client: true,
        }
      });

      // 2. Procesar los detalles de la venta
      if (data.details && data.details.length > 0) {
        for (const detail of data.details) {
          // Crear el detalle de la venta con la conexión a los ítems de inventario

          // Get the product to check if it's an input product
          const product = await tx.product.findUnique({
            where: { id: detail.productId },
            include: { inputProduct: true }
          });

          const newDetail = await tx.saleDetail.create({
            data: {
              retailPrice: detail.retailPrice,
              wholesalePrice: detail.wholesalePrice,
              quantity: detail.quantity,
              status: data.status,
              saleId: newSale.id,
              isRetailPrice: detail.isRetailPrice,
              measureUnitValue: detail.measureUnitValue,
              iva: 0,
              ivaPercentage: detail.ivaPercentage,
              inventaryType: detail.inventaryType,
            }
          });

          if (!product) continue;

          const isInputProduct = !!product.inputProduct;
          const totalNeeded = isInputProduct ? detail.measureUnitValue! : detail.quantity!;

          if (totalNeeded <= 0) continue;

          // Find all inventory items for this product with the correct type, ordered by oldest first (FIFO)
          const allInventoryItems = await tx.inventaryItem.findMany({
            where: {
              productId: product.id,
              status: InventaryItemStatus.AVAILABLE,
              type: detail.inventaryType, // Filtrar por el tipo de inventario del detalle
              OR: [
                isInputProduct
                  ? { measureUnitValue: { gt: 0 } }
                  : { stock: { gt: 0 } }
              ]
            },
            orderBy: { createdAt: 'asc' }, // Sort by creation date to get oldest items first
            include: {
              inventary: true
            }
          });

          // Verificar si hay suficiente inventario disponible del tipo solicitado
          const totalAvailable = allInventoryItems.reduce((sum, item) => {
            return sum + (isInputProduct ? item.measureUnitValue : item.stock);
          }, 0);

          if (totalAvailable < totalNeeded) {
            const fieldName = isInputProduct ? 'medida' : 'unidades';
            throw new Error(`Insuficiente ${fieldName} para el producto ${product.name} en inventario tipo ${detail.inventaryType}. Necesitas ${totalNeeded} pero solo hay ${totalAvailable} disponible.`);
          }

          let remainingQty = totalNeeded;

          for (const item of allInventoryItems) {
            if (remainingQty <= 0) break;

            // Calculate how much we can take from this item
            const currentValue = isInputProduct ? item.measureUnitValue : item.stock;
            const deductQty = Math.min(remainingQty, currentValue);
            const newValue = currentValue - deductQty;

            // Update the inventory item
            const updateData: any = {
              status: newValue <= 0 ? InventaryItemStatus.OUT_OF_STOCK : undefined
            };

            if (isInputProduct) {
              updateData.measureUnitValue = newValue;
            } else {
              updateData.stock = newValue;
            }

            const inventaryItem = await tx.inventaryItem.update({
              where: { id: item.id },
              data: updateData,
            });

            // Check if we should close the inventory
            if (newValue <= 0) {
              // Check if all items in the inventory have their respective values at 0
              const allItems = await tx.inventaryItem.findMany({
                where: {
                  inventaryId: inventaryItem.inventaryId,
                  status: InventaryItemStatus.AVAILABLE,
                  OR: [
                    { stock: { gt: 0 } },
                    { measureUnitValue: { gt: 0 } }
                  ]
                }
              });

              // If no items with stock or measureUnitValue > 0, close the inventory
              if (allItems.length === 0) {
                await tx.inventary.update({
                  where: { id: inventaryItem.inventaryId },
                  data: {
                    status: InventaryStatus.SOLD
                  }
                });
              }
            }

            // Connect this inventory item to the sale detail
            await tx.saleDetail.update({
              where: { id: newDetail.id },
              data: {
                inventaryType: detail.inventaryType,
                inventaryItems: {
                  connect: { id: item.id }
                }
              }
            });

            remainingQty -= deductQty;

            // Log the update for tracking in spanish
            const fieldName = isInputProduct ? 'medida' : 'unidades';
            const currentStockValue = isInputProduct ? newValue : newValue;
            console.log(`Actualizado item de inventario ${item.id}: -${deductQty} ${fieldName}, nuevo valor: ${currentStockValue}`);
          }

          if (remainingQty > 0) {
            const fieldName = isInputProduct ? 'medida' : 'unidades';
            const available = totalNeeded - remainingQty;
            throw new Error(`Insuficiente ${fieldName} para el producto ${product.name}. Necesitas ${totalNeeded} pero solo hay ${available} disponible.`);
          }

          // Fetch the populated detail to calculate IVA and update allocations
          const populatedDetail = await tx.saleDetail.findUnique({
            where: { id: newDetail.id },
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
          });

          if (populatedDetail) {
            const calculatedIva = calculateDetailIva(populatedDetail as any);
            await tx.saleDetail.update({
              where: { id: newDetail.id },
              data: {
                iva: calculatedIva
              }
            });
          }
        }
      }

      // Return the created sale with all its relations
      return tx.sale.findUnique({
        where: { id: newSale.id },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: {
                    include: {
                      inputProduct: true,
                    }
                  },
                },
              },
              sale: true,
            },
          },
          user: true,
          client: true,
        },
      });
    });
  } catch (error: any) {
    console.error('Error al crear la venta:', error);
    throw new Error((error as Error).message);
  }
};

export const getAllSales = async ({ user, limit = 10, offset = 0, query = '' }: { user: { id: string; role: UserRole }; limit?: number; offset?: number, query?: string }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }
    : {};

  try {
    const [sales, total, amount] = await prisma.$transaction([
      prisma.sale.findMany({
        where: {
          userId: user.role === UserRole.SELLER ? user.id : {},
          ...searchCondition
        },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: {
                    include: {
                      inputProduct: true,
                    },
                  },
                },
              },
              sale: true,
            },
          },
          user: true,
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.sale.count({
        where: {
          userId: user.role === UserRole.SELLER ? user.id : {},
          ...searchCondition
        },
      }),
      prisma.sale.findMany({
        where: {
          userId: user.role === UserRole.SELLER ? user.id : {},
          ...searchCondition
        },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: {
                    include: {
                      inputProduct: true,
                    },
                  },
                },
              },
            }
          },
          user: true
        }
      })
    ]);

    // Calcular total de ventas de hoy usando la zona VET
    const todayBounds = getVETDayBounds(new Date());
    const totalSalesAmountToday = amount.reduce((sum, sale) => {
      if (sale.status !== SaleStatus.SOLD) {
        return sum;
      }
      const saleDate = new Date(sale.createdAt);
      if (saleDate < todayBounds.start || saleDate > todayBounds.end) {
        return sum;
      }
      const saleTotal = sale.details.reduce((detailSum, detail) => {
        if (detail.status !== SaleDetailStatus.SOLD) {
          return detailSum;
        }
        const subtotal = detail.inventaryItems[0].product?.inputProduct
          ? detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.G || detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.ML
            ? detail.isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
            : detail.isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
          : detail.isRetailPrice ? detail.retailPrice * detail.quantity : detail.wholesalePrice * detail.quantity;
        return detailSum + subtotal + detail.iva;
      }, 0);
      return sum + saleTotal + (sale.discount || 0);
    }, 0);

    // Calcular total de ventas
    const totalSalesAmount = amount.reduce((sum, sale) => {
      if (sale.status !== SaleStatus.SOLD) {
        return sum;
      }
      const saleTotal = sale.details.reduce((detailSum, detail) => {
        if (detail.status !== SaleDetailStatus.SOLD) {
          return detailSum;
        }
        const subtotal = detail.inventaryItems[0].product?.inputProduct
          ? detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.G || detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.ML
            ? detail.isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
            : detail.isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
          : detail.isRetailPrice ? detail.retailPrice * detail.quantity : detail.wholesalePrice * detail.quantity;
        return detailSum + subtotal + detail.iva;
      }, 0);
      return sum + saleTotal + (sale.discount || 0);
    }, 0);

    return {
      data: sales,
      totalSalesAmountToday,
      totalSalesAmount,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  } catch (error: any) {
    console.error('Error obteniendo ventas:', error);
    throw new Error('Error al obtener las ventas: ' + (error as Error).message);
  }
};

export const getSaleById = async (id: string) => {
  try {

    const existSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            inventaryItems: {
              include: {
                product: {
                  include: {
                    inputProduct: true,
                  },
                },
              },
            },
          },
        },
        user: true,
        client: true
      },
    });

    if (!existSale) {
      throw new Error('Venta no encontrada');
    }

    return existSale;
  } catch (error: any) {
    console.error('Error obteniendo venta:', error);
    throw new Error((error as Error).message);
  }
};

export const cancelDetailSale = async (id: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener el detalle de la venta con los items de inventario
      const detail = await tx.saleDetail.findUnique({
        where: { id },
        include: {
          inventaryItems: {
            include: {
              product: true,
              inventary: true
            }
          }
        }
      });

      if (!detail) {
        throw new Error('El detalle de la venta no existe');
      }

      // 2. Si ya está cancelado, no hacer nada
      if (detail.status === SaleDetailStatus.CANCELLED) {
        return detail;
      }

      // 3. Actualizar el estado del detalle a CANCELADO
      await tx.saleDetail.update({
        where: { id },
        data: { status: SaleDetailStatus.CANCELLED }
      });

      // 4. Por cada ítem de inventario en el detalle, devolver stock de manera inteligente
      if (detail.inventaryItems.length === 1) {
        const item = detail.inventaryItems[0];
        const isInputProduct = !!item.product.inputProductId;
        const returnQty = isInputProduct ? detail.measureUnitValue : detail.quantity;

        // Actualizar el ítem de inventario
        const updateData: any = {
          status: InventaryItemStatus.AVAILABLE
        };

        if (isInputProduct) {
          updateData.measureUnitValue = { increment: returnQty };
        } else {
          updateData.stock = { increment: returnQty };
        }

        await tx.inventaryItem.update({
          where: { id: item.id },
          data: updateData
        });

        // Verificar si el inventario necesita ser reactivado
        const inventory = await tx.inventary.findUnique({
          where: { id: item.inventaryId },
          include: {
            _count: {
              select: {
                inventaryItems: {
                  where: {
                    OR: [
                      { stock: { gt: 0 } },
                      { measureUnitValue: { gt: 0 } }
                    ]
                  }
                }
              }
            }
          }
        });

        if (inventory?.status === InventaryStatus.SOLD && inventory._count.inventaryItems > 0) {
          await tx.inventary.update({
            where: { id: item.inventaryId },
            data: { status: InventaryStatus.PREPARED }
          });
        }
      } else if (detail.inventaryItems.length > 1) {
        // Distribuir el stock a devolver entre los múltiples lotes de forma inteligente
        const isInputProduct = !!detail.inventaryItems[0].product.inputProductId;
        let remainingToReturn = isInputProduct ? detail.measureUnitValue : detail.quantity;

        for (const item of detail.inventaryItems) {
          if (remainingToReturn <= 0) break;

          // Calcular cuánto podemos devolver a este lote (máximo hasta su stock inicial)
          const maxCanReturn = isInputProduct
            ? (item.initialMeasureUnitValue - item.measureUnitValue)
            : (item.initialStock - item.stock);

          const toReturn = Math.min(remainingToReturn, maxCanReturn);
          if (toReturn <= 0) continue;

          // Actualizar el ítem de inventario
          const updateData: any = {
            status: InventaryItemStatus.AVAILABLE
          };

          if (isInputProduct) {
            updateData.measureUnitValue = { increment: toReturn };
          } else {
            updateData.stock = { increment: toReturn };
          }

          await tx.inventaryItem.update({
            where: { id: item.id },
            data: updateData
          });

          // Verificar si el inventario necesita ser reactivado
          const inventory = await tx.inventary.findUnique({
            where: { id: item.inventaryId },
            include: {
              _count: {
                select: {
                  inventaryItems: {
                    where: {
                      OR: [
                        { stock: { gt: 0 } },
                        { measureUnitValue: { gt: 0 } }
                      ]
                    }
                  }
                }
              }
            }
          });

          if (inventory?.status === InventaryStatus.SOLD && inventory._count.inventaryItems > 0) {
            await tx.inventary.update({
              where: { id: item.inventaryId },
              data: { status: InventaryStatus.PREPARED }
            });
          }

          remainingToReturn -= toReturn;
        }

        // Si después de la distribución aún queda algo por devolver (ej. si los lotes cambiaron o hay inconsistencias),
        // lo devolvemos al primer lote para no perder mercancía en el sistema.
        if (remainingToReturn > 0) {
          const firstItem = detail.inventaryItems[0];
          const updateData: any = {};
          if (isInputProduct) {
            updateData.measureUnitValue = { increment: remainingToReturn };
          } else {
            updateData.stock = { increment: remainingToReturn };
          }
          await tx.inventaryItem.update({
            where: { id: firstItem.id },
            data: updateData
          });
        }
      }

      // 8. Validar si ya estan todos los detalles cancelados
      const sale = await tx.sale.findUnique({ where: { id: detail.saleId }, include: { details: true } });
      if (sale && sale.details.length > 0) {
        const allCancelled = sale.details.every(d => d.status === SaleDetailStatus.CANCELLED);
        if (allCancelled) {
          await tx.sale.update({ where: { id: sale.id }, data: { status: SaleStatus.CANCELLED } });
        }
      }

      // 9. Devolver el detalle actualizado
      return tx.saleDetail.findUnique({
        where: { id },
        include: { inventaryItems: true, sale: true }
      });
    });
  } catch (error) {
    console.error('Error cancelando detalle de venta:', error);
    throw new Error((error as Error).message);
  }
}

export const cancelSale = async (saleId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener la venta con sus detalles
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: true,
                  inventary: true
                }
              }
            }
          }
        }
      });

      if (!sale) {
        throw new Error('La venta no existe');
      }

      // 2. Si ya está cancelada, no hacer nada
      if (sale.status === SaleStatus.CANCELLED) {
        return sale;
      }

      // 3. Actualizar el estado de la venta a CANCELADA
      await tx.sale.update({
        where: { id: saleId },
        data: { status: SaleStatus.CANCELLED }
      });

      // 4. Cancelar cada detalle de la venta en paralelo (los que no estén ya cancelados)
      await Promise.all(
        sale.details
          .filter(detail => detail.status !== SaleDetailStatus.CANCELLED)
          .map(detail =>
            tx.saleDetail.update({
              where: { id: detail.id },
              data: { status: SaleDetailStatus.CANCELLED },
              include: { inventaryItems: true }
            })
          )
      );

      // 5. Actualizar el inventario para cada detalle (solo los que no estaban cancelados previamente)
      for (const detail of sale.details) {
        if (detail.status === SaleDetailStatus.CANCELLED) {
          continue; // Evitar devolución doble si ya fue cancelado individualmente
        }

        if (detail.inventaryItems.length === 1) {
          const item = detail.inventaryItems[0];
          const isInputProduct = !!item.product.inputProductId;
          const returnQty = isInputProduct ? detail.measureUnitValue : detail.quantity;

          const updateData: any = {
            status: InventaryItemStatus.AVAILABLE
          };

          if (isInputProduct) {
            updateData.measureUnitValue = { increment: returnQty };
          } else {
            updateData.stock = { increment: returnQty };
          }

          await tx.inventaryItem.update({
            where: { id: item.id },
            data: updateData
          });

          // Verificar si el inventario necesita ser reactivado
          const inventory = await tx.inventary.findUnique({
            where: { id: item.inventaryId },
            include: {
              _count: {
                select: {
                  inventaryItems: {
                    where: {
                      OR: [
                        { stock: { gt: 0 } },
                        { measureUnitValue: { gt: 0 } }
                      ]
                    }
                  }
                }
              }
            }
          });

          if (inventory?.status === InventaryStatus.SOLD && inventory._count.inventaryItems > 0) {
            await tx.inventary.update({
              where: { id: item.inventaryId },
              data: { status: InventaryStatus.PREPARED }
            });
          }
        } else if (detail.inventaryItems.length > 1) {
          // Distribuir el stock a devolver entre los múltiples lotes de forma inteligente
          const isInputProduct = !!detail.inventaryItems[0].product.inputProductId;
          let remainingToReturn = isInputProduct ? detail.measureUnitValue : detail.quantity;

          for (const item of detail.inventaryItems) {
            if (remainingToReturn <= 0) break;

            const maxCanReturn = isInputProduct
              ? (item.initialMeasureUnitValue - item.measureUnitValue)
              : (item.initialStock - item.stock);

            const toReturn = Math.min(remainingToReturn, maxCanReturn);
            if (toReturn <= 0) continue;

            const updateData: any = {
              status: InventaryItemStatus.AVAILABLE
            };

            if (isInputProduct) {
              updateData.measureUnitValue = { increment: toReturn };
            } else {
              updateData.stock = { increment: toReturn };
            }

            await tx.inventaryItem.update({
              where: { id: item.id },
              data: updateData
            });

            // Verificar si el inventario necesita ser reactivado
            const inventory = await tx.inventary.findUnique({
              where: { id: item.inventaryId },
              include: {
                _count: {
                  select: {
                    inventaryItems: {
                      where: {
                        OR: [
                          { stock: { gt: 0 } },
                          { measureUnitValue: { gt: 0 } }
                        ]
                      }
                    }
                  }
                }
              }
            });

            if (inventory?.status === InventaryStatus.SOLD && inventory._count.inventaryItems > 0) {
              await tx.inventary.update({
                where: { id: item.inventaryId },
                data: { status: InventaryStatus.PREPARED }
              });
            }

            remainingToReturn -= toReturn;
          }

          // Fallback al primer lote en caso de inconsistencia matemática residual
          if (remainingToReturn > 0) {
            const firstItem = detail.inventaryItems[0];
            const updateData: any = {};
            if (isInputProduct) {
              updateData.measureUnitValue = { increment: remainingToReturn };
            } else {
              updateData.stock = { increment: remainingToReturn };
            }
            await tx.inventaryItem.update({
              where: { id: firstItem.id },
              data: updateData
            });
          }
        }
      }

      // Devolver la venta actualizada
      return tx.sale.findUnique({
        where: { id: saleId },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: true
                }
              }
            }
          },
          user: true
        }
      });
    });
  } catch (error) {
    console.error('Error cancelando venta:', error);
    throw new Error((error as Error).message);
  }
}

export const concludeSale = async (saleId: string) => {
  try {

    const saleExists = await getSaleById(saleId);
    if (!saleExists) {
      throw new Error('La venta no existe');
    }

    const updatedSale = await prisma.sale.update(
      {
        where: { id: saleId },
        data: { status: SaleStatus.SOLD }
      }
    );

    const updatedDetails = await prisma.saleDetail.updateMany(
      {
        where: { saleId },
        data: { status: SaleDetailStatus.SOLD }
      }
    );

    return {
      sale: updatedSale,
      details: updatedDetails
    };

  } catch (error) {
    console.error('Error concluyendo venta:', error);
    throw new Error((error as Error).message);
  }
}

export const getSalesByAdmin = async () => {
  try {
    return await prisma.$transaction(async (tx) => {
      const sales = await tx.sale.findMany({
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: true,
          client: true
        }
      });

      return {
        sales
      }

    });

  } catch (error) {
    console.error('Error obteniendo ventas por administrador:', error);
    throw new Error((error as Error).message);
  }
}

export const getSellersDailySales = async (limit = 10, offset = 0) => {
  try {
    // Obtener la fecha de inicio y fin del día actual usando zona VET
    const todayBounds = getVETDayBounds(new Date());
    const startOfDay = todayBounds.start;
    const endOfDay = todayBounds.end;

    const result = await prisma.$transaction(async (tx) => {
      // Obtener todos los usuarios que son vendedores y tienen ventas
      const sellers = await tx.user.findMany({
        where: {
          // role: UserRole.SELLER,
          sales: {
            some: {}
          }
        },
        include: {
          sales: {
            orderBy: {
              createdAt: "desc"
            },
            where: {
              createdAt: {
                gte: startOfDay,
                lte: endOfDay
              },
              // status: SaleStatus.SOLD // Solo ventas completadas
            },
            include: {
              details: {
                include: {
                  inventaryItems: {
                    include: {
                      product: {
                        include: {
                          inputProduct: true,
                        },
                      },
                    },
                  },
                },
              },
              client: true
            },
          }
        }
      });

      // Calcular total de ventas de todos los vendedores
      let totalSalesAllUsersAmountToday = 0;

      // Mapear los vendedores al formato requerido
      const users = sellers.map(seller => {
        // Calcular total de ventas y monto total para el vendedor
        const totalSalesToday = seller.sales.length;
        const totalSalesAmountToday = seller.sales.reduce((sum, sale) => {
          if (sale.status !== SaleStatus.SOLD) return sum;
          const saleTotal = sale.details.reduce((detailSum, detail) => {
            if (detail.status !== SaleDetailStatus.SOLD) return detailSum;
            const subtotal = detail.inventaryItems[0].product?.inputProduct
              ? detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.G || detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.ML
                ? detail.isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
                : detail.isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
              : detail.isRetailPrice ? detail.retailPrice * detail.quantity : detail.wholesalePrice * detail.quantity;
            return detailSum + subtotal + detail.iva;
          }, 0);
          return sum + saleTotal + (sale.discount || 0);
        }, 0);

        // Sumar al total general
        totalSalesAllUsersAmountToday += totalSalesAmountToday;

        // Mapear las ventas del vendedor
        const sales = seller.sales.map(sale => {
          // if (sale.status !== SaleStatus.SOLD && sale.status !== SaleStatus.RESERVED) return null;
          return {
            id: sale.id,
            date: sale.createdAt,
            totalAmount: sale.details.reduce((sum, detail) => {
              if (detail.status !== SaleDetailStatus.SOLD) return sum;
              const subtotal = detail.inventaryItems[0].product?.inputProduct
                ? detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.G || detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.ML
                  ? detail.isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
                  : detail.isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
                : detail.isRetailPrice ? detail.retailPrice * detail.quantity : detail.wholesalePrice * detail.quantity;
              return sum + subtotal + detail.iva;
            }, 0) + (sale.discount || 0),
            status: sale.status as any,
            details: sale.details.length,
          }
        });

        return {
          id: seller.id,
          name: seller.name || 'Sin nombre',
          totalSalesToday,
          totalSalesAmountToday,
          sales: sales.slice(offset, offset + limit),
          pagination: {
            limit,
            offset,
            total: sales.length,
            hasMore: offset + limit < sales.length,
          }
        };
      });

      return {
        totalSalesAllUsersAmountToday,
        users,
        /* pagination: {
          limit,
          offset,
          total: users.length,
          hasMore: offset + limit < users.length,
        } */
      };
    });

    return result;
  } catch (error) {
    console.error('Error obteniendo ventas diarias por vendedor:', error);
    throw new Error('Error al obtener las ventas diarias por vendedor');
  }
}

export const getSalesByUser = async ({ userId, limit = 10, offset = 0, query = '' }: { userId: string; limit?: number; offset?: number, query?: string }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }
    : {};

  try {
    const [sales, total, amount] = await prisma.$transaction([
      prisma.sale.findMany({
        where: {
          userId,
          ...searchCondition
        },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: {
                    include: {
                      inputProduct: true,
                    },
                  },
                },
              },
            }
          },
          user: true,
          client: true
        },
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.sale.count({
        where: {
          userId,
          ...searchCondition
        },
      }),
      prisma.sale.findMany({
        where: {
          userId,
          ...searchCondition
        },
        include: {
          details: {
            include: {
              inventaryItems: {
                include: {
                  product: {
                    include: {
                      inputProduct: true,
                    },
                  },
                },
              },
            }
          },
          user: true
        }
      })
    ]);

    // Calcular total de ventas de hoy usando la zona VET
    const todayBounds = getVETDayBounds(new Date());
    const totalSalesAmountToday = amount.reduce((sum, sale) => {
      if (sale.status !== SaleStatus.SOLD) return sum;
      const saleDate = new Date(sale.createdAt);
      if (saleDate < todayBounds.start || saleDate > todayBounds.end) {
        return sum;
      }
      const saleTotal = sale.details.reduce((detailSum, detail) => {
        if (detail.status !== SaleDetailStatus.SOLD) return detailSum;
        const subtotal = detail.inventaryItems[0].product?.inputProduct
          ? detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.G || detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.ML
            ? detail.isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
            : detail.isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
          : detail.isRetailPrice ? detail.retailPrice * detail.quantity : detail.wholesalePrice * detail.quantity;
        return detailSum + subtotal + detail.iva;
      }, 0);
      return sum + saleTotal;
    }, 0);

    // Calcular total de ventas
    const totalSalesAmount = amount.reduce((sum, sale) => {
      if (sale.status !== SaleStatus.SOLD) return sum;
      const saleTotal = sale.details.reduce((detailSum, detail) => {
        if (detail.status !== SaleDetailStatus.SOLD) return detailSum;
        const subtotal = detail.inventaryItems[0].product?.inputProduct
          ? detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.G || detail.inventaryItems[0].product?.inputProduct.measureUnit === MeasureUnit.ML
            ? detail.isRetailPrice ? detail.retailPrice * (detail.measureUnitValue! / 1000) : detail.wholesalePrice * (detail.measureUnitValue! / 1000)
            : detail.isRetailPrice ? detail.retailPrice * detail.measureUnitValue! : detail.wholesalePrice * detail.measureUnitValue!
          : detail.isRetailPrice ? detail.retailPrice * detail.quantity : detail.wholesalePrice * detail.quantity;
        return detailSum + subtotal + detail.iva;
      }, 0);
      return sum + saleTotal;
    }, 0);

    return {
      data: sales,
      totalSalesAmountToday,
      totalSalesAmount,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error('Error obteniendo ventas por usuario:', error);
    throw new Error('Error al obtener las ventas por usuario');
  }
}