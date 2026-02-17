const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/delete-user.cjs <email|phone>");
    process.exit(1);
  }

  const where = arg.includes("@") ? { email: arg } : { phone: arg };
  const deleted = await prisma.user.deleteMany({ where });
  const label = where.email ? "email" : "phone";
  console.log(deleted.count > 0 ? `Deleted user (${label}): ${arg}` : `No user found: ${arg}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
