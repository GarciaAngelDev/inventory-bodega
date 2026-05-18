import { PrismaClient } from "@/generated/prisma";
import { hash } from "bcryptjs";
import { generateSlug } from "./slugify";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Creamos una instancia extendida de PrismaClient
const prismaClient = new PrismaClient().$extends({
  query: {
    // Middleware para usuarios (hashear contraseñas)

    user: {
      async create({ args, query }) {
        if (args.data.password && typeof args.data.password === 'string') {
          args.data.password = await hash(args.data.password, 12);
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.password && typeof args.data.password === 'string') {
          args.data.password = await hash(args.data.password, 12);
        }
        return query(args);
      },
      async upsert({ args, query }) {
        if (args.create.password && typeof args.create.password === 'string') {
          args.create.password = await hash(args.create.password, 12);
        }
        if (args.update.password && typeof args.update.password === 'string') {
          args.update.password = await hash(args.update.password, 12);
        }
        return query(args);
      }
    },
    // Middleware para productos (generar slugs)
    product: {
      async create({ args, query }) {
        if (args.data.name && !args.data.slug) {
          args.data.slug = generateSlug(args.data.name);
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.name && typeof args.data.name === 'string') {
          args.data.slug = { set: generateSlug(args.data.name) };
        }
        return query(args);
      }
    },
    // Middleware para categorías (generar slugs)
    category: {
      async create({ args, query }) {
        if (args.data.name && !args.data.slug) {
          args.data.slug = generateSlug(args.data.name);
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.name && typeof args.data.name === 'string') {
          args.data.slug = { set: generateSlug(args.data.name) };
        }
        return query(args);
      }
    }
  }
});

export const prisma = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}