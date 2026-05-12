import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password, orgName } = await req.json();

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    // Create account + user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: orgName || `${name}'s Organization`,
          slug:
            email
              .split("@")[0]
              .replace(/[^a-z0-9]/g, "") +
            "-" +
            Date.now().toString(36),
          plan: "FREE",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: await bcrypt.hash(password, 12),
          role: "OWNER",
          accountId: account.id,
        },
      });
      return { account, user };
    });

    return NextResponse.json({ success: true, userId: result.user.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}