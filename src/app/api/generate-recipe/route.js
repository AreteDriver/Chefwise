import { NextResponse } from 'next/server';
import wrappedHandler from './handler';

export async function POST(request) {
  const body = await request.json();

  let responseData = null;
  let responseStatus = 200;

  const req = {
    method: 'POST',
    body,
    headers: Object.fromEntries(request.headers.entries()),
  };

  const res = {
    status(code) { responseStatus = code; return this; },
    json(data) { responseData = data; return this; },
    send(data) { responseData = data; return this; },
  };

  await wrappedHandler(req, res);

  if (typeof responseData === 'string') {
    return new Response(responseData, { status: responseStatus });
  }
  return NextResponse.json(responseData, { status: responseStatus });
}
