import { prisma } from "@/lib/prisma";
import { CreateClient } from "@/types";

export const createClient = async (client: CreateClient) => {
  try {

    if(client.identity){

      const existClient = await prisma.client.findUnique({
        where: {
          identity: client.identity,
        },
      });

      if(existClient){
        throw new Error("El cliente ya existe");
      }

    }
    
    const newClient = await prisma.client.create({
      data: client,
    });
    
    return newClient;
    
  } catch (error) {
    throw error;
  }
};

export const getClients = async () => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return clients;
  } catch (error) {
    throw error;
  }
};

export const getClientById = async (id: string) => {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if(!client){
      throw new Error("El cliente no existe");
    }

    return client;
  } catch (error) {
    throw error;
  }
};

export const updateClient = async (id: string, client: CreateClient) => {
  try {

    const existClient = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if(!existClient){
      throw new Error("El cliente no existe");
    }
    
    const updatedClient = await prisma.client.update({
      where: {
        id,
      },
      data: client,
    });
    return updatedClient;
  } catch (error) {
    throw error;
  }
};

export const deleteClient = async (id: string) => {
  try {

    const existClient = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if(!existClient){
      throw new Error("El cliente no existe");
    }
    
    const client = await prisma.client.delete({
      where: {
        id,
      },
    });
    return client;
  } catch (error) {
    throw error;
  }
};
