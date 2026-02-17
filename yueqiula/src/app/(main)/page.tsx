"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { GameCard } from "@/components/GameCard";

const AmapMapView = dynamic(() => import("@/components/AmapMapView").then((m) => ({ default: m.AmapMapView })), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse rounded-xl bg-slate-200" />,
});

type Game = {
  id: string;
  sport: string;
  ntrpMin: number;
  ntrpMax: number;
  startTime: string;
  durationMinutes: number;
  maxParticipants: number;
  spotsLeft: number;
  spotsFilled: number;
  venue: { name: string; address: string; lat: number; lng: number };
  host: { name: string | null } | null;
};

export default function BrowsePage() {
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();
  const handleGameClick = useCallback((id: string) => router.push(`/games/${id}`), [router]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("all");
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    const params = new URLSearchParams();
    if (sport !== "all") params.set("sport", sport);
    fetch(`/api/games?${params}`)
      .then((res) => res.json())
      .then(setGames)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sport]);

  return (
    <div>
      {/* Hero - Rally style */}
      <section className="border-b border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            让约球更方便
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            找附近球友，按水平匹配，轻松约球。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/#games"
              className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
            >
              加入活动
            </Link>
            <Link
              href="/create"
              className="rounded-full border-2 border-slate-900 px-6 py-3 font-medium text-slate-900 hover:bg-slate-50"
            >
              创建活动
            </Link>
          </div>
        </div>
      </section>

      {/* Filters - Rally style */}
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-1">
              {["all", "tennis"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    sport === s
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {s === "all" ? "全部运动" : "网球"}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                onClick={() => setView("list")}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  view === "list" ? "bg-slate-100 font-medium" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                列表
              </button>
              <button
                onClick={() => setView("map")}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  view === "map" ? "bg-slate-100 font-medium" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                地图
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main content - List or Map */}
      <section id="games" className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-slate-500">
          附近活动 — 正在进行中
        </h2>

        {view === "list" && (
          <>
            {loading ? (
              <div className="py-16 text-center text-slate-500">加载中...</div>
            ) : games.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
                <p className="text-lg font-medium text-slate-700">暂无活动</p>
                <p className="mt-2 text-slate-500">快来创建第一个活动，邀请球友一起打</p>
                <Link
                  href="/create"
                  className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-800"
                >
                  创建活动
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </>
        )}

        {view === "map" && (
          <div className="rounded-2xl overflow-hidden border border-slate-200">
            <AmapMapView games={games} onGameClick={handleGameClick} />
          </div>
        )}

        {games.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/create"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              创建活动
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
