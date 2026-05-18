import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from "next/server";
import { hasAnyRole, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';
import { createSale, getAllSales } from '@/services/sales.service';
import { createSaleValidation } from '@/validations/sale.validation';

export const POST = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { id } = verifyToken(token);

    if (!hasAnyRole(token, [UserRole.ADMIN, UserRole.SUPER, UserRole.AUXILIAR, UserRole.SELLER])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const body = await request.json();

    const error = createSaleValidation(body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    
    const sale = await createSale(id, body);
    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error al crear la venta:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};

export const GET = async (request: NextRequest) => {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const { searchParams } = request.nextUrl;
  const limit = Number(searchParams.get('limit')) || 10;
  const offset = Number(searchParams.get('offset')) || 0;
  const query = searchParams.get('query') || '';

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { id, role } = verifyToken(token);

    const user = {id, role};

    const sales = await getAllSales({ user, limit, offset, query });
    return NextResponse.json(sales);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }

};
