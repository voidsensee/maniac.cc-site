import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { hashHwid, isValidHwid } from "@/lib/hwid";

export async function POST(req: NextRequest) {
  try {
    const { code, username, password, hwid } = await req.json();

    if (!code || !username || !password) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // Ищем инвайт
    const invite = await prisma.invite.findUnique({ where: { code } });
    if (!invite) {
      return NextResponse.json({ error: "invalid invite" }, { status: 404 });
    }
    if (invite.usedBy) {
      return NextResponse.json({ error: "invite already used" }, { status: 403 });
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "invite expired" }, { status: 403 });
    }

    // Проверяем что юзернейм свободен
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "username taken" }, { status: 409 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const hashedHwid = hwid && isValidHwid(hwid) ? hashHwid(hwid) : null;

    // Считаем срок подписки
    let subscriptionUntil: Date | null = null;
    if (invite.subscriptionType && invite.subscriptionType !== "none") {
      subscriptionUntil = new Date();
      subscriptionUntil.setDate(subscriptionUntil.getDate() + 30); // 30 дней
    }

    // Создаём юзера
    const user = await prisma.user.create({
      data: {
        username,
        password: await hashPassword(password),
        hwid: hashedHwid,
        inviteCode: code,
        subscriptionType: invite.subscriptionType ?? "none",
        subscriptionUntil,
        lastLogin: new Date(),
        lastIp: ip,
      },
    });

    // Помечаем инвайт использованным
    await prisma.invite.update({
      where: { id: invite.id },
      data: { usedBy: user.id, usedAt: new Date() },
    });

    await prisma.log.create({
      data: { userId: user.id, action: "register", ip, hwid: hashedHwid ?? undefined },
    });

    const token = signToken({ uid: user.id, username: user.username, role: user.role });

    return NextResponse.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        subscriptionType: user.subscriptionType,
        subscriptionUntil: user.subscriptionUntil,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
