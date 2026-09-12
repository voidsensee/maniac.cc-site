import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password, invite } = await req.json();
  if (!username || !password || !invite) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (username.length < 3 || username.length > 32) {
    return NextResponse.json({ error: "username 3-32 chars" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: "username: letters, digits, underscore only" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "password min 6 chars" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "username taken" }, { status: 409 });
  }

  const inviteRow = await prisma.invite.findUnique({ where: { code: invite } });
  if (!inviteRow) {
    return NextResponse.json({ error: "invalid invite" }, { status: 400 });
  }
  if (inviteRow.usedBy) {
    return NextResponse.json({ error: "invite already used" }, { status: 400 });
  }
  if (inviteRow.expiresAt && new Date(inviteRow.expiresAt) < new Date()) {
    return NextResponse.json({ error: "invite expired" }, { status: 400 });
  }

  const hash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      password: hash,
      referredBy: inviteRow.createdBy || null,
    },
  });

  await prisma.invite.update({
    where: { code: invite },
    data: { usedBy: username, usedById: user.id, usedAt: new Date() },
  });

  await prisma.log.create({
    data: { userId: user.id, action: `register:${invite}` },
  });

  const token = signToken({ uid: user.id, username: user.username, role: user.role });
  return NextResponse.json({ ok: true, token });
}
