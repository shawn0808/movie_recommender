import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import WeChat from "@/lib/auth-wechat";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.WECHAT_ENABLED === "true" &&
    process.env.WECHAT_APP_ID &&
    process.env.WECHAT_APP_SECRET
      ? [
          WeChat({
            clientId: process.env.WECHAT_APP_ID,
            clientSecret: process.env.WECHAT_APP_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.password) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
    CredentialsProvider({
      id: "phone",
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        otp: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;
        const otpRecord = await prisma.otpVerification.findFirst({
          where: { identifier: credentials.phone.trim(), type: "phone" },
          orderBy: { createdAt: "desc" },
        });
        if (!otpRecord || otpRecord.code !== credentials.otp.trim()) return null;
        if (new Date() > otpRecord.expiresAt) return null;
        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone.trim() },
        });
        if (!user) return null;
        await prisma.otpVerification.deleteMany({
          where: { identifier: credentials.phone.trim(), type: "phone" },
        });
        return {
          id: user.id,
          email: user.phone,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "wechat" && user?.id) {
        const existing = await prisma.user.findUnique({
          where: { wechatId: user.id },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              wechatId: user.id,
              name: user.name || null,
              avatarUrl: user.image || null,
            },
          });
          return "/auth/complete-profile";
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "wechat" && user.id) {
          const dbUser = await prisma.user.findUnique({
            where: { wechatId: user.id },
          });
          if (dbUser) {
            token.id = dbUser.id;
          }
        } else {
          token.id = user.id;
        }
        token.email = user.email;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) || undefined;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/auth/complete-profile")) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
