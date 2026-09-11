import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (user.role !== "admin" && user.hwidResets >= 1) {
    return NextResponse.json({ error: "reset limit reached" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { hwid: null, hwidResets: user.hwidResets + 1 },
  });

  await prisma.log.create({
    data: {
      userId: user.id,
      action: "hwid_reset",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
