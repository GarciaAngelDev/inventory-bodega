import { getAvailableProducts } from "@/services/products.service";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { InventaryType } from "@/generated/prisma";
import { UserRole } from "@/types";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ type: string }> }) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    const { type } = await params;

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { id, role } = verifyToken(token);

    const limit = request.nextUrl.searchParams.get('limit');
    const offset = request.nextUrl.searchParams.get('offset');
    const search = request.nextUrl.searchParams.get('search') || '';
    const user = { id, role };

    const availableProducts = await getAvailableProducts({ type: type as InventaryType, user, limit: Number(limit), offset: Number(offset), search });
    return NextResponse.json(availableProducts);
  } catch (error) {
    console.error('Error getting available products:', error);
    return NextResponse.json({ error: 'Error getting available products' }, { status: 500 });
  }
}
