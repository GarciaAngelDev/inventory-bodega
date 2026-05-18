import { InventaryItemStatus, InventaryStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { CreateInventoryData, InventoryItemStatus, UpdateInventoryItemData } from "@/types";
import { DateRange } from "react-day-picker";

export const createInventary = async (userId: string, data: CreateInventoryData) => {
  try {
    return await prisma.$transaction(async (tx) => {

      // 1. First, create the inventary
      const newInventary = await tx.inventary.create({
        data: {
          name: data.name,
          type: data.type,
          invoiceNumber: data.invoiceNumber,
          providerName: data.providerName,
          user: {
            connect: { id: userId },
          },
        },
      });

      // 2. If there are items
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          // Obtener el producto para acceder a su measureUnitValue
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { measureUnitValue: true, inputProduct: true }
          });

          if (!product) {
            throw new Error(`Producto con ID ${item.productId} no encontrado`);
          }

          // Calcular los valores basados en el producto
          const itemMeasureUnitValue = Number(item.stock) * Number(product.measureUnitValue!);

          // Create the item
          await tx.inventaryItem.create({
            data: {
              inventaryId: newInventary.id,
              type: newInventary.type,
              productId: item.productId,
              retailPrice: Number(item.retailPrice),
              wholesalePrice: Number(item.wholesalePrice),
              stock: Number(item.stock),
              initialStock: Number(item.stock),
              ivaPercentage: Number(item.ivaPercentage! > 0 ? item.ivaPercentage! : 0),
              measureUnitValue: itemMeasureUnitValue,
              initialMeasureUnitValue: itemMeasureUnitValue,
            },
          });
        }
      }

      // Return the created inventary with all its relations
      return tx.inventary.findUnique({
        where: { id: newInventary.id },
        include: {
          inventaryItems: true,
          user: true,
        },
      });
    });
  } catch (error: any) {
    console.log('Error creating inventary:', error);
    throw new Error('Failed to create inventary: ' + (error as Error).message);
  }
};

