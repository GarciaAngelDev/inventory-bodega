import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { createUser, getAllUsers } from "@/services/user.service";
import { createUserValidation } from "@/validations/user.validation";
import { UserRole } from "@/types";

export const POST = async (request: NextRequest) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const body = await request.json();
    const error = createUserValidation(body);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const users = await createUser(body.name, body.email, body.password, body.role);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al crear usuario' },
      { status: 500 }
    );
  }
};

export const GET = async (request: NextRequest) => {

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

    const users = await getAllUsers({ limit, offset, query });
    return NextResponse.json(users);

  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener los usuarios' },
      { status: 500 }
    );
  }

}