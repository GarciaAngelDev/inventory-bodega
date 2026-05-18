import { prisma } from "@/lib/prisma";
import { CreateProductData, InventoryItemStatus, MeasureUnit, ProductType, UserRole } from "@/types";
import { InventaryItemStatus, InventaryStatus, InventaryType, SaleDetailStatus, SaleStatus, Status } from "@/generated/prisma";

export const createProduct = async (data: CreateProductData) => {
  try {

    return await prisma.$transaction(async (tx) => {

      const existsProduct = await tx.product.findUnique({
        where: {
          name: data.name,
        },
      });
  
      if (existsProduct) {
        throw new Error('Ya existe un producto con el mismo nombre');
      }
  
      if(data.refCode){
        const existsRefCode = await tx.product.findUnique({
          where: {
            refCode: data.refCode,
          },
        });
  
        if (existsRefCode) {
          throw new Error('Ya existe un producto con el mismo codigo de referencia');
        }
      }

      // 1. First, create the product
      const productData: any = {
        name: data.name,
        type: data.type,
        refCode: data.refCode,
        description: data.description,
        brand: data.brand,
        minStock: Number(data.minStock) || 0,
        maxStock: Number(data.maxStock) || 0,
        images: data.images || [],
        tags: data.tags || [],
        measureUnitValue: Number(data.measureUnitValue) || null,
        category: {
          connect: { name: data.category }
        },
      };

      if (data.inputProductId) {
        productData.inputProduct = {
          connect: { id: data.inputProductId }
        };
      }

      const newProduct = await tx.product.create({
        data: productData,
      });

      // 2. If there are characteristics, create them along with their items
      if (data.characteristics && data.characteristics.length > 0) {
        for (const characteristic of data.characteristics) {
          // Skip characteristics without items
          if (!characteristic.items || characteristic.items.length === 0) continue;

          // Create the characteristic
          const newCharacteristic = await tx.productCharacteristics.create({
            data: {
              name: characteristic.name,
              productId: newProduct.id,
            },
          });

          // Create all items for this characteristic
          await tx.productCharacteristicsItem.createMany({
            data: characteristic.items.map(item => ({
              value: item.value,
              productCharacteristicsId: newCharacteristic.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Return the created product with all its relations
      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          characteristics: {
            include: {
              items: true,
            },
          },
          inputProduct: true,
        },
      });
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      throw new Error('Ya existe un producto con el mismo nombre');
    }
    if (error.code === 'P2025') {
      throw new Error('La categoria no existe');
    }
    throw new Error((error as Error).message);
  }
};

// Helper function to get all products with their characteristics
export const getProducts = async ({ limit = 20, offset = 0, query = '', type = '' }: { limit?: number, offset?: number, query?: string, type?: string }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { brand: { contains: searchQuery, mode: 'insensitive' as const } },
        { refCode: { contains: searchQuery, mode: 'insensitive' as const } },
        { tags: { hasSome: [searchQuery] } },
      ],
    }
    : {};

  const typeCondition = type ? { type: type as ProductType } : {};

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: {
        ...searchCondition,
        ...typeCondition,
      },
      include: {
        category: true,
        characteristics: {
          include: {
            items: true,
          },
        },
        inputProduct: true,
      },
      take: limit,
      skip: offset,
    }),
    prisma.product.count({
      where: {
        ...searchCondition,
        ...typeCondition,
      },
    })]);

  return {
    data: products,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
    },
  };
};

// Helper function to get a single product with its characteristics
export const getProductById = async (id: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        characteristics: {
          include: {
            items: true,
          },
        },
        inputProduct: true,
      },
    });

    return product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Helper function to get a single product with its characteristics
export const getProductBySlug = async (slug: string) => {
  try {

    const existsProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (!existsProduct) {
      throw new Error('El producto no existe');
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        characteristics: {
          include: {
            items: true,
          },
        },
        inputProduct: true,
      },
    });

    return product;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

