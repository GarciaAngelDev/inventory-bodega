import { createClient, getClients } from "@/services/client.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const client = await createClient(body);
    return NextResponse.json(client);
  } catch (error) {
    console.log('Error al crear el cliente:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};

export const GET = async () => {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.log('Error al obtener los clientes:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};
