import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const COOLDOWN_DAYS = 14;

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const invites = await prisma.invite.findMany({
    where: { createdBy: auth.uid },
    orderBy: { createdAt: "desc" },
  });

  let canGenerateInMs = 0;
  if (user.lastInviteGeneratedAt) {
    const next = new Date(user.lastInviteGeneratedAt).getTime() + COOLDOWN_DAYS * 86400000;
    canGenerateInMs = Math.max(0, next - Date.now());
  }

  return NextResponse.json({
    ok: true,
    invites,
    canGenerate: canGenerateInMs === 0,
    canGenerateInMs,
    referralEarnings: user.referralEarnings,
  });
}
