import { hasAnyRole, verifyToken } from "@/lib/auth";
import { createInputProduct, getAllInputProducts } from "@/services/input-product.service";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createInputProductValidation } from "@/validations/input-product.validation";
import { UserRole } from "@/types";

export const POST = async (request: NextRequest) => {

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

    const body = await request.json();

    const error = createInputProductValidation(body);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const inputProduct = await createInputProduct(body);
    return NextResponse.json(inputProduct);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const GET = async (request: NextRequest) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const limit = Number(request.nextUrl.searchParams.get('limit')) || 10;
  const offset = Number(request.nextUrl.searchParams.get('offset')) || 0;
  const search = request.nextUrl.searchParams.get('search') || "";

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const inputProducts = await getAllInputProducts({ limit, offset, search });
    return NextResponse.json(inputProducts);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

};
