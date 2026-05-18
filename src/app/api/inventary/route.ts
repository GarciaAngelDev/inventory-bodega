import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from "next/server";
import { createInventary, getAllInventary } from "@/services/inventary.service";
import { hasAnyRole, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';

export const POST = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { id } = verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR, UserRole.INVENTORY])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const body = await request.json();
    const inventary = await createInventary(id, body);
    return NextResponse.json(inventary);
  } catch (error) {
    console.log('Error creating inventary:', error);
    return NextResponse.json({ error: 'Failed to create inventary' }, { status: 500 });
  }
};

export const GET = async (request: NextRequest) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get('limit')) || 10;
  const offset = Number(searchParams.get('offset')) || 0;
  const query = searchParams.get('query') || '';
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const inventary = await getAllInventary({ limit, offset, query, dateRange: { from: dateFrom ? new Date(dateFrom) : undefined, to: dateTo ? new Date(dateTo) : undefined } });
    return NextResponse.json(inventary);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

};
