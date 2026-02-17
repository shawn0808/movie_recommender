"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NTRP_LEVELS } from "@/lib/ntrp-levels";
import { VenueSearchInput, type VenueResult } from "@/components/VenueSearchInput";

const SHANGHAI_CENTER = "121.47,31.23"; // lng,lat fallback

export default function CreateGamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [venueQuery, setVenueQuery] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<VenueResult | null>(null);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [ntrpMin, setNtrpMin] = useState("3.0");
  const [ntrpMax, setNtrpMax] = useState("4.0");
  const [joinPolicy, setJoinPolicy] = useState<"open" | "approval_required">("open");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/create");
    }
  }, [status, router]);

  const handleSelectVenue = (place: VenueResult) => {
    setSelectedVenue(place);
    setVenueQuery(place.name);
    setVenueAddress(place.address);
  };

  const handleClearVenue = () => {
    setSelectedVenue(null);
    setVenueQuery("");
    setVenueAddress("");
  };

  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const venueName = venueQuery.trim();
    const address = venueAddress.trim() || venueName;
    if (!venueName) {
      setError("请输入场地名称");
      return;
    }

    let venuePayload: { id?: string; name: string; address: string; lat: number; lng: number };
    if (selectedVenue) {
      const [lng, lat] = selectedVenue.location.split(",").map(Number);
      if (isNaN(lat) || isNaN(lng)) {
        setError("场地坐标无效");
        return;
      }
      venuePayload = {
        id: selectedVenue.id,
        name: selectedVenue.name,
        address: selectedVenue.address,
        lat,
        lng,
      };
    } else {
      try {
        const geoRes = await fetch(
          `/api/places/geocode?address=${encodeURIComponent(address)}&city=上海`
        );
        const geoData = await geoRes.json();
        const loc = geoData.location || SHANGHAI_CENTER;
        const [lng, lat] = loc.split(",").map(Number);
        venuePayload = {
          name: venueName,
          address: address,
          lat: isNaN(lat) ? 31.23 : lat,
          lng: isNaN(lng) ? 121.47 : lng,
        };
      } catch {
        venuePayload = {
          name: venueName,
          address: address,
          lat: 31.23,
          lng: 121.47,
        };
      }
    }
    const [hours, minutes] = startTime.split(":").map(Number);
    const start = new Date(startDate);
    start.setHours(hours, minutes, 0, 0);
    if (start < new Date()) {
      setError("请选择未来的时间");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue: venuePayload,
          startTime: start.toISOString(),
          durationMinutes,
          maxParticipants,
          ntrpMin: parseFloat(ntrpMin),
          ntrpMax: parseFloat(ntrpMax),
          joinPolicy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "创建失败");
        setLoading(false);
        return;
      }
      router.push(`/games/${data.id}`);
      router.refresh();
    } catch {
      setError("创建失败");
    }
    setLoading(false);
  }

  if (status === "loading" || !session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">创建活动</h1>
      <p className="mt-2 text-slate-600">发起一场约球，邀请附近球友一起打</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <VenueSearchInput
          value={venueQuery}
          onChange={(v) => {
            setVenueQuery(v);
            setSelectedVenue(null);
          }}
          onSelect={handleSelectVenue}
          onClear={handleClearVenue}
          selectedVenue={selectedVenue}
          placeholder="搜索场地（如：卢湾体育馆）或手动输入场地名称"
        />
        <div>
          <label htmlFor="venue-address" className="block text-sm text-slate-500">详细地址（选填，用于手动输入时的地图定位）</label>
          <input
            id="venue-address"
            type="text"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            placeholder="如：上海市黄浦区肇嘉浜路128号"
            className="mt-1 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">日期 *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">时间 *</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">NTRP 最低</label>
            <select
              value={ntrpMin}
              onChange={(e) => setNtrpMin(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {NTRP_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">NTRP 最高</label>
            <select
              value={ntrpMax}
              onChange={(e) => setNtrpMax(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {NTRP_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">时长（分钟）</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {[60, 90, 120, 150, 180].map((m) => (
                <option key={m} value={m}>
                  {m} 分钟
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">人数上限</label>
            <select
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              {[2, 4, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n} 人
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">加入方式</label>
          <select
            value={joinPolicy}
            onChange={(e) => setJoinPolicy(e.target.value as "open" | "approval_required")}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="open">自由加入</option>
            <option value="approval_required">需批准</option>
          </select>
          <p className="mt-1 text-sm text-slate-500">
            {joinPolicy === "open" ? "任何人可直接加入" : "需你确认后才能加入"}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-4 pt-4">
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-slate-900 px-8 py-3 font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "创建中..." : "创建活动"}
          </button>
        </div>
      </form>
    </div>
  );
}
