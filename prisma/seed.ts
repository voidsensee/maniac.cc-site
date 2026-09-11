import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = "maniac_euphoretic";
  const adminPassword = "EuphoreticMethodOnTop";
  const adminInvite = "MANIAC-ROOT-2026";

  const existing = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existing) {
    console.log(`[seed] admin ${adminUsername} already exists`);
    return;
  }

  const hash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      password: hash,
      role: "admin",
      inviteCode: adminInvite,
    },
  });

  await prisma.invite.upsert({
    where: { code: adminInvite },
    update: {},
    create: {
      code: adminInvite,
      createdBy: admin.id,
      usedBy: admin.id,
      usedAt: new Date(),
    },
  });

  console.log(`[seed] admin created: ${adminUsername} / ${adminPassword}`);
  console.log(`[seed] admin invite: ${adminInvite}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
