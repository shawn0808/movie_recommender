const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.user.deleteMany({});
  console.log(`Deleted ${deleted.count} user(s)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
