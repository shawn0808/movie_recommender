import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const {
      venue,
      startTime,
      durationMinutes = 60,
      maxParticipants = 4,
      ntrpMin,
      ntrpMax,
      sport = "tennis",
      joinPolicy = "open",
    } = body;

    if (!venue?.name || !venue?.address || !venue?.lat || !venue?.lng) {
      return NextResponse.json(
        { error: "请选择场地" },
        { status: 400 }
      );
    }
    if (!startTime) {
      return NextResponse.json(
        { error: "请选择日期和时间" },
        { status: 400 }
      );
    }

    const nMin = parseFloat(ntrpMin);
    const nMax = parseFloat(ntrpMax);
    if (isNaN(nMin) || isNaN(nMax) || nMin < 1 || nMax > 7 || nMin > nMax) {
      return NextResponse.json(
        { error: "请选择有效的 NTRP 范围" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime()) || start < new Date()) {
      return NextResponse.json(
        { error: "请选择未来的时间" },
        { status: 400 }
      );
    }

    const [lng, lat] = [parseFloat(venue.lng), parseFloat(venue.lat)];
    if (isNaN(lng) || isNaN(lat)) {
      return NextResponse.json(
        { error: "场地坐标无效" },
        { status: 400 }
      );
    }

    let venueId: string;
    if (venue.id) {
      const existing = await prisma.venue.findFirst({
        where: { amapPlaceId: venue.id },
      });
      venueId = existing?.id ?? (await prisma.venue.create({
        data: {
          name: venue.name,
          address: venue.address,
          lat: new Prisma.Decimal(lat),
          lng: new Prisma.Decimal(lng),
          amapPlaceId: venue.id,
        },
      })).id;
    } else {
      venueId = (await prisma.venue.create({
        data: {
          name: venue.name,
          address: venue.address,
          lat: new Prisma.Decimal(lat),
          lng: new Prisma.Decimal(lng),
        },
      })).id;
    }

    const game = await prisma.game.create({
      data: {
        venueId,
        hostId: session.user.id,
        sport,
        ntrpMin: new Prisma.Decimal(nMin),
        ntrpMax: new Prisma.Decimal(nMax),
        startTime: start,
        durationMinutes: Math.min(180, Math.max(30, durationMinutes)),
        maxParticipants: Math.min(20, Math.max(2, maxParticipants)),
        joinPolicy: joinPolicy === "approval_required" ? "approval_required" : "open",
      },
    });

    await prisma.gameParticipant.create({
      data: {
        gameId: game.id,
        userId: session.user.id,
        role: "host",
        status: "confirmed",
      },
    });

    return NextResponse.json({ id: game.id });
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json(
      { error: "创建失败" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport");
    const ntrpMin = searchParams.get("ntrpMin");
    const ntrpMax = searchParams.get("ntrpMax");

    const games = await prisma.game.findMany({
      where: {
        status: "active",
        ...(sport && sport !== "all" && { sport }),
        ...(ntrpMin && {
          ntrpMax: { gte: parseFloat(ntrpMin) },
        }),
        ...(ntrpMax && {
          ntrpMin: { lte: parseFloat(ntrpMax) },
        }),
      },
      include: {
        venue: true,
        host: {
          select: { id: true, name: true, ntrpLevel: true, avatarUrl: true },
        },
        participants: true,
      },
      orderBy: { startTime: "asc" },
    });

    const gamesWithSpots = games.map((game) => ({
      ...game,
      ntrpMin: Number(game.ntrpMin),
      ntrpMax: Number(game.ntrpMax),
      venue: {
        ...game.venue,
        lat: Number(game.venue.lat),
        lng: Number(game.venue.lng),
      },
      spotsLeft: Math.max(
        0,
        game.maxParticipants - game.participants.filter((p) => p.status === "confirmed").length
      ),
      spotsFilled: game.participants.filter((p) => p.status === "confirmed").length,
    }));

    return NextResponse.json(gamesWithSpots);
  } catch (error) {
    console.error("Failed to fetch games:", error);
    return NextResponse.json(
      { error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}
