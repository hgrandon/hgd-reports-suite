import { NextResponse } from 'next/server';

const TENANT_ID = process.env.AZURE_TENANT_ID || '';
const CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const SHARE_URL = process.env.STATUS_OS_SHARE_URL || '';

function base64UrlEncode(input: string) {
  // base64url: + -> -, / -> _, sin =
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function getAppToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams();
  body.set('client_id', CLIENT_ID);
  body.set('client_secret', CLIENT_SECRET);
  body.set('grant_type', 'client_credentials');
  body.set('scope', 'https://graph.microsoft.com/.default');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Token error HTTP ${res.status}: ${t}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

async function getDriveItemFromShareUrl(accessToken: string, shareUrl: string) {
  // Graph: /shares/{shareId}/driveItem
  // shareId = "u!" + base64url(shareUrl)
  const shareId = 'u!' + base64UrlEncode(shareUrl);

  const res = await fetch(`https://graph.microsoft.com/v1.0/shares/${shareId}/driveItem`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`DriveItem error HTTP ${res.status}: ${t}`);
  }

  return res.json();
}

async function downloadDriveItemContent(accessToken: string, itemId: string) {
  // Tip: usando /drive/items/{id}/content funciona si el item viene con parentReference.driveId
  // pero para lo más seguro usamos el @microsoft.graph.downloadUrl si viene.
  // Aun así, /content con bearer suele funcionar.
  const res = await fetch(`https://graph.microsoft.com/v1.0/drive/items/${itemId}/content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    redirect: 'follow',
    cache: 'no-store',
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Download error HTTP ${res.status}: ${t}`);
  }

  return res.text();
}

export async function GET() {
  // Validaciones
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Faltan variables Azure (TENANT_ID/CLIENT_ID/CLIENT_SECRET).' },
      { status: 500 }
    );
  }
  if (!SHARE_URL) {
    return NextResponse.json(
      { error: 'Falta STATUS_OS_SHARE_URL (link compartido del archivo).' },
      { status: 500 }
    );
  }

  try {
    const accessToken = await getAppToken();
    const driveItem = await getDriveItemFromShareUrl(accessToken, SHARE_URL);

    const itemId = driveItem?.id as string | undefined;
    if (!itemId) {
      return NextResponse.json(
        { error: 'No se pudo resolver el DriveItem ID desde el link compartido.' },
        { status: 500 }
      );
    }

    const csvText = await downloadDriveItemContent(accessToken, itemId);

    return new NextResponse(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    console.error('[status-os][graph] error:', e?.message || e);
    return NextResponse.json(
      { error: 'Error al descargar el CSV vía Microsoft Graph.', detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
