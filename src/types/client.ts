export interface Client {
  id?: string;
  name: string;
  phone: string;
  address: string;
  identity: string;
}

export interface CreateClient {
  name: string;
  phone?: string;
  address?: string;
  identity?: string;
}

export interface ClientFetch {
  id: string;
  name: string;
  phone: string;
  address: string;
  identity: string;
  createdAt: string;
  updatedAt: string;
}