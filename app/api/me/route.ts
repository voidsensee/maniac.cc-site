import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.uid },
    select: {
      id: true,
      username: true,
      role: true,
      hwid: true,
      banned: true,
      createdAt: true,
      lastLogin: true,
      lastIp: true,
      hwidResets: true,
      subscriptionType: true,
      subscriptionUntil: true,
    },
  });

  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, user });
}
