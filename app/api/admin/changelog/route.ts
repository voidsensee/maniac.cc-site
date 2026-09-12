import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { version, title, body, type, published } = await req.json();
  if (!version || !title || !body) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const entry = await prisma.changelog.create({
    data: {
      version: String(version).slice(0, 32),
      title: String(title).slice(0, 200),
      body: String(body).slice(0, 10000),
      type: type || "update",
      published: published !== false,
      createdBy: auth.uid,
    },
  });

  if (auth.role !== "founder") {
    await prisma.log.create({
      data: { userId: auth.uid, action: `changelog_create:${entry.id}` },
    });
  }

  return NextResponse.json({ ok: true, entry });
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id, version, title, body, type, published } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const entry = await prisma.changelog.update({
    where: { id },
    data: {
      version: version !== undefined ? String(version).slice(0, 32) : undefined,
      title: title !== undefined ? String(title).slice(0, 200) : undefined,
      body: body !== undefined ? String(body).slice(0, 10000) : undefined,
      type: type !== undefined ? type : undefined,
      published: published !== undefined ? !!published : undefined,
    },
  });

  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isAdmin(auth.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await prisma.changelog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
