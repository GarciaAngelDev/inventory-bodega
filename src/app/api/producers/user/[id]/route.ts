import { verifyToken } from "@/lib/auth";
import { getProducersByUser } from "@/services/producer.service";
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

    const { searchParams } = request.nextUrl;
    const limit = Number(searchParams.get('limit')) || 10;
    const offset = Number(searchParams.get('offset')) || 0;
    const query = searchParams.get('query') || '';

    const { id } = await params;
    const producer = await getProducersByUser({ userId: id, limit, offset, query });
    return NextResponse.json(producer);
  } catch (error) {
    console.error('Error al obtener la produccion:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
