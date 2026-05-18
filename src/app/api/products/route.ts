import { NextRequest, NextResponse } from "next/server";
import { createProductValidation } from "@/validations/product.validation";
import { createProduct, getProducts } from "@/services/products.service";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {

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

    const productData = await request.json();

    // Validate the product data
    const error = createProductValidation(productData);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Create the product
    const product = await createProduct(productData);
    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al crear el producto' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = Number(searchParams.get('offset')) || 0;
    const query = searchParams.get('query') || '';
    const type = searchParams.get('type') || '';

    // Get products with pagination
    const products = await getProducts({ limit, offset, query, type });
    return NextResponse.json(products);

  } catch (error) {
    console.error('Error fetching products:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener los productos' },
      { status: 500 }
    );
  }
}