export const updateProduct = async (id: string, data: Partial<CreateProductData>) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Prepare the update data
      const updateData: any = {
        name: data.name,
        refCode: data.refCode,
        type: data.type,
        description: data.description,
        brand: data.brand,
        images: data.images,
        tags: data.tags,
        status: data.status,
        minStock: Number(data.minStock) || 0,
        maxStock: Number(data.maxStock) || 0,
        measureUnitValue: Number(data.measureUnitValue) || null,
        category: {
          connect: { name: data.category }
        },
      };

      if (data.inputProductId) {
        updateData.inputProduct = {
          connect: { id: data.inputProductId }
        };
      }

      // Update the product
      await tx.product.update({
        where: { id },
        data: updateData,
      });

      // If there are characteristics, update them
      if (data.characteristics) {
        // First, remove all existing characteristics and items
        await tx.productCharacteristicsItem.deleteMany({
          where: {
            productCharacteristics: {
              productId: id,
            },
          },
        });

        await tx.productCharacteristics.deleteMany({
          where: { productId: id },
        });

        // Then add the new characteristics and items
        for (const characteristic of data.characteristics) {
          if (!characteristic.items || characteristic.items.length === 0) continue;

          const newChar = await tx.productCharacteristics.create({
            data: {
              name: characteristic.name,
              productId: id,
            },
          });

          await tx.productCharacteristicsItem.createMany({
            data: characteristic.items.map(item => ({
              value: item.value,
              productCharacteristicsId: newChar.id,
            })),
          });
        }
      }

      // Return the updated product with all relations
      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          characteristics: {
            include: {
              items: true,
            },
          },
          inputProduct: true,
        },
      });
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error((error as Error).message);
  }
};

