import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isStaff = auth.role === "admin" || auth.role === "support";

  const tickets = await prisma.ticket.findMany({
    where: isStaff ? {} : { userId: auth.uid },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { username: true, role: true } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ ok: true, tickets });
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject || !body)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const ticket = await prisma.ticket.create({
    data: {
      userId: auth.uid,
      subject: String(subject).slice(0, 120),
      messages: {
        create: {
          userId: auth.uid,
          body: String(body).slice(0, 4000),
          isStaff: false,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, ticket });
}
