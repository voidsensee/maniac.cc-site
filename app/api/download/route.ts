import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
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

const LOADER_ZIP_URL =
  "https://github.com/voidsensee/maniac.cc-site/releases/download/untagged-7415eab3eb973060b34f/loader.zip";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.uid },
    select: { banned: true, subscriptionUntil: true, hwid: true },
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
  if (user.subscriptionUntil && new Date(user.subscriptionUntil) < new Date()) {
    return NextResponse.json({ error: "subscription expired" }, { status: 403 });
  }

  const upstream = await fetch(LOADER_ZIP_URL, {
    cache: "no-store",
    redirect: "follow",
  });
  if (!upstream.ok) {
    return NextResponse.json({ error: "loader unavailable" }, { status: 502 });
  }

  const zipBuf = Buffer.from(await upstream.arrayBuffer());
  let exeBuf: Buffer | null = null;
  try {
    const zip = new AdmZip(zipBuf);
    const entry = zip
      .getEntries()
      .find((e) => !e.isDirectory && e.entryName.toLowerCase().endsWith(".exe"));
    if (entry) exeBuf = entry.getData();
  } catch {
    return NextResponse.json({ error: "corrupt archive" }, { status: 500 });
  }

  if (!exeBuf) {
    return NextResponse.json({ error: "exe not found in archive" }, { status: 500 });
  }

  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const asciiName = name.replace(/[^\x20-\x7E]/g, "_");

  // ВАЖНО: Buffer → Uint8Array, иначе TS ругается на BodyInit
  const body = new Uint8Array(exeBuf);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/x-msdownload",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
