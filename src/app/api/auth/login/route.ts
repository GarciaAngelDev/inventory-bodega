import { login } from "@/services/auth.service";
import { loginValidation } from "@/validations/auth.validation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const error = loginValidation({ email, password });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { token, user } = await login(email, password);

    return NextResponse.json(user, {
      headers: {
        'Set-Cookie': `token=${token}; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Max-Age=${60 * 60 * 24}`
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
