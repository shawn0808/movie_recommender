"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function handleSendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: phone.trim(),
          type: "phone",
          purpose: "login",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发送失败");
        setLoading(false);
        return;
      }
      setPhoneStep("verify");
      setSendCooldown(60);
      const interval = setInterval(() => {
        setSendCooldown((c) => {
          if (c <= 1) clearInterval(interval);
          return c <= 1 ? 0 : c - 1;
        });
      }, 1000);
    } catch {
      setError("发送失败");
    }
    setLoading(false);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("邮箱或密码错误");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("登录失败");
    }
    setLoading(false);
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("phone", {
        phone: phone.trim(),
        otp,
        redirect: false,
      });
      if (res?.error) {
        setError("验证码错误或已过期");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("登录失败");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4">
      <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
      <p className="mt-2 text-slate-600">登录你的约球啦账号</p>

      {process.env.NEXT_PUBLIC_WECHAT_ENABLED === "true" && (
        <button
          type="button"
          onClick={() => signIn("wechat", { callbackUrl })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[#07C160] bg-white py-3 font-medium text-[#07C160] hover:bg-slate-50"
        >
          <img src="/wechat.svg" alt="" className="h-6 w-6" />
          微信登录
        </button>
      )}

      <div className="mt-6 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => { setMethod("email"); setError(""); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            method === "email" ? "bg-white shadow" : "text-slate-600"
          }`}
        >
          邮箱
        </button>
        <button
          type="button"
          onClick={() => { setMethod("phone"); setPhoneStep("input"); setError(""); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            method === "phone" ? "bg-white shadow" : "text-slate-600"
          }`}
        >
          手机号
        </button>
      </div>

      {method === "email" && (
        <form onSubmit={handleEmailSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      )}

      {method === "phone" && (
        <>
          {phoneStep === "input" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  手机号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="13800138000"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="mt-8 space-y-5">
              <p className="text-sm text-slate-600">验证码已发送至 {phone}</p>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  验证码
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="6位数字"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录"}
              </button>
              {sendCooldown > 0 ? (
                <p className="text-center text-sm text-slate-500">
                  {sendCooldown}秒后可重新发送
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full text-center text-sm text-slate-600 hover:text-slate-900"
                >
                  重新发送验证码
                </button>
              )}
              <button
                type="button"
                onClick={() => setPhoneStep("input")}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                更换手机号
              </button>
            </form>
          )}
        </>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        还没有账号？{" "}
        <Link href="/auth/register" className="font-medium text-slate-900 hover:underline">
          注册
        </Link>
      </p>
    </div>
  );
}
