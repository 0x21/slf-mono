/* eslint-disable */

/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
// @ts-ignore
import qrcode from "yaqrcode";

// export const runtime = "edge";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const size = Number(searchParams.get("size") ?? "500");

  if (!text) {
    return NextResponse.json({ status: 400 });
  }

  const base64 = qrcode(text, {
    size: size,
  });

  return new ImageResponse(
    <img alt={text} height={size} src={base64} width={size} />,
    {
      width: size,
      height: size,
    },
  );
}
