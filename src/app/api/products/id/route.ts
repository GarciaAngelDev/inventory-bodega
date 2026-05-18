import { NextRequest, NextResponse } from "next/server";
import { deleteProduct, getProductById, updateProduct } from "@/services/products.service";
import * as uuid from 'uuid';
import { createProductValidation } from "@/validations/product.validation";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

export async function GET(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'El id del producto es requerido' }, { status: 400 });
  }

  if (!uuid.validate(id)) {
    return NextResponse.json({ error: 'El id del producto es invalido' }, { status: 400 });
  }

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const product = await getProductById(id);

    return NextResponse.json(product);

  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener el producto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const id = request.nextUrl.searchParams.get('id');

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'El id del producto es requerido' }, { status: 400 });
    }

    if (!uuid.validate(id)) {
      return NextResponse.json({ error: 'El id del producto es invalido' }, { status: 400 });
    }

    const productData = await request.json();

    const error = createProductValidation(productData);

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    const updatedProduct = await updateProduct(id, productData);

    if (!updatedProduct) {
      return Response.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return Response.json(updatedProduct);

  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json(
      { error: 'Error interno del servidor al actualizar el producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const id = request.nextUrl.searchParams.get('id');

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'El id del producto es requerido' }, { status: 400 });
    }

    if (!uuid.validate(id)) {
      return NextResponse.json({ error: 'El id del producto es invalido' }, { status: 400 });
    }

    const deletedProduct = await deleteProduct(id);

    return NextResponse.json(deletedProduct);
    
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json(
      { error: 'Error interno del servidor al eliminar el producto' },
      { status: 500 }
    );
  }

}
