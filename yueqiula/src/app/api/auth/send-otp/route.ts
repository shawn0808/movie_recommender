import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, OTP_EXPIRY_MINUTES } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { sendOtpSms } from "@/lib/sms";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/; // China mobile

export async function POST(request: Request) {
  try {
    const { identifier, type, purpose = "register" } = await request.json();
    if (!identifier || !type || !["email", "phone"].includes(type)) {
      return NextResponse.json(
        { error: "参数错误" },
        { status: 400 }
      );
    }
    const trimmed = String(identifier).trim();
    if (type === "email" && !EMAIL_REGEX.test(trimmed)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }
    if (type === "phone" && !PHONE_REGEX.test(trimmed)) {
      return NextResponse.json(
        { error: "手机号格式不正确" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findFirst({
      where:
        type === "email"
          ? { email: trimmed }
          : { phone: trimmed },
    });
    if (purpose === "register" && existing) {
      return NextResponse.json(
        { error: type === "email" ? "该邮箱已注册" : "该手机号已注册" },
        { status: 400 }
      );
    }
    if (purpose === "login" && !existing) {
      return NextResponse.json(
        { error: type === "email" ? "该邮箱未注册" : "该手机号未注册" },
        { status: 400 }
      );
    }
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await prisma.otpVerification.deleteMany({
      where: { identifier: trimmed, type },
    });
    await prisma.otpVerification.create({
      data: { identifier: trimmed, code, type, expiresAt },
    });
    const sent =
      type === "email"
        ? await sendOtpEmail(trimmed, code)
        : await sendOtpSms(trimmed, code);
    if (!sent) {
      return NextResponse.json(
        { error: "验证码发送失败，请稍后重试" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    const message = error instanceof Error ? error.message : "发送失败";
    return NextResponse.json(
      { error: process.env.NODE_ENV === "development" ? message : "发送失败" },
      { status: 500 }
    );
  }
}
