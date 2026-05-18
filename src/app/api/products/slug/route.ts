import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/services/products.service";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

export async function GET(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const slug = request.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'El slug del producto es requerido' }, { status: 400 });
  }

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const product = await getProductBySlug(slug);

    return NextResponse.json(product);

  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener el producto' },
      { status: 500 }
    );
  }
}