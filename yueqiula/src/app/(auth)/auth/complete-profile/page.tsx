"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { NTRP_LEVELS } from "@/lib/ntrp-levels";

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ntrpLevel, setNtrpLevel] = useState<string>("3.0");
  const [gender, setGender] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ntrpLevel: parseFloat(ntrpLevel),
          gender: gender || undefined,
          birthYear: birthYear || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("保存失败");
    }
    setLoading(false);
  }

  if (status === "loading" || !session) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-12 text-center text-slate-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4">
      <h1 className="text-2xl font-bold text-slate-900">完善资料</h1>
      <p className="mt-2 text-slate-600">
        补充你的网球水平等信息，方便匹配球友
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-900 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}
