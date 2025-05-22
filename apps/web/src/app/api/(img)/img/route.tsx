/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

// export const runtime = "edge";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const size = Number(searchParams.get("size") ?? "500");

  if (!text) {
    return NextResponse.json({ status: 400 });
  }

  return new ImageResponse(
    <img alt={text} height={size} src={text} width={size} />,
    {
      width: size,
      height: size,
    },
  );
}
