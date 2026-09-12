// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAMES = [
  "Firefox Installer.exe",
  "ChromeSetup.exe",
  "DiscordSetup.exe",
  "vlc-3.0.20-win64.exe",
  "ZoomInstaller.exe",
  "SteamSetup.exe",
  "OBS-Studio-30.1.2-Full-Installer.exe",
  "Telegram Desktop.exe",
  "Notepad++ Installer.exe",
  "Audacity Installer.exe",
  "GIMP-2.10.38-Setup.exe",
  "VSCodeUserSetup-x64.exe",
  "Git-2.45.2-64-bit.exe",
  "Everything-Setup.exe",
  "qBittorrent-4.6.5.exe",
];

export async function GET(req: NextRequest) {
  // 1. Auth — тот же, что в /api/me
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Проверка юзера: бан + подписка
  const user = await prisma.user.findUnique({
    where: { id: auth.uid },
    select: {
      banned: true,
      subscriptionUntil: true,
      subscriptionType: true,
      hwid: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (user.banned) {
    return NextResponse.json({ error: "banned" }, { status: 403 });
  }

  if (!user.hwid) {
    return NextResponse.json({ error: "hwid not bound" }, { status: 403 });
  }

  // Подписка: если у тебя subscriptionUntil = null — значит пожизненно/нет инфо. Реши:
  // Вариант A: null = нет подписки (жёстко)
  // Вариант B: null = ок, не проверяем (мягко)
  // Сейчас — мягко: проверяем только если дата есть.
  if (user.subscriptionUntil && new Date(user.subscriptionUntil) < new Date()) {
    return NextResponse.json({ error: "subscription expired" }, { status: 403 });
  }

  // 3. Рандомное имя
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];

  // 4. Читаем loader
  const filePath = path.join(process.cwd(), "private", "loaders", "loader.exe");
  let data: Buffer;
  try {
    data = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "loader not found" }, { status: 500 });
  }

  // 5. Отдаём
  const asciiName = name.replace(/[^\x20-\x7E]/g, "_");
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/x-msdownload",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
