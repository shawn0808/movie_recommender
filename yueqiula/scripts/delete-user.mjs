import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/delete-user.mjs <email>");
  process.exit(1);
}

const deleted = await prisma.user.deleteMany({
  where: { email },
});
console.log(deleted.count > 0 ? `Deleted user: ${email}` : `No user found: ${email}`);
await prisma.$disconnect();
