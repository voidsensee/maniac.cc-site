import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import crypto from "crypto";

function isAdmin(role: string) {
  return role === "admin" || role === "support";
}

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, invites });
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const subscriptionType: string = body.subscriptionType ?? "none";
  const expiresAt: string | null = body.expiresAt ?? null;

  const code =
    "MANIAC-" +
    crypto.randomBytes(6).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");

  const invite = await prisma.invite.create({
    data: {
      code,
      createdBy: auth.uid,
      subscriptionType,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await prisma.log.create({
    data: {
      userId: auth.uid,
      action: "invite_create",
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    },
  });

  return NextResponse.json({ ok: true, invite });
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await prisma.invite.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
