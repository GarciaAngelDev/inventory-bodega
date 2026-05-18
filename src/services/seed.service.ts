import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";

export const createSuperUser = async () => {
  try {
    
    const existSuperUser = await prisma.user.findFirst({
      where: {
        role: UserRole.SUPER,
      },
    });

    if (existSuperUser) {
      throw new Error('No tienes persmisos para esta acción');
    }

    await prisma.user.create({
      data: {
        name: 'Super Administrador',
        email: 'super@email.com',
        password: 'Ed123456789*',
        role: UserRole.SUPER
      },
    });

    return { message: 'Super usuario creado exitosamente' };
  } catch (error) {
    console.error('Error creating super user:', error);
    throw error;
  }
};

export const resetAllData = async (token: string) => {

  const protectedToken = "c96ef49e8550ea85e81474a66793349d0aa182018ac68d6ce99bbf86ae9bfac6";

  if (protectedToken !== token) {
    throw new Error('No tienes persmisos para esta acción');
  }

  try {
    await prisma.$transaction([
      prisma.saleDetail.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.producer.deleteMany(),
      prisma.producerDetail.deleteMany(),
      prisma.inventaryItem.deleteMany(),
      prisma.inventary.deleteMany(),
      prisma.productCharacteristicsItem.deleteMany(),
      prisma.productCharacteristics.deleteMany(),
      prisma.product.deleteMany(),
      prisma.category.deleteMany(),
      prisma.inputProduct.deleteMany(),
      prisma.user.deleteMany({
        where: {
          role: {
            not: UserRole.SUPER
          }
        }
      }),
    ]);
    return { message: 'Todos los datos han sido eliminados exitosamente' };
  } catch (error) {
    throw error;
  }
}