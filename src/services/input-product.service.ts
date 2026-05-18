import { InputProduct, InputProductStatus } from "@/types";
import { prisma } from "@/lib/prisma";

export const createInputProduct = async (inputProduct: InputProduct) => {
  try {
    
    const existInputProduct = await prisma.inputProduct.findUnique({
      where: {
        name: inputProduct.name,
      },
    });

    if (existInputProduct) {
      throw new Error('Ya existe un insumo con el mismo nombre');
    }

    const newInputProduct = await prisma.inputProduct.create({
      data: inputProduct,
    });
    return newInputProduct;
  } catch (error) {
    console.log('Error creating input product:', error);
    throw new Error('Failed to create input product: ' + (error as Error).message);
  }
};

export const getAllInputProducts = async ({ limit = 10, offset = 0, search = "" }: { limit?: number; offset?: number; search?: string }) => {
  try {
    const [inputProducts, total] = await prisma.$transaction([
      prisma.inputProduct.findMany({
        take: limit,
        skip: offset,
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
      prisma.inputProduct.count(),
    ]);
    return {
      data: inputProducts,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.log('Error getting input products:', error);
    throw new Error('Failed to get input products: ' + (error as Error).message);
  }
};

export const updateInputProduct = async (id: string, data: InputProduct) => {
  try {

    const existInputProduct = await prisma.inputProduct.findUnique({
      where: {
        name: data.name,
      },
    });

    if (existInputProduct && existInputProduct.id !== id) {
      throw new Error('Ya existe un insumo con el mismo nombre');
    }

    const updatedInputProduct = await prisma.inputProduct.update({
      where: { id },
      data,
    });
    return updatedInputProduct;
  } catch (error) {
    console.log('Error updating input product:', error);
    throw new Error((error as Error).message);
  }
};

export const deleteInputProduct = async (id: string) => {
  try {

    const existInputProduct = await prisma.inputProduct.findUnique({ where: { id } });

    if (!existInputProduct) {
      throw new Error('Insumo no encontrado');
    }

    // validar si el insumo se esta usando en algun producto
    const products = await prisma.product.findMany({ where: { inputProductId: id } });
    if (products.length > 0) {
      throw new Error('No puedes eliminar un insumo que esta siendo usado en algun producto');
    }

    const deletedInputProduct = await prisma.inputProduct.delete({ where: { id } });
    return deletedInputProduct;
    
  } catch (error) {
    console.log('Error deleting input product:', error);
    throw new Error((error as Error).message);
  }
}
