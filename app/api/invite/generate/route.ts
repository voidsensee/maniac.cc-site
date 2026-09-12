import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

const COOLDOWN_DAYS = 14;

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (user.banned) return NextResponse.json({ error: "banned" }, { status: 403 });

  const now = new Date();
  if (user.lastInviteGeneratedAt) {
    const elapsed = now.getTime() - new Date(user.lastInviteGeneratedAt).getTime();
    const cooldown = COOLDOWN_DAYS * 86400000;
    if (elapsed < cooldown) {
      const leftDays = Math.ceil((cooldown - elapsed) / 86400000);
      return NextResponse.json(
        { error: `cooldown: ${leftDays} day(s) left` },
        { status: 429 }
      );
    }
  }

  const code =
    "MANIAC-" +
    crypto.randomBytes(6).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");

  const invite = await prisma.invite.create({
    data: {
      code,
      createdBy: auth.uid,
      subscriptionType: "none",
      expiresAt: new Date(now.getTime() + 30 * 86400000),
    },
  });

  await prisma.user.update({
    where: { id: auth.uid },
    data: { lastInviteGeneratedAt: now },
  });

  await prisma.log.create({
    data: { userId: auth.uid, action: `invite_generate:${code}` },
  });

  return NextResponse.json({ ok: true, invite });
}
