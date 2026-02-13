import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import { hashPassword, verifyPassword, createSession } from "@/lib/auth";

const DEFAULT_USER = {
  username: "TryRaisins",
  password: "K!ac?##16@",
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Check if any user exists, if not create default
    const count = await User.countDocuments();
    if (count === 0) {
      const hashedPassword = await hashPassword(DEFAULT_USER.password);
      await User.create({
        username: DEFAULT_USER.username,
        passwordHash: hashedPassword,
        role: "admin",
      });
      console.log("Default admin user created.");
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
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
