import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Attack from "@/lib/models/Attack";
import { applySecurityChecks, setCORSHeaders } from "@/lib/security";
import { PUBLIC_ATTACK_FIELDS } from "@/lib/incident-public";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const securityError = await applySecurityChecks(req, { rateLimit: 100, rateLimitWindow: 60_000 });
  if (securityError) return securityError;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return setCORSHeaders(NextResponse.json({ error: "Record not found" }, { status: 404 }));
  try {
    await connectDB();
    const attack = await Attack.findOne({ _id: id, _deleted: { $ne: true } }).select(PUBLIC_ATTACK_FIELDS).lean();
    if (!attack) return setCORSHeaders(NextResponse.json({ error: "Record not found" }, { status: 404 }));
    return setCORSHeaders(NextResponse.json({ attack }));
  } catch (error) {
    console.error("GET /api/attacks/[id] error:", error);
    return setCORSHeaders(NextResponse.json({ error: "Unable to load record" }, { status: 500 }));
  }
}