export const getAllInventary = async ({ limit = 10, offset = 0, query = '', dateRange }: { limit?: number; offset?: number, query?: string, dateRange?: DateRange }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }
    : {};

  const dateCondition = dateRange
    ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    }
    : {};


  try {
    const [inventaries, total] = await prisma.$transaction([
      prisma.inventary.findMany({
        where: {
          status: {
            not: InventaryStatus.CANCELLED
          },
          ...searchCondition,
          ...dateCondition,
        },
        include: {
          inventaryItems: {
            include: {
              product: true
            }
          },
          user: true,
        },
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.inventary.count({
        where: {
          status: {
            not: InventaryStatus.CANCELLED
          },
          ...searchCondition
        },
      }),
    ]);

    return {
      data: inventaries,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  } catch (error: any) {
    console.log('Error getting inventary:', error);
    throw new Error('Failed to get inventary: ' + (error as Error).message);
  }
};

export const getInventaryById = async (id: string) => {
  try {

    const existsInventary = await prisma.inventary.findUnique({
      where: { id },
    });

    if (!existsInventary) {
      throw new Error('El inventario no existe');
    }

    const inventary = await prisma.inventary.findUnique({
      where: { id },
      include: {
        inventaryItems: {
          include: {
            product: {
              include: {
                inputProduct: true
              }
            }
          }
        },
        user: true,
      },
    });

    return inventary;
  } catch (error: any) {
    console.log('Error getting inventary:', error);
    throw new Error('Failed to get inventary: ' + (error as Error).message);
  }
};

export const updateInventary = async (id: string, userId: string, data: CreateInventoryData) => {
  try {

    const existsInventary = await prisma.inventary.findUnique({
      where: { id },
    });

    if (!existsInventary) {
      throw new Error('El inventario no existe');
    }

    if (existsInventary.status === InventaryStatus.SOLD) {
      throw new Error('No puedes modificar un inventario que ya se vendio');
    }

    return await prisma.$transaction(async (tx) => {

      // 1. First, update the inventary
      const newInventary = await tx.inventary.update({
        where: { id },
        data: {
          name: data.name,
          invoiceNumber: data.invoiceNumber,
          providerName: data.providerName,
          status: data.status,
          type: data.type,
          user: {
            connect: { id: userId },
          },
        },
      });

      // 2. If there are items
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          // Update or update

          // Obtener el producto para acceder a su measureUnitValue
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { measureUnitValue: true, inputProduct: true }
          });

          if (!product) {
            throw new Error(`Producto con ID ${item.productId} no encontrado`);
          }

          // Calcular los valores basados en el producto
          const itemMeasureUnitValue = Number(item.stock) * Number(product.measureUnitValue!);

          const updateStatus = () => {
            if( (item.status !== InventaryItemStatus.STOP) && (item.status !== InventaryItemStatus.AVAILABLE) ) return item.status;
            return data.status
            ? data.status === InventaryStatus.STOP
              ? InventaryItemStatus.STOP
              : data.status === InventaryStatus.PREPARED
                ? InventaryItemStatus.AVAILABLE
                : item.status
            : item.status;
          }

          const newStatus = updateStatus();

          if (item.id) {
            await tx.inventaryItem.update({
              where: { id: item.id },
              data: {
                inventaryId: newInventary.id,
                type: newInventary.type,
                productId: item.productId,
                retailPrice: Number(item.retailPrice),
                wholesalePrice: Number(item.wholesalePrice),
                status: newStatus,
                stock: Number(item.stock),
                initialStock: Number(item.initialStock),
                ivaPercentage: Number(item.ivaPercentage! > 0 ? item.ivaPercentage! : 0),
                measureUnitValue: itemMeasureUnitValue,
                initialMeasureUnitValue: itemMeasureUnitValue,
              },
            });
          } else {
            await tx.inventaryItem.create({
              data: {
                inventaryId: newInventary.id,
                type: newInventary.type,
                productId: item.productId,
                retailPrice: Number(item.retailPrice),
                wholesalePrice: Number(item.wholesalePrice),
                stock: Number(item.stock),
                initialStock: Number(item.stock),
                ivaPercentage: Number(item.ivaPercentage! > 0 ? item.ivaPercentage! : 0),
                measureUnitValue: itemMeasureUnitValue,
                initialMeasureUnitValue: itemMeasureUnitValue,
              },
            });
          }
        }
      }

      // Return the updated inventary with all its relations
      return tx.inventary.findUnique({
        where: { id: newInventary.id },
        include: {
          inventaryItems: true,
          user: true,
        },
      });
    });
  } catch (error: any) {
    console.log('Error updating inventary:', error);
    throw new Error('Failed to update inventary: ' + (error as Error).message);
  }
};

export const updateInventaryItem = async (id: string, data: UpdateInventoryItemData) => {
  try {
    const existsInventaryItem = await prisma.inventaryItem.findUnique({
      where: { id },
    });

    if (!existsInventaryItem) {
      throw new Error('El producto del inventario no existe');
    }

    if(data.status && data.status === InventaryItemStatus.OUT_OF_STOCK) {
      throw new Error('No puedes modificar un producto que esta agotado');
    }

    const inventaryItem = await prisma.inventaryItem.update({
      where: { id },
      data,
    });
    return inventaryItem;
  } catch (error: any) {
    console.log('Error updating inventary item:', error);
    throw new Error('Failed to update inventary item: ' + (error as Error).message);
  }
};

export const deleteInventary = async (id: string) => {
  try {

    const existsInventary = await prisma.inventary.findUnique({
      where: { id },
    });

    if (!existsInventary) {
      throw new Error('El inventario no existe');
    }

    const inventary = await prisma.inventary.delete({
      where: { id },
    });
    return inventary;
  } catch (error: any) {
    console.log('Error deleting inventary:', error);
    throw new Error('Failed to delete inventary: ' + (error as Error).message);
  }
};

export const deleteInventaryItem = async (id: string) => {
  try {

    const existsInventaryItem = await prisma.inventaryItem.findUnique({
      where: { id },
    });

    if (!existsInventaryItem) {
      throw new Error('El item del inventario no existe');
    }

    const inventaryItem = await prisma.inventaryItem.delete({
      where: { id },
    });
    return inventaryItem;
  } catch (error: any) {
    console.log('Error deleting inventary item:', error);
    throw new Error('Failed to delete inventary item: ' + (error as Error).message);
  }
};
