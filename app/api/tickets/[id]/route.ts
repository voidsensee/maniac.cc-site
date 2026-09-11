import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, username: true, role: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true, role: true } } },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isStaff = auth.role === "admin" || auth.role === "support";
  if (!isStaff && ticket.userId !== auth.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, ticket });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { body } = await req.json();
  if (!body) return NextResponse.json({ error: "missing body" }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isStaff = auth.role === "admin" || auth.role === "support";
  if (!isStaff && ticket.userId !== auth.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (ticket.status === "closed") {
    return NextResponse.json({ error: "ticket closed" }, { status: 400 });
  }

  const msg = await prisma.message.create({
    data: {
      ticketId: ticket.id,
      userId: auth.uid,
      body: String(body).slice(0, 4000),
      isStaff,
    },
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, message: msg });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const isStaff = auth.role === "admin" || auth.role === "support";
  if (!isStaff) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { status } = await req.json();
  if (status !== "open" && status !== "closed") {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ ok: true, ticket });
}
