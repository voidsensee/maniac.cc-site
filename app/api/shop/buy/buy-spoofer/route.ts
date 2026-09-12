import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { payoutReferral } from "@/lib/referral";

const PRICE = 500;

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (user.balance < PRICE) {
    return NextResponse.json({ error: "insufficient balance" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.uid },
      data: { balance: { decrement: PRICE } },
    }),
    prisma.transaction.create({
      data: {
        userId: auth.uid,
        amount: -PRICE,
        type: "purchase",
        reason: "Spoofer for Majestic RP",
      },
    }),
    prisma.log.create({
      data: { userId: auth.uid, action: `shop_buy:spoofer` },
    }),
  ]);

  const bonus = await payoutReferral(auth.uid, PRICE, "Spoofer");

  return NextResponse.json({ ok: true, referralBonus: bonus });
}
