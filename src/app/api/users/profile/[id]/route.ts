import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateProfileUser } from "@/services/user.service";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    const { id } = await params;
    const { name, oldPassword, newPassword } = await req.json();
    const user = await updateProfileUser(id, { name, oldPassword, newPassword });
    return NextResponse.json(user);
  } catch (error) {
    console.log('Error al actualizar usuario:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar usuario' },
      { status: 500 }
    );
  }
}