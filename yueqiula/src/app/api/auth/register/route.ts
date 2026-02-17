import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, identifier, otp, password, name, ntrpLevel, gender, birthYear } = body;
    if (!type || !identifier || !otp || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "参数错误" },
        { status: 400 }
      );
    }
    const trimmed = String(identifier).trim();

    const ntrp = ntrpLevel != null && ntrpLevel !== "" ? parseFloat(String(ntrpLevel)) : NaN;
    if (isNaN(ntrp) || ntrp < 1 || ntrp > 7) {
      return NextResponse.json(
        { error: "请选择网球水平 (NTRP)" },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.otpVerification.findFirst({
      where: { identifier: trimmed, type },
      orderBy: { createdAt: "desc" },
    });
    if (!otpRecord || otpRecord.code !== String(otp).trim()) {
      return NextResponse.json(
        { error: "验证码错误" },
        { status: 400 }
      );
    }
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }
    if (type === "email") {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "密码至少6位" },
          { status: 400 }
        );
      }
      const hashed = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: trimmed,
          password: hashed,
          name: name || null,
          ntrpLevel: new Prisma.Decimal(ntrp),
          gender: gender || null,
          birthYear: birthYear ? parseInt(birthYear, 10) : null,
        },
      });
      await prisma.otpVerification.deleteMany({
        where: { identifier: trimmed, type },
      });
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        type: "email",
      });
    } else {
      const user = await prisma.user.create({
        data: {
          phone: trimmed,
          name: name || null,
          ntrpLevel: new Prisma.Decimal(ntrp),
          gender: gender || null,
          birthYear: birthYear ? parseInt(birthYear, 10) : null,
        },
      });
      // Don't delete OTP - client will use it for signIn("phone", { phone, otp })
      return NextResponse.json({
        id: user.id,
        phone: user.phone,
        name: user.name,
        type: "phone",
      });
    }
  } catch (error: unknown) {
    console.error("Register error:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.code === "P2002") {
        const target = prismaError.meta?.target;
        if (target?.includes("email")) {
          return NextResponse.json(
            { error: "该邮箱已注册" },
            { status: 400 }
          );
        }
        if (target?.includes("phone")) {
          return NextResponse.json(
            { error: "该手机号已注册" },
            { status: 400 }
          );
        }
      }
    }
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    );
  }
}