export const deleteProduct = async (id: string) => {
  try {
    return await prisma.$transaction(async (tx) => {

      const existsProduct = await tx.product.findUnique({ where: { id } });

      if (!existsProduct) {
        throw new Error('El producto no existe');
      }

      // validar si el producto esta siendo usado en al menos 1 inventario item
      const inventaryItems = await tx.inventaryItem.findMany({ where: { productId: id } });
      if (inventaryItems.length > 0) {
        throw new Error('No puedes eliminar este producto porque se esta usando en un inventario');
      }

      // First delete all characteristic items
      await tx.productCharacteristicsItem.deleteMany({
        where: {
          productCharacteristics: {
            productId: id,
          },
        },
      });

      // Then delete all characteristics
      await tx.productCharacteristics.deleteMany({
        where: { productId: id },
      });

      // Finally, delete the product
      return await tx.product.delete({
        where: { id },
      });
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error((error as Error).message);
  }
};

interface AvaliableProductsResponse {
  type: InventaryType;
  user: { id: string; role: UserRole };
  limit?: number;
  offset?: number;
  search?: string;
}

export const getAvailableProducts = async ({ type = InventaryType.SALE, user, limit, offset = 0, search = '' }: AvaliableProductsResponse) => {
  try {
    const inventoryItems = await prisma.inventaryItem.findMany({
      where: {
        type: user.role === UserRole.SELLER ? type : (user.role === UserRole.SUPER || user.role === UserRole.ADMIN || user.role === UserRole.AUXILIAR) && type === InventaryType.INTERNAL ? type : {},
        status: InventoryItemStatus.AVAILABLE,
        inventary: {
          status: InventaryStatus.PREPARED,
        }
      },
      include: {
        product: {
          include: {
            inputProduct: true,
          },
        },
        inventary: true,
        saleDetails: {
          where: {
            status: SaleDetailStatus.SOLD,
            sale: {
              status: SaleStatus.SOLD
            }
          },
          include: {
            sale: true
          }
        },
      },
    });

    // Sort items by inventory creation date (newest first) to find the most recent prices
    const sortedItems = [...inventoryItems].sort((a, b) => 
      new Date(b.inventary.createdAt).getTime() - new Date(a.inventary.createdAt).getTime()
    );

    // Group items by product
    const productMap = new Map();
    
    // First pass: find the most recent price for each product
    const latestPrices = new Map();
    for (const item of sortedItems) {
      if (!latestPrices.has(item.productId)) {
        latestPrices.set(item.productId, {
          retailPrice: item.retailPrice,
          wholesalePrice: item.wholesalePrice
        });
      }
    }
    
    // Second pass: process all items with the correct prices
    for (const item of inventoryItems) {
      const productId = item.productId;
      const isInputProduct = !!item.product.inputProduct;
      
      // Para productos de entrada usamos measureUnitValue, para otros usamos stock
      const initialValue = isInputProduct ? item.initialMeasureUnitValue : item.initialStock;
      const currentValue = isInputProduct ? item.measureUnitValue : item.stock;
      const soldValue = initialValue - currentValue;
      const availableValue = currentValue;
      
      if (!productMap.has(productId)) {
        // Get the most recent prices from our first pass
        const prices = latestPrices.get(productId);
        productMap.set(productId, {
          product: item.product,
          availableQuantity: 0,
          soldQuantity: 0,
          availableMeasureUnitValue: 0,
          soldMeasureUnitValue: 0,
          maxIvaPercentage: item.ivaPercentage || 0, // Inicializar con el primer ivaPercentage encontrado
          totalStock: 0,
          retailPrice: prices.retailPrice,
          wholesalePrice: prices.wholesalePrice,
          ivaPercentage: item.ivaPercentage || 0, // Agregar ivaPercentage al producto
          isInputProduct,
          inventoryItems: [],
        });
      }
      
      const productData = productMap.get(productId);
      if (productData) {
        if (isInputProduct) {
          productData.availableMeasureUnitValue += availableValue;
          productData.soldMeasureUnitValue += soldValue;
        } else {
          productData.availableQuantity += availableValue;
          productData.soldQuantity += soldValue;
        }
        // Actualizar el ivaPercentage más alto encontrado
        if (item.ivaPercentage > 0 && item.ivaPercentage > (productData.maxIvaPercentage || 0)) {
          productData.maxIvaPercentage = item.ivaPercentage;
        }
        productData.totalStock += Number(isInputProduct ? 0 : item.stock);
        
        productData.inventoryItems.push({
          inventoryId: item.inventaryId,
          inventoryName: item.inventary.name,
          inventoryItemId: item.id,
          availableQuantity: isInputProduct ? 0 : availableValue,
          availableMeasureUnitValue: isInputProduct ? availableValue : 0,
          soldQuantity: isInputProduct ? 0 : soldValue,
          soldMeasureUnitValue: isInputProduct ? soldValue : 0,
          stock: Number(item.stock),
          measureUnitValue: item.measureUnitValue,
          inventaryType: item.inventary.type,
        });
      }
    }

    const avaliableProducts = Array.from(productMap.values()).map(item => ({
      product: item.product,
      availableQuantity: item.availableQuantity,
      soldQuantity: item.soldQuantity,
      availableMeasureUnitValue: item.availableMeasureUnitValue,
      soldMeasureUnitValue: item.soldMeasureUnitValue,
      totalStock: item.totalStock,
      retailPrice: item.retailPrice,
      wholesalePrice: item.wholesalePrice,
      ivaPercentage: item.maxIvaPercentage > 0 ? item.maxIvaPercentage : 0, // Usar el mayor ivaPercentage encontrado
      isInputProduct: item.isInputProduct,
      inventoryItems: item.inventoryItems.map((invItem: any) => ({
        ...invItem,
        ivaPercentage: item.maxIvaPercentage > 0 ? item.maxIvaPercentage : 0, // Usar el mayor ivaPercentage encontrado
        isInputProduct: item.isInputProduct
      }))
    }));

    let filteredProducts = avaliableProducts;
    if (search) {
      filteredProducts = avaliableProducts.filter(product => product.product.name.toLowerCase().includes(search.toLowerCase()));
    }

    if (limit) {
      const total = avaliableProducts.length;
      const hasMore = offset + limit < total;
      return {
        data: search ? filteredProducts.slice(offset, offset + limit) : avaliableProducts.slice(offset, offset + limit),
        pagination: {
          limit,
          offset,
          total,
          hasMore,
        },
      };
    } else {
      return search ? filteredProducts : avaliableProducts;
    }
    
  } catch (error) {
    console.error('Error getting available products:', error);
    throw error;
  }
};

export const getAvailableProductById = async (productId: string) => {
  try {
    const inventoryItems = await prisma.inventaryItem.findMany({
      where: {
        productId,
      },
      include: {
        product: {
          include: {
            inputProduct: true,
          },
        },
        inventary: true,
        saleDetails: {
          where: {
            status: SaleDetailStatus.SOLD,
            sale: {
              status: SaleStatus.SOLD
            }
          },
          include: {
            sale: true
          }
        },
      },
    });

    // Si no hay items de inventario para este producto, retornar null
    if (inventoryItems.length === 0) {
      return null;
    }

    // Sort items by inventory creation date (newest first) to find the most recent prices
    const sortedItems = [...inventoryItems].sort((a, b) => 
      new Date(b.inventary.createdAt).getTime() - new Date(a.inventary.createdAt).getTime()
    );

    // Group items by product
    const productMap = new Map();
    
    // First pass: find the most recent price for the product
    const latestPrices = new Map();
    for (const item of sortedItems) {
      if (!latestPrices.has(item.productId)) {
        latestPrices.set(item.productId, {
          retailPrice: item.retailPrice,
          wholesalePrice: item.wholesalePrice
        });
      }
    }
    
    // Second pass: process all items with the correct prices
    for (const item of inventoryItems) {
      const isInputProduct = !!item.product.inputProduct;
      
      // Para productos de entrada usamos measureUnitValue, para otros usamos stock
      const initialValue = isInputProduct ? item.initialMeasureUnitValue : item.initialStock;
      const currentValue = isInputProduct ? item.measureUnitValue : item.stock;
      const soldValue = initialValue - currentValue;
      const availableValue = currentValue;
      
      if (!productMap.has(productId)) {
        // Get the most recent prices from our first pass
        const prices = latestPrices.get(productId);
        productMap.set(productId, {
          product: item.product,
          availableQuantity: 0,
          soldQuantity: 0,
          availableMeasureUnitValue: 0,
          soldMeasureUnitValue: 0,
          maxIvaPercentage: item.ivaPercentage || 0,
          totalStock: 0,
          retailPrice: prices.retailPrice,
          wholesalePrice: prices.wholesalePrice,
          ivaPercentage: item.ivaPercentage || 0,
          isInputProduct,
          inventoryItems: [],
        });
      }
      
      const productData = productMap.get(productId);
      if (productData) {
        if (isInputProduct) {
          productData.availableMeasureUnitValue += availableValue;
          productData.soldMeasureUnitValue += soldValue;
        } else {
          productData.availableQuantity += availableValue;
          productData.soldQuantity += soldValue;
        }
        // Actualizar el ivaPercentage más alto encontrado
        if (item.ivaPercentage > 0 && item.ivaPercentage > (productData.maxIvaPercentage || 0)) {
          productData.maxIvaPercentage = item.ivaPercentage;
        }
        productData.totalStock += Number(isInputProduct ? 0 : item.stock);
        
        productData.inventoryItems.push({
          inventoryId: item.inventaryId,
          inventoryName: item.inventary.name,
          inventoryItemId: item.id,
          availableQuantity: isInputProduct ? 0 : availableValue,
          availableMeasureUnitValue: isInputProduct ? availableValue : 0,
          soldQuantity: isInputProduct ? 0 : soldValue,
          soldMeasureUnitValue: isInputProduct ? soldValue : 0,
          stock: Number(item.stock),
          measureUnitValue: item.measureUnitValue,
        });
      }
    }
    
    const result = Array.from(productMap.values())[0]; // Solo habrá un producto en el mapa
    
    // Si por alguna razón no se encontró el producto, retornar null
    if (!result) {
      return null;
    }
    
    return {
      product: result.product,
      availableQuantity: result.availableQuantity,
      soldQuantity: result.soldQuantity,
      availableMeasureUnitValue: result.availableMeasureUnitValue,
      soldMeasureUnitValue: result.soldMeasureUnitValue,
      totalStock: result.totalStock,
      retailPrice: result.retailPrice,
      wholesalePrice: result.wholesalePrice,
      ivaPercentage: result.maxIvaPercentage > 0 ? result.maxIvaPercentage : 0,
      isInputProduct: result.isInputProduct,
      inventoryItems: result.inventoryItems.map((invItem: any) => ({
        ...invItem,
        ivaPercentage: result.maxIvaPercentage > 0 ? result.maxIvaPercentage : 0,
        isInputProduct: result.isInputProduct
      }))
    };
    
  } catch (error) {
    console.error('Error getting available product by id:', error);
    throw error;
  }
};

export const getAllCriticalProducts = async ({ limit = 10, offset = 0, search = '' }: { limit?: number, offset?: number, search?: string } = {}) => {
  try {
    // Primero obtenemos todos los productos que coincidan con la búsqueda
    const searchCondition = search.trim() ? {
      OR: [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        { refCode: { contains: search.trim(), mode: 'insensitive' as const } },
        { brand: { contains: search.trim(), mode: 'insensitive' as const } },
      ],
    } : {};

    // Obtenemos los productos con sus items de inventario
    const products = await prisma.product.findMany({
      where: {
        ...searchCondition,
        status: Status.ACTIVE,
        inventaryItems: {
          some: {
            type: InventaryType.SALE,
          }
        }
      },
      include: {
        inputProduct: true,
        category: true,
        inventaryItems: {
          where: {
            status: InventoryItemStatus.AVAILABLE,
            inventary: {
              status: InventaryStatus.PREPARED,
              type: InventaryType.SALE,
            },
          },
          include: {
            inventary: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    // Obtenemos el total de productos para la paginación
    const total = await prisma.product.count({
      where: {
        ...searchCondition,
        status: Status.ACTIVE,
      },
    });

    // Procesamos los productos para identificar los críticos
    const criticalProducts = products
      .map(product => {
        // Filtramos los ítems de inventario que estén disponibles
        const availableItems = product.inventaryItems.filter(item => 
          item.status === InventoryItemStatus.AVAILABLE &&
          item.inventary.status === InventaryStatus.PREPARED
        );

        // Variables para el cálculo
        let totalQuantity = 0;
        let isCritical = false;
        let criticalThreshold = 0;

        if (product.inputProduct) {
          // Producto con InputProduct: sumamos measureUnitValue
          totalQuantity = availableItems.reduce((sum, item) => sum + (item.measureUnitValue || 0), 0);
          criticalThreshold = product.inputProduct.minQuantity || 0;
          isCritical = totalQuantity <= criticalThreshold;
        } else {
          // Producto sin InputProduct: sumamos stock
          totalQuantity = availableItems.reduce((sum, item) => sum + (item.stock || 0), 0);
          criticalThreshold = product.minStock || 0;
          isCritical = totalQuantity <= criticalThreshold;
        }

        // Solo devolvemos los productos críticos
        return isCritical ? {
          ...product,
          totalQuantity,
          criticalThreshold,
          isInputProduct: !!product.inputProduct,
        } : null;
      })
      .filter(Boolean); // Filtramos los nulos (productos no críticos)

    return {
      data: criticalProducts,
      pagination: {
        limit,
        offset,
        total: criticalProducts.length, // Total de productos críticos
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.error('Error al obtener productos críticos:', error);
    throw error;
  }
};

export const productDetail = async (id: string) => {
  try {

    const existsProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        characteristics: {
          include: {
            items: true,
          },
        },
        inputProduct: true,
        inventaryItems: {
          include: {
            product: {
              include: {
                inputProduct: true,
              }
            },
          }
        },
      }
    });

    if (!existsProduct) {
      throw new Error('El producto no existe');
    }

    const avaliableCount = existsProduct.inventaryItems
  .filter(item => item.status === InventoryItemStatus.AVAILABLE)
  .reduce((sum, item) => {
    if (item.product.inputProduct) {
      // For products with measurement units
      const measureUnit = item.product.inputProduct.measureUnit;
      if (measureUnit === MeasureUnit.KG || measureUnit === MeasureUnit.L) {
        // For KG and L, use the full measureUnitValue
        return sum + (item.measureUnitValue || 0);
      } else if (measureUnit === MeasureUnit.G || measureUnit === MeasureUnit.ML) {
        // For G and ML, convert to base units (divide by 1000)
        return sum + ((item.measureUnitValue || 0) / 1000);
      }
      // For other units, just add as is
      return sum + (item.measureUnitValue || 0);
    } else {
      // For regular products, add the quantity
      return sum + (item.stock || 0);
    }
  }, 0);
    const retailPrice = existsProduct.inventaryItems[existsProduct.inventaryItems.length - 1].retailPrice;
    const wholesalePrice = existsProduct.inventaryItems[existsProduct.inventaryItems.length - 1].wholesalePrice;

    return {
      ...existsProduct,
      avaliableCount,
      retailPrice,
      wholesalePrice,
    };
    
  } catch (error) {
    throw error;
  }
}