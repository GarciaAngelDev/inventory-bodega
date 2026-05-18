import { hasAnyRole, verifyToken } from "@/lib/auth";
import { deleteCategory, getCategoryById, updateCategory } from "@/services/categories.service";
import { UserRole } from "@/types";
import { createCategoryValidation } from "@/validations/category.validation";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as uuid from 'uuid';

export async function GET(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'El id de la categoria es requerido' }, { status: 400 });
  }

  if (!uuid.validate(id)) {
    return NextResponse.json({ error: 'El id de la categoria es invalido' }, { status: 400 });
  }

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const category = await getCategoryById(id);
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'El id de la categoria es requerido' }, { status: 400 });
  }

  if (!uuid.validate(id)) {
    return NextResponse.json({ error: 'El id de la categoria es invalido' }, { status: 400 });
  }

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { name, description, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'El id de la categoria es requerido' }, { status: 400 });
    }

    if (!uuid.validate(id)) {
      return NextResponse.json({ error: 'El id de la categoria es invalido' }, { status: 400 });
    }

    const error = createCategoryValidation({ name, description, status });

    if (error) {
      return Response.json({ error }, { status: 400 });
    }
    const category = await updateCategory(id, { name, description, status });
    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'El id de la categoria es requerido' }, { status: 400 });
  }

  if (!uuid.validate(id)) {
    return NextResponse.json({ error: 'El id de la categoria es invalido' }, { status: 400 });
  }

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const category = await deleteCategory(id);
    return NextResponse.json(category);

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

}
