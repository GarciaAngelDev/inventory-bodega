import { getRates } from "@/services/rates.service";
import { RateType } from "@/types";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
export async function GET(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const params = request.nextUrl.searchParams;
  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const rateType = params.get('rateType');

    if (!rateType) {
      return NextResponse.json({ error: 'El tipo de tasa de cambio es requerido' }, { status: 400 });
    }

    if (rateType.toUpperCase() !== RateType.OFICIAL && rateType.toUpperCase() !== RateType.PARALELO) {
      return NextResponse.json({ error: 'Tipo de tasa de cambio no válido' }, { status: 400 });
    }

    const rate = await getRates(rateType.toUpperCase() as RateType);
    return NextResponse.json(rate);

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message || 'Error al obtener la tasa de cambio' }, { status: 400 });
    }
    if (error instanceof AxiosError) {
      return NextResponse.json({ error: error.response?.data.error || 'Error al obtener la tasa de cambio' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
