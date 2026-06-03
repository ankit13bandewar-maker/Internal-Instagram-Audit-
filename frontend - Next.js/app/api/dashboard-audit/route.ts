import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Proxy handler for the FastAPI dashboard‑intelligence endpoint.
// The frontend calls `/api/dashboard-intelligence?profile_url=...` which forwards the request
// to the FastAPI server. In development we fall back to a local FastAPI instance.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const profileUrl = url.searchParams.get('profile_url');

  if (!profileUrl) {
    return NextResponse.json({ error: 'Missing profile_url query parameter' }, { status: 400 });
  }

  let backendUrl = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
  if (backendUrl && !backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
    backendUrl = `http://${backendUrl}`;
  }
  console.log('Proxying to FastAPI URL:', backendUrl);

  try {
    const resp = await fetch(`${backendUrl}/api/dashboard-audit?profile_url=${encodeURIComponent(profileUrl)}`);
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
    console.error('Error contacting FastAPI:', err);
    return NextResponse.json({ error: 'FastAPI unreachable', details: err.message }, { status: 502 });
  }
}

export const runtime = 'nodejs'; // Use nodejs runtime for local backend calls
