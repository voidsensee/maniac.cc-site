import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password, invite } = await req.json();

    if (!username || !password || !invite) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }
    if (username.length < 3 || username.length > 32) {
      return NextResponse.json({ error: "invalid username" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "password too short" }, { status: 400 });
    }

    const inviteRow = await prisma.invite.findUnique({ where: { code: invite } });
    if (!inviteRow) {
      return NextResponse.json({ error: "invalid invite" }, { status: 403 });
    }
    if (inviteRow.usedBy) {
      return NextResponse.json({ error: "invite already used" }, { status: 403 });
    }
    if (inviteRow.expiresAt && inviteRow.expiresAt < new Date()) {
      return NextResponse.json({ error: "invite expired" }, { status: 403 });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json({ error: "username taken" }, { status: 409 });
    }

    const hash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, password: hash, inviteCode: invite },
    });

    await prisma.invite.update({
      where: { code: invite },
      data: { usedBy: user.id, usedAt: new Date() },
    });

    await prisma.log.create({
      data: {
        userId: user.id,
        action: "register",
        ip: req.headers.get("x-forwarded-for") ?? undefined,
      },
    });

    const token = signToken({ uid: user.id, username: user.username, role: user.role });

    return NextResponse.json({ ok: true, token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
