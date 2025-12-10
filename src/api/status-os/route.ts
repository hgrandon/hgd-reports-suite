// src/app/api/status-os/route.ts
import { NextResponse } from 'next/server';

const CSV_PUBLIC_URL =
  'https://globalkomatsu-my.sharepoint.com/...TU_LINK...&download=1';

export async function GET() {
  try {
    const res = await fetch(CSV_PUBLIC_URL);

    if (!res.ok) {
      console.error('Error al descargar CSV:', res.status, res.statusText);
      return NextResponse.json(
        { error: 'No se pudo descargar el archivo CSV desde OneDrive.' },
        { status: 500 }
      );
    }

    const text = await res.text();

    // Devolvemos texto plano CSV
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error en /api/status-os:', error);
    return NextResponse.json(
      { error: 'Error interno al descargar el CSV.' },
      { status: 500 }
    );
  }
}
