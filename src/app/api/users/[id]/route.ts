import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/services/user.service";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { updateUserValidation } from "@/validations/user.validation";
import { UserRole } from "@/types";

export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {

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

    const { id } = await params;
    const body = await req.json();

    const error = updateUserValidation(body);

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const user = await updateUser(id, body);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al actualizar usuario' },
      { status: 500 }
    );
  }
};