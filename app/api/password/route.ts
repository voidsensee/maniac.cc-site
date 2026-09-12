import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { oldPassword, newPassword } = await req.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: "password too short (min 6)" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ok = await verifyPassword(oldPassword, user.password);
  if (!ok) return NextResponse.json({ error: "wrong current password" }, { status: 400 });

  const hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: auth.uid }, data: { password: hash } });

  return NextResponse.json({ ok: true });
}
