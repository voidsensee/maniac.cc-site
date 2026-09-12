import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword } from "@/lib/auth";

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
      balance: true,
    },
  });

  return NextResponse.json({ ok: true, users });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isStaff = auth.role === "admin" || auth.role === "support";
  if (!isStaff) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, action } = body;
  if (!userId || !action)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const adminOnly = [
    "make_admin",
    "make_user",
    "make_support",
    "give_7d",
    "give_30d",
    "give_lifetime",
    "revoke_sub",
    "change_username",
    "change_password",
    "add_balance",
    "remove_balance",
    "set_balance",
  ];
  if (adminOnly.includes(action) && auth.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
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
      const u = await prisma.user.findUnique({ where: { id: userId } });
      const base =
        u?.subscriptionUntil && new Date(u.subscriptionUntil) > new Date()
          ? new Date(u.subscriptionUntil)
          : new Date();
      base.setDate(base.getDate() + 7);
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionType: "gta_v_altv_7d", subscriptionUntil: base },
      });
    } else if (action === "give_30d") {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      const base =
        u?.subscriptionUntil && new Date(u.subscriptionUntil) > new Date()
          ? new Date(u.subscriptionUntil)
          : new Date();
      base.setDate(base.getDate() + 30);
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionType: "gta_v_altv_30d", subscriptionUntil: base },
      });
    } else if (action === "give_lifetime") {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionType: "gta_v_altv_lifetime", subscriptionUntil: null },
      });
    } else if (action === "revoke_sub") {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionType: "none", subscriptionUntil: null },
      });
    } else if (action === "change_username") {
      const { username } = body;
      if (!username || username.length < 3 || username.length > 32) {
        return NextResponse.json(
          { error: "username must be 3-32 chars" },
          { status: 400 }
        );
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { error: "letters, digits, underscore only" },
          { status: 400 }
        );
      }
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== userId) {
        return NextResponse.json({ error: "username already taken" }, { status: 409 });
      }
      await prisma.user.update({ where: { id: userId }, data: { username } });
    } else if (action === "change_password") {
      const { password } = body;
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "password min 6 chars" }, { status: 400 });
      }
      const hash = await hashPassword(password);
      await prisma.user.update({ where: { id: userId }, data: { password: hash } });
    } else if (action === "add_balance") {
      const amount = Number(body.amount);
      if (!amount || amount <= 0 || amount > 1000000) {
        return NextResponse.json({ error: "invalid amount" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });
      await prisma.transaction.create({
        data: {
          userId,
          amount,
          type: "admin_add",
          reason: body.reason || "admin credit",
          adminId: auth.uid,
        },
      });
    } else if (action === "remove_balance") {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "invalid amount" }, { status: 400 });
      }
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (!u || u.balance < amount) {
        return NextResponse.json({ error: "insufficient balance" }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } },
      });
      await prisma.transaction.create({
        data: {
          userId,
          amount: -amount,
          type: "admin_remove",
          reason: body.reason || "admin debit",
          adminId: auth.uid,
        },
      });
    } else if (action === "set_balance") {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount < 0 || amount > 1000000) {
        return NextResponse.json({ error: "invalid amount" }, { status: 400 });
      }
      const u = await prisma.user.findUnique({ where: { id: userId } });
      const diff = amount - (u?.balance || 0);
      await prisma.user.update({
        where: { id: userId },
        data: { balance: amount },
      });
      if (diff !== 0) {
        await prisma.transaction.create({
          data: {
            userId,
            amount: diff,
            type: "admin_set",
            reason: `set to ${amount}`,
            adminId: auth.uid,
          },
        });
      }
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "db error", detail: String(e?.message || e) },
      { status: 500 }
    );
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
