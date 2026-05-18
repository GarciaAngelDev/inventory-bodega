import { register } from "@/services/auth.service";
import { registerValidation } from "@/validations/auth.validation";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasAnyRole, verifyToken } from "@/lib/auth";
import { UserRole } from "@/types";

export async function POST(request: NextRequest) {

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {

    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    verifyToken(token);

    if (!hasAnyRole(token, [UserRole.SUPER])) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, { status: 400 });
    }

    const { name, email, password } = await request.json();

    const error = registerValidation({ name, email, password });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const user = await register(name, email, password);
    return NextResponse.json(user);

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
