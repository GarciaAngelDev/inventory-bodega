import { createSuperUser } from "@/services/seed.service";
import { generateSetting } from "@/services/setting.service";
import { NextResponse } from "next/server";

export async function GET() {

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    return NextResponse.json({ error: 'No puedes realizar esta acción' }, { status: 400 });
  }

  try {
    const response = await createSuperUser();
    await generateSetting();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al crear el super usuario:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Error interno del servidor al crear el super usuario' },
      { status: 500 }
    );
  }
}
