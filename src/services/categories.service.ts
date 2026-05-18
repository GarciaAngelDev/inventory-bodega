import { prisma } from "@/lib/prisma";
import { Category } from "@/types/category";
import { generateSlug } from "@/lib/slugify";

export const createCategory = async (category: Category) => {
  try {

    const slug = generateSlug(category.name);

    const existCategory = await prisma.category.findUnique({
      where: {
        slug: slug,
      },
    });

    if (existCategory) {
      throw new Error('Ya existe una categoria con el mismo nombre');
    }

    const newCategory = await prisma.category.create({
      data: category,
    });
    return newCategory;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const getAllCategories = async ({ limit = 10, offset = 0, query = "" }: { limit?: number; offset?: number; query?: string }) => {
  try {
    const [categories, total] = await prisma.$transaction([
      prisma.category.findMany({
        take: limit,
        skip: offset,
        where: {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      }),
      prisma.category.count(),
    ]);

    return {
      data: categories,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryById = async (id: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: {
        id
      },
    });
    return category;
  } catch (error) {
    console.error('Error fetching category by id:', error);
    throw error;
  }
};

export const getCategoriesBySlug = async (slug: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: {
        slug
      },
    });
    return category;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
};

export const updateCategory = async (id: string, category: Category) => {
  
  try {

    const existCategory = await prisma.category.findUnique({
      where: {
        name: category.name,
      },
    });

    if (existCategory && existCategory.id !== id) {
      throw new Error('Ya existe una categoria con el mismo nombre');
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id,
      },
      data: category,
    });
    return updatedCategory;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {

    const existCategory = await prisma.category.findUnique({ where: { id } });

    if (!existCategory) {
      throw new Error('La categoria no existe');
    }

    const products = await prisma.product.findMany({ where: { categoryId: id } });
    if (products.length > 0) {
      throw new Error('No puedes eliminar una categoria que tiene productos asociados');
    }

    const deletedCategory = await prisma.category.delete({ where: { id } });
    return deletedCategory;
    
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}