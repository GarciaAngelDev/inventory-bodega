import { NextRequest, NextResponse } from "next/server";
import { createCategoryValidation } from "@/validations/category.validation";
import { createCategory } from "@/services/categories.service";
import { getAllCategories } from "@/services/categories.service";
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

    const categoryData = await request.json();

    const error = createCategoryValidation(categoryData);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const category = await createCategory(categoryData);
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get('limit')) || 10;
  const offset = Number(searchParams.get('offset')) || 0;
  const query = searchParams.get('query') || "";

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const categories = await getAllCategories({ limit, offset, query });
    return NextResponse.json(categories);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
