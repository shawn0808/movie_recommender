"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { NTRP_LEVELS } from "@/lib/ntrp-levels";
import { useRouter } from "next/navigation";

type Step = "input" | "verify";

export default function RegisterPage() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [ntrpLevel, setNtrpLevel] = useState<string>("3.0");
  const [gender, setGender] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendCooldown, setSendCooldown] = useState(0);
  const router = useRouter();

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), type: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发送失败");
        setLoading(false);
        return;
      }
      setStep("verify");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: method,
          identifier: identifier.trim(),
          otp,
          ...(method === "email" && { password }),
          name: name || undefined,
          ntrpLevel: ntrpLevel ? parseFloat(ntrpLevel) : undefined,
          gender: gender || undefined,
          birthYear: birthYear || undefined,
        }),
      });
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        setError("注册失败");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || "注册失败");
        setLoading(false);
        return;
      }
      if (method === "email") {
        const signInRes = await signIn("credentials", {
          email: identifier.trim(),
          password,
          redirect: false,
        });
        if (signInRes?.error) {
          setError("注册成功，请手动登录");
          setLoading(false);
          return;
        }
      } else {
        const signInRes = await signIn("phone", {
          phone: identifier.trim(),
          otp,
          redirect: false,
        });
        if (signInRes?.error) {
          setError("注册成功，请手动登录");
          setLoading(false);
          return;
        }
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("注册失败");
    }
    setLoading(false);
  }

  const inputLabel = method === "email" ? "邮箱" : "手机号";
  const inputPlaceholder = method === "email" ? "your@email.com" : "13800138000";
  const inputType = method === "email" ? "email" : "tel";

  return (
    <div className="mx-auto w-full max-w-sm px-4">
      <h1 className="text-2xl font-bold text-slate-900">创建账号</h1>
      <p className="mt-2 text-slate-600">注册约球啦，开始约球</p>

      {process.env.NEXT_PUBLIC_WECHAT_ENABLED === "true" && (
        <button
          type="button"
          onClick={() => signIn("wechat", { callbackUrl: "/" })}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[#07C160] bg-white py-3 font-medium text-[#07C160] hover:bg-slate-50"
        >
          <img src="/wechat.svg" alt="" className="h-6 w-6" />
          微信注册 / 登录
        </button>
      )}

      <div className="mt-6 flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setMethod("email");
            setStep("input");
            setError("");
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            method === "email" ? "bg-white shadow" : "text-slate-600"
          }`}
        >
          邮箱
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod("phone");
            setStep("input");
            setError("");
          }}
          className={`flex-1 rounded-md py-2 text-sm font-medium ${
            method === "phone" ? "bg-white shadow" : "text-slate-600"
          }`}
        >
          手机号
        </button>
      </div>

      {step === "input" ? (
        <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {inputLabel}
            </label>
            <input
              type={inputType}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder={inputPlaceholder}
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
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <p className="text-sm text-slate-600">
            验证码已发送至 {identifier}
          </p>
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
            <button
              type="button"
              onClick={() => setStep("input")}
              className="mt-2 text-sm text-slate-500 hover:text-slate-700"
            >
              更换{inputLabel}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              昵称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：小明"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              网球水平 (NTRP) <span className="text-amber-600">*</span>
            </label>
            <select
              value={ntrpLevel}
              onChange={(e) => setNtrpLevel(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {NTRP_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label} - {l.desc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              性别（选填）
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
              <option value="prefer_not_to_say">不愿透露</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              出生年份（选填）
            </label>
            <input
              type="number"
              min={1920}
              max={2015}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              placeholder="如：1995"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          {method === "email" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                密码（至少6位）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("input")}
              className="rounded-full border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              上一步
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </div>
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
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        已有账号？{" "}
        <Link href="/auth/login" className="font-medium text-slate-900 hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
