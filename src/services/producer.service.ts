import { InventaryItemStatus, InventaryStatus, InventaryType } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";
import { CreateProducerData, ProducerDetailStatus, ProducerStatus } from "@/types/producer";

export const createProducer = async (userId: string, data: CreateProducerData) => {
  try {
    return await prisma.$transaction(async (tx) => {

      // TODO: validar si existe inventario

      // 1. Crear la produccion
      const newProducer = await tx.producer.create({
        data: {
          userId,
          status: data.status
        },
      });

      // 2. Procesar los detalles de la produccion
      if (data.details && data.details.length > 0) {
        for (const detail of data.details) {
          // Crear el detalle de la produccion con la conexión a los ítems de inventario

          // Get the product to check if it's an input product
          const product = await tx.product.findUnique({
            where: { id: detail.productId },
            include: { inputProduct: true }
          });

          const newDetail = await tx.producerDetail.create({
            data: {
              quantity: detail.quantity,
              producerId: newProducer.id,
              measureUnitValue: detail.measureUnitValue,
              status: detail.status,
              inventaryItems: {
                connect: detail.inventaryItems.map(item => ({
                  id: item.inventoryItemId
                }))
              }
            },
            include: {
              inventaryItems: true
            }
          });

          if (!product) continue;

          const isInputProduct = !!product.inputProduct;
          const totalNeeded = isInputProduct ? detail.measureUnitValue : detail.quantity;

          if (totalNeeded <= 0) continue;

          // Find all inventory items for this product, ordered by oldest first (FIFO)
          const allInventoryItems = await tx.inventaryItem.findMany({
            where: {
              productId: product.id,
              status: InventaryItemStatus.AVAILABLE,
              type: InventaryType.INTERNAL,
              OR: [
                isInputProduct
                  ? { measureUnitValue: { gt: 0 } }
                  : { stock: { gt: 0 } }
              ]
            },
            orderBy: { createdAt: 'asc' } // Sort by creation date to get oldest items first
          });

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

            // Connect this inventory item to the producer detail
            await tx.producerDetail.update({
              where: { id: newDetail.id },
              data: {
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
        }
      }

      // Return the created producer with all its relations
      return tx.producer.findUnique({
        where: { id: newProducer.id },
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
              producer: true,
            },
          },
          user: true,
        },
      });
    });
  } catch (error: any) {
    console.error('Error al crear la produccion:', error);
    throw new Error((error as Error).message);
  }
};

