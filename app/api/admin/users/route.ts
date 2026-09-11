import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const isStaff = auth.role === "admin" || auth.role === "support";
  if (!isStaff) return NextResponse.json({ error: "forbidden" }, { status: 403 });

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
      subscriptionType: true,
      subscriptionUntil: true,
    },
  });

  return NextResponse.json({ ok: true, users });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isStaff = auth.role === "admin" || auth.role === "support";
  if (!isStaff) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { userId, action } = await req.json();
  if (!userId || !action)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  // Действия, доступные ТОЛЬКО админу
  const adminOnly = [
    "make_admin",
    "make_user",
    "make_support",
    "give_7d",
    "give_30d",
    "give_lifetime",
    "revoke_sub",
  ];
  if (adminOnly.includes(action) && auth.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Действия, доступные staff (admin + support)
  if (action === "ban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: true } });
  } else if (action === "unban") {
    await prisma.user.update({ where: { id: userId }, data: { banned: false } });
  } else if (action === "reset_hwid") {
    await prisma.user.update({ where: { id: userId }, data: { hwid: null } });
  } else if (action === "make_admin") {
    await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
  } else if (action === "make_user") {
    await prisma.user.update({ where: { id: userId }, data: { role: "user" } });
  } else if (action === "make_support") {
    await prisma.user.update({ where: { id: userId }, data: { role: "support" } });
  } else if (action === "give_7d") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: "7d",
        subscriptionUntil: new Date(Date.now() + 7 * 86400000),
      },
    });
  } else if (action === "give_30d") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: "30d",
        subscriptionUntil: new Date(Date.now() + 30 * 86400000),
      },
    });
  } else if (action === "give_lifetime") {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionType: "lifetime", subscriptionUntil: null },
    });
  } else if (action === "revoke_sub") {
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionType: null, subscriptionUntil: null },
    });
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
