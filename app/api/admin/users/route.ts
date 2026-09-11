import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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
    },
  });

  return NextResponse.json({ ok: true, users });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { userId, action } = await req.json();
  if (!userId || !action) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: true } });
  } else if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: false } });
  } else if (action === "reset_hwid") {
    await prisma.user.update({ where: { id: userId }, data: { hwid: null } });
  } else if (action === "make_admin") {
    await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  await prisma.log.create({
    data: {
      userId: auth.uid,
      action: `admin_${action}`,
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
