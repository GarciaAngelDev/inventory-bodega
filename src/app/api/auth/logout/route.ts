import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ message: 'Logout successful' }, {
      headers: {
        'Set-Cookie': `token=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax`
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}