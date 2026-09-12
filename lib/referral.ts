import { prisma } from "@/lib/prisma";

const REFERRAL_PERCENT = 10;

/**
 * Начисляет рефереру % от покупки приглашённого.
 * Вызывается после успешной покупки в /api/shop/buy.
 */
export async function payoutReferral(
  buyerId: string,
  spentMani: number,
  reason: string
): Promise<number> {
  const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
  if (!buyer || !buyer.referredBy) return 0;

  const bonus = Math.floor((spentMani * REFERRAL_PERCENT) / 100);
  if (bonus <= 0) return 0;

  const referrer = await prisma.user.findUnique({ where: { id: buyer.referredBy } });
  if (!referrer) return 0;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: referrer.id },
      data: {
        balance: { increment: bonus },
        referralEarnings: { increment: bonus },
      },
    }),
    prisma.transaction.create({
      data: {
        userId: referrer.id,
        amount: bonus,
        type: "referral",
        reason: `referral from ${buyer.username} (${reason})`,
      },
    }),
  ]);

  return bonus;
}
