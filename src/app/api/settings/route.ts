import { getSetting, updateSetting } from "@/services/setting.service";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

export async function GET() {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const setting = await getSetting();
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener la configuración' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {

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
    const setting = await updateSetting(body);
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar la configuración' },
      { status: 500 }
    );
  }
}