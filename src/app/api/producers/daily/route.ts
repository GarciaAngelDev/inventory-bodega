import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";
import { getProducersDaily } from "@/services/producer.service";

export async function GET() {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const producers = await getProducersDaily();
    return NextResponse.json(producers);

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }

}
