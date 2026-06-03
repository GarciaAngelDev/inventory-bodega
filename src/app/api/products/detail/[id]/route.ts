import { hasAnyRole, verifyToken } from "@/lib/auth";
import { productDetail, updateLatestProductPrice } from "@/services/products.service";
import { UserRole } from "@/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const { id } = await params;

    const product = await productDetail(id!);
    return NextResponse.json(product);

  } catch (error) {
    console.error('Error fetching product:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener el producto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR])) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta accion' }, { status: 400 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'El id del producto es requerido' }, { status: 400 });
    }

    const { retailPrice, wholesalePrice } = await request.json();

    if (retailPrice === undefined || wholesalePrice === undefined) {
      return NextResponse.json({ error: 'Los precios al detal y al mayor son requeridos' }, { status: 400 });
    }

    const parsedRetailPrice = Number(retailPrice);
    const parsedWholesalePrice = Number(wholesalePrice);

    if (isNaN(parsedRetailPrice) || parsedRetailPrice < 0) {
      return NextResponse.json({ error: 'El precio al detal debe ser un número válido mayor o igual a 0' }, { status: 400 });
    }

    if (isNaN(parsedWholesalePrice) || parsedWholesalePrice < 0) {
      return NextResponse.json({ error: 'El precio al mayor debe ser un número válido mayor o igual a 0' }, { status: 400 });
    }

    await updateLatestProductPrice(id, parsedRetailPrice, parsedWholesalePrice);

    const updatedProduct = await productDetail(id);
    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error('Error updating product price:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar los precios' },
      { status: 500 }
    );
  }
}
