import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    status: "ok",
    keyLoaded: !!key,
    keyPrefix: key ? key.slice(0, 20) + "..." : "NOT FOUND",
  });
}
