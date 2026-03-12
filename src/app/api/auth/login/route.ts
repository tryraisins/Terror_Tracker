import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { applySecurityChecks, getClientIP, rateLimit } from "@/lib/security";

const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME?.trim();
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;

export async function POST(req: NextRequest) {
  try {
    const securityError = await applySecurityChecks(req, {
      rateLimit: 10,
      rateLimitWindow: 15 * 60_000, // 10 requests per 15 minutes per IP
    });
    if (securityError) return securityError;

    await dbConnect();

    // Check if any user exists, if not create default from env
    const count = await User.countDocuments();
    if (count === 0) {
      if (!DEFAULT_ADMIN_USERNAME || !DEFAULT_ADMIN_PASSWORD) {
        console.error(
          "DEFAULT_ADMIN_USERNAME/DEFAULT_ADMIN_PASSWORD are not set. Cannot bootstrap admin user."
        );
        return NextResponse.json(
          { error: "Admin bootstrap is not configured" },
          { status: 500 }
        );
      }

      const hashedPassword = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      await User.create({
        username: DEFAULT_ADMIN_USERNAME,
        passwordHash: hashedPassword,
        role: "admin",
      });
      console.log("Default admin user created from environment.");
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Additional rate limit per username to slow brute-force attempts
    const ip = getClientIP(req);
    const userKey = `${ip}:${String(username).toLowerCase()}`;
    const userLimit = await rateLimit(userKey, 5, 15 * 60_000);
    if (!userLimit.allowed) {
      const res = NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(Math.ceil(userLimit.resetIn / 1000)));
      return res;
    }

    const user = await User.findOne({ username });

    if (!user) {
      // Simulate verification time to prevent timing attacks
      await verifyPassword("dummy", "$2b$12$DummyHashStringToSimulateWorkFactor12345");
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await createSession(user._id.toString(), user.username);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
