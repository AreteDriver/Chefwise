import { NextResponse } from 'next/server';
import handler from './handler';

export async function POST(request) {
  const body = await request.json();

  let responseData = null;
  let responseStatus = 200;

  const req = { method: 'POST', body };
  const res = {
    status(code) { responseStatus = code; return this; },
    json(data) { responseData = data; return this; },
  };

  await handler(req, res);

  return NextResponse.json(responseData, { status: responseStatus });
}
