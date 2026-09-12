import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: auth.uid },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, transactions });
}
