import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  try {
    const buildId = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
    return NextResponse.json({ buildId }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ buildId: "dev" }, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
