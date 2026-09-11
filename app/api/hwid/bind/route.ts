import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { hashHwid, isValidHwid } from "@/lib/hwid";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { hwid } = await req.json();
  if (!hwid || !isValidHwid(hwid)) {
    return NextResponse.json({ error: "invalid hwid" }, { status: 400 });
  }

  const hashed = hashHwid(hwid);
  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (user.hwid && user.hwid !== hashed) {
    return NextResponse.json({ error: "hwid already bound" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { hwid: hashed },
  });

  await prisma.log.create({
    data: {
      userId: user.id,
      action: "hwid_bind",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
      hwid: hashed,
    },
  });

  return NextResponse.json({ ok: true });
}
