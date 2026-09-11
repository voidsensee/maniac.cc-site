import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { hashHwid, isValidHwid } from "@/lib/hwid";

export async function POST(req: NextRequest) {
  try {
    const { username, password, hwid } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }
    if (user.banned) {
      return NextResponse.json({ error: "banned" }, { status: 403 });
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;

    if (hwid && isValidHwid(hwid)) {
      const hashed = hashHwid(hwid);
      if (!user.hwid) {
        await prisma.user.update({
          where: { id: user.id },
          data: { hwid: hashed, lastLogin: new Date(), lastIp: ip },
        });
        await prisma.log.create({
          data: { userId: user.id, action: "hwid_bind", ip, hwid: hashed },
        });
      } else if (user.hwid !== hashed) {
        return NextResponse.json({ error: "hwid mismatch" }, { status: 403 });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date(), lastIp: ip },
        });
      }
    }

    await prisma.log.create({
      data: { userId: user.id, action: "login", ip },
    });

    const token = signToken({ uid: user.id, username: user.username, role: user.role });

    return NextResponse.json({
      ok: true,
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
