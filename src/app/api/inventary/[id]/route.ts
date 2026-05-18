import { NextRequest, NextResponse } from "next/server";
import { deleteInventary, getInventaryById, updateInventary } from "@/services/inventary.service";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

export const GET = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const { id } = await params;
    const inventary = await getInventaryById(id);
    return NextResponse.json(inventary);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const PUT = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { id: userId } = verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR, UserRole.INVENTORY])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const body = await request.json();
    const { id } = await params;

    const inventary = await updateInventary(id, userId, body);
    return NextResponse.json(inventary);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR, UserRole.INVENTORY])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { id } = await params;

    const inventary = await deleteInventary(id);
    return NextResponse.json(inventary);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
