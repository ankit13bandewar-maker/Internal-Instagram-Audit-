import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  let backendUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
  if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    backendUrl = `http://${backendUrl}`;
  }

  const { username } = await params;

  try {
    const resp = await fetch(`${backendUrl}/api/history-snapshot/${encodeURIComponent(username)}`, { cache: 'no-store' });
    const status = resp.status;
    const contentType = resp.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await resp.json();
    } else {
      data = await resp.text();
    }
    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error('Error contacting FastAPI history-snapshot:', err);
    return NextResponse.json({ error: 'FastAPI unreachable', details: err.message }, { status: 502 });
  }
}

export const runtime = 'nodejs';
