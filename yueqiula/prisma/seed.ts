import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@yueqiula.com" },
    update: {},
    create: {
      email: "demo@yueqiula.com",
      name: "演示用户",
      ntrpLevel: 3.5,
    },
  });

  const venue = await prisma.venue.upsert({
    where: { id: "seed-venue-1" },
    update: {},
    create: {
      id: "seed-venue-1",
      name: "卢湾体育馆网球场",
      address: "上海市黄浦区肇嘉浜路128号",
      lat: 31.2142,
      lng: 121.4673,
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(18, 0, 0, 0);

  await prisma.game.upsert({
    where: { id: "seed-game-1" },
    update: {},
    create: {
      id: "seed-game-1",
      venueId: venue.id,
      hostId: user.id,
      sport: "tennis",
      ntrpMin: 3.0,
      ntrpMax: 4.0,
      startTime: tomorrow,
      durationMinutes: 90,
      maxParticipants: 4,
      joinPolicy: "open",
    },
  });

  await prisma.game.upsert({
    where: { id: "seed-game-2" },
    update: {},
    create: {
      id: "seed-game-2",
      venueId: venue.id,
      hostId: user.id,
      sport: "tennis",
      ntrpMin: 2.5,
      ntrpMax: 3.5,
      startTime: dayAfter,
      durationMinutes: 60,
      maxParticipants: 4,
      joinPolicy: "open",
    },
  });

  console.log("Seed done: 1 user, 1 venue, 2 games");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
