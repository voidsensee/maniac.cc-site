import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role !== "admin")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { userId, role } = await req.json();
  if (!userId || !["user", "support", "admin"].includes(role)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await prisma.log.create({
    data: {
      userId: auth.uid,
      action: `admin_set_role_${role}`,
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
