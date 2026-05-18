import { api } from "@/api/axios";
import { CreateClient } from "@/types";

export const createClientAction = async (client: CreateClient) => {
  try {
    const { data } = await api.post("/client", client);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getClientsAction = async () => {
  try {
    const { data } = await api.get("/client");
    return data;
  } catch (error) {
    throw error;
  }
};
