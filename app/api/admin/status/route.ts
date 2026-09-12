import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { STATUS_LIST } from "@/lib/status";

export async function PATCH(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { state, message } = await req.json();
  const valid = STATUS_LIST.some((s) => s.value === state);
  if (!valid) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }

  const status = await prisma.status.upsert({
    where: { id: "singleton" },
    update: { state, message: message || null, updatedBy: auth.uid },
    create: { id: "singleton", state, message: message || null, updatedBy: auth.uid },
  });

  if (auth.role !== "founder") {
    await prisma.log.create({
      data: { userId: auth.uid, action: `status_change:${state}` },
    });
  }

  return NextResponse.json({ ok: true, status });
}
