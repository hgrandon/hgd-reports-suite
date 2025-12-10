// src/app/api/status-os/route.ts
import { NextResponse } from 'next/server';

/**
 * URL pública del CSV en OneDrive.
 *
 * 👉 Recomendado:
 *    Define STATUS_OS_ONEDRIVE_URL en tu .env.local y en Vercel:
 *
 *    STATUS_OS_ONEDRIVE_URL="https://1drv.ms/x/c/ee59d2f4cd050886/IQBHOENRuHf6SIu6IuP2EDPwAfaqaZA0ElB97miXaPa2pro?download=1"
 *
 * Si la variable no existe, usará el valor por defecto de abajo.
 */
const FALLBACK_CSV_URL =
  'https://1drv.ms/x/c/ee59d2f4cd050886/IQBHOENRuHf6SIu6IuP2EDPwAfaqaZA0ElB97miXaPa2pro?download=1';

const CSV_PUBLIC_URL =
  process.env.STATUS_OS_ONEDRIVE_URL && process.env.STATUS_OS_ONEDRIVE_URL.trim().length > 0
    ? process.env.STATUS_OS_ONEDRIVE_URL.trim()
    : FALLBACK_CSV_URL;

export async function GET() {
  // Pequeña validación por si quedara vacío
  if (!CSV_PUBLIC_URL) {
    console.error(
      '[status-os] CSV_PUBLIC_URL vacío. Revisa la variable STATUS_OS_ONEDRIVE_URL o el fallback.'
    );
    return NextResponse.json(
      { error: 'No hay URL configurada para el CSV de OneDrive.' },
      { status: 500 }
    );
  }

  try {
    // Opcional: timeout para evitar quedarse pegado si OneDrive no responde
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30 segundos

    const res = await fetch(CSV_PUBLIC_URL, {
      // OneDrive suele redirigir al archivo real
      redirect: 'follow',
      signal: controller.signal,
      // Forzamos no cachear en el servidor (tú decides si luego quieres cachear)
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(
        '[status-os] Error al descargar CSV:',
        res.status,
        res.statusText
      );
      return NextResponse.json(
        {
          error: 'No se pudo descargar el archivo CSV desde OneDrive.',
          status: res.status,
          statusText: res.statusText,
        },
        { status: 500 }
      );
    }

    const text = await res.text();

    // 🔹 Devolvemos el CSV como texto plano
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        // No cache en el edge/server (para tener siempre la versión nueva)
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    if ((error as any)?.name === 'AbortError') {
      console.error('[status-os] Timeout al descargar el CSV desde OneDrive');
      return NextResponse.json(
        { error: 'Timeout al descargar el CSV desde OneDrive.' },
        { status: 504 }
      );
    }

    console.error('[status-os] Error inesperado en /api/status-os:', error);
    return NextResponse.json(
      { error: 'Error interno al descargar el CSV.' },
      { status: 500 }
    );
  }
}
