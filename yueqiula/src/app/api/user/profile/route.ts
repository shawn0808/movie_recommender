import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { ntrpLevel, gender, birthYear } = body;

    const updates: Record<string, unknown> = {};
    if (ntrpLevel != null && ntrpLevel !== "") {
      const ntrp = parseFloat(String(ntrpLevel));
      if (!isNaN(ntrp) && ntrp >= 1 && ntrp <= 7) {
        updates.ntrpLevel = ntrp;
      }
    }
    if (gender != null && gender !== "") {
      updates.gender = String(gender);
    }
    if (birthYear != null && birthYear !== "") {
      const year = parseInt(String(birthYear), 10);
      if (!isNaN(year) && year >= 1920 && year <= 2015) {
        updates.birthYear = year;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "请至少填写一项" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
