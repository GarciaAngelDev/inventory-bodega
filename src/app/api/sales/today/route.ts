import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyToken, hasAnyRole } from "@/lib/auth";
import { UserRole } from "@/types";
import { getSellersDailySales } from "@/services/sales.service";

export async function GET(request: NextRequest) {

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

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 10;
    const offset = Number(searchParams.get('offset')) || 0; 

    const sales = await getSellersDailySales(limit, offset);
    return NextResponse.json(sales);

  } catch (error) {
    console.error('Error al obtener las ventas diarias:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }

}
