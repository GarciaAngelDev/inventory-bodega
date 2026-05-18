import { NextRequest, NextResponse } from "next/server";
import { getDashboardByDateOrDateRange } from "@/services/dashboard.service";
import { cookies } from 'next/headers'
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

type DateRange = {
  from: Date;
  to?: Date;
};

export const GET = async (request: NextRequest) => {

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

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const dateRange: DateRange = { from: from ? new Date(from) : new Date(), to: to ? new Date(to) : undefined }

    const dashboardData = await getDashboardByDateOrDateRange(dateRange);
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.log('Error al obtener el dashboard:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
};