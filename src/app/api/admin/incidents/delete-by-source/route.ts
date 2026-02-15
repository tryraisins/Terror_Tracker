import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifySession } from "@/lib/auth";
import Attack from "@/lib/models/Attack";

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { source } = await req.json();

    if (!source || typeof source !== "string") {
      return NextResponse.json(
        { error: "Invalid source provided" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Delete all incidents where ANY source's publisher matches the provided source
    const result = await Attack.deleteMany({
      "sources.publisher": source,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete by source error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
