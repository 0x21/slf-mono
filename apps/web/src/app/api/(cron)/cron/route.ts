/* eslint-disable */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (
    req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(null, { status: 401 });
  }
  const body = await req.json();
  console.log(body);
  return NextResponse.json({ success: true }, { status: 200 });
}
