import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { MANI_TO_DAYS } from "@/lib/currency";
import { payoutReferral } from "@/lib/referral";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { price } = await req.json();
  const item = MANI_TO_DAYS[price];
  if (!item) return NextResponse.json({ error: "invalid item" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: auth.uid } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (user.balance < price) {
    return NextResponse.json({ error: "insufficient balance" }, { status: 400 });
  }

  let newUntil: Date | null = null;
  let newType = user.subscriptionType || "none";

  if (item.days === -1) {
    newType = "gta_v_altv_lifetime";
    newUntil = null;
  } else {
    const base =
      user.subscriptionUntil && new Date(user.subscriptionUntil) > new Date()
        ? new Date(user.subscriptionUntil)
        : new Date();
    base.setDate(base.getDate() + item.days);
    newUntil = base;
    newType = item.days === 7 ? "gta_v_altv_7d" : "gta_v_altv_30d";
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.uid },
      data: {
        balance: { decrement: price },
        subscriptionType: newType,
        subscriptionUntil: newUntil,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: auth.uid,
        amount: -price,
        type: "purchase",
        reason: item.label,
      },
    }),
    prisma.log.create({
      data: { userId: auth.uid, action: `shop_buy:${price}` },
    }),
  ]);

  const bonus = await payoutReferral(auth.uid, price, item.label);

  return NextResponse.json({ ok: true, referralBonus: bonus });
}
