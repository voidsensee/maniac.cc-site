import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let status = await prisma.status.findUnique({ where: { id: "singleton" } });
  if (!status) {
    status = await prisma.status.create({
      data: { id: "singleton", state: "undetected" },
    });
  }
  return NextResponse.json({ ok: true, status });
}
