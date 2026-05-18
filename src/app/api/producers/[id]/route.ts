import { hasAnyRole, verifyToken } from "@/lib/auth";
import { getProducerById } from "@/services/producer.service";
import { UserRole } from "@/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const { id } = await params;
    const producer = await getProducerById(id);
    return NextResponse.json(producer);
  } catch (error) {
    console.error('Error al obtener la produccion:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};