export const getAllProducers = async ({ limit = 10, offset = 0, query = '', user }: { user: { id: string, role: UserRole }, limit?: number; offset?: number, query?: string }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }
    : {};

  try {
    const [producers, total] = await prisma.$transaction([
      prisma.producer.findMany({
        where: {
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
              producer: true,
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
      prisma.producer.count({
        where: {
          ...searchCondition
        },
      }),
    ]);

    return {
      data: producers,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  } catch (error: any) {
    console.error('Error obteniendo producciones:', error);
    throw new Error('Error al obtener las producciones: ' + (error as Error).message);
  }
};

export const getProducersDaily = async () => {

  // Obtener la fecha de inicio y fin del día actual
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  try {

    const result = await prisma.$transaction(async (tx) => {

      const producers = await tx.user.findMany({
        where: {
          // role: UserRole.SELLER,
          producer: {
            some: {}
          }
        },
        include: {
          producer: {
            where: {
              createdAt: {
                gte: startOfDay,
                lt: endOfDay
              },
              // status: SaleStatus.SOLD // Solo ventas completadas
            },
            include: {
              details: true
            }
          }
        }
      });

      let totalProducersAmountToday = 0;

      const users = producers.map(producer => {
        const totalProducersToday = producer.producer.length;
        totalProducersAmountToday += totalProducersToday;

        const producers = producer.producer.map(producer => {
          return {
            id: producer.id,
            date: producer.createdAt,
            status: producer.status,
            details: producer.details.length
          }
        });

        return {
          id: producer.id,
          name: producer.name,
          totalProducersToday,
          producers
        };
      });

      return {
        totalProducersAmountToday,
        users
      };

    });

    return result;

  } catch (error) {
    console.error('Error obteniendo producciones diarias:', error);
    throw new Error('Error al obtener las producciones diarias: ' + (error as Error).message);
  }
}

export const getProducerById = async (id: string) => {
  try {
    return await prisma.producer.findUnique({
      where: {
        id
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
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo produccion por id:', error);
    throw new Error('Error al obtener la produccion: ' + (error as Error).message);
  }
}

export const cancelDetailProducer = async (id: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener el detalle de la produccion con los items de inventario
      const detail = await tx.producerDetail.findUnique({
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
      if (detail.status === ProducerDetailStatus.CANCELLED) {
        return detail;
      }

      // 3. Actualizar el estado del detalle a CANCELADO
      await tx.producerDetail.update({
        where: { id },
        data: { status: ProducerDetailStatus.CANCELLED }
      });

      // 4. Por cada ítem de inventario en el detalle
      for (const item of detail.inventaryItems) {
        const isInputProduct = !!item.product.inputProductId;
        const returnQty = isInputProduct ? detail.measureUnitValue : detail.quantity;

        // 5. Actualizar el ítem de inventario
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

        // 6. Verificar si el inventario necesita ser reactivado
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

        // 7. Si el inventario está cerrado y ahora tiene ítems disponibles, reactivarlo
        if (inventory?.status === InventaryStatus.SOLD && inventory._count.inventaryItems > 0) {
          await tx.inventary.update({
            where: { id: item.inventaryId },
            data: { status: InventaryStatus.PREPARED }
          });
        }
      }

      // 8. Validar si ya estan todos los detalles cancelados
      const producer = await tx.producer.findUnique({ where: { id: detail.producerId }, include: { details: true } });
      if (producer && producer.details.length > 0) {
        const allCancelled = producer.details.every(d => d.status === ProducerDetailStatus.CANCELLED);
        if (allCancelled) {
          await tx.producer.update({ where: { id: producer.id }, data: { status: ProducerStatus.CANCELLED } });
        }
      }

      // 9. Devolver el detalle actualizado
      return tx.producerDetail.findUnique({
        where: { id },
        include: { inventaryItems: true, producer: true }
      });
    });
  } catch (error) {
    console.error('Error cancelando detalle de produccion:', error);
    throw new Error((error as Error).message);
  }
}

export const cancelProducer = async (producerId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener la producción con sus detalles
      const producer = await tx.producer.findUnique({
        where: { id: producerId },
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

      if (!producer) {
        throw new Error('La producción no existe');
      }

      // 2. Si ya está cancelada, no hacer nada
      if (producer.status === ProducerStatus.CANCELLED) {
        return producer;
      }

      // 3. Actualizar el estado de la producción a CANCELADA
      await tx.producer.update({
        where: { id: producerId },
        data: { status: ProducerStatus.CANCELLED }
      });

      // 4. Cancelar cada detalle de la producción en paralelo
      await Promise.all(
        producer.details.map(detail =>
          tx.producerDetail.update({
            where: { id: detail.id },
            data: { status: ProducerDetailStatus.CANCELLED },
            include: { inventaryItems: true }
          })
        )
      );

      // 5. Actualizar el inventario para cada detalle
      for (const detail of producer.details) {
        for (const item of detail.inventaryItems) {
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
        }
      }

      // 5. Devolver la producción actualizada
      return tx.producer.findUnique({
        where: { id: producerId },
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
    console.error('Error cancelando producción:', error);
    throw new Error((error as Error).message);
  }
}

export const getProducersByUser = async ({ userId, limit = 10, offset = 0, query = '' }: { userId: string; limit?: number; offset?: number, query?: string }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }
    : {};

  try {
    const [producers, total, amount] = await prisma.$transaction([
      prisma.producer.findMany({
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
        },
        skip: offset,
        take: limit,
      }),
      prisma.producer.count({
        where: {
          userId,
          ...searchCondition
        },
      }),
      prisma.producer.findMany({
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

    // Calcular total de producciones de hoy
    const totalProducersToday = amount.filter(p => p.createdAt >= new Date(new Date().setHours(0, 0, 0, 0)) && p.createdAt <= new Date(new Date().setHours(23, 59, 59, 999))).length;

    // Calcular total de producciones
    const totalProducers = amount.length;

    return {
      data: producers,
      totalProducersToday,
      totalProducers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error('Error obteniendo producciones por usuario:', error);
    throw new Error('Error al obtener las producciones por usuario');
  }
}