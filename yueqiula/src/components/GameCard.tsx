import Link from "next/link";
import { formatNtrpRange } from "@/lib/ntrp";

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
  venue: { name: string; address: string };
  host: { name: string | null } | null;
};

export function GameCard({ game }: { game: Game }) {
  const date = new Date(game.startTime);
  const dateStr = date.toLocaleDateString("zh-CN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const ntrpRange = formatNtrpRange(game.ntrpMin, game.ntrpMax);

  return (
    <Link
      href={`/games/${game.id}`}
      className="group block rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-slate-200 hover:shadow-lg"
    >
      <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">
        {dateStr.split(" ")[0]} @{game.venue.name}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{game.venue.address}</p>
      <p className="mt-3 text-sm text-slate-700">
        {dateStr} {timeStr} · {game.durationMinutes}分钟
      </p>
      <p className="mt-1 text-sm text-slate-600">
        NTRP {ntrpRange} · {game.sport === "tennis" ? "网球" : game.sport}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            game.spotsLeft > 0 ? "bg-slate-100 text-slate-700" : "bg-slate-200 text-slate-500"
          }`}
        >
          {game.spotsLeft} 名额
        </span>
        <span className="text-sm font-medium text-slate-900 group-hover:underline">
          查看详情 →
        </span>
      </div>
    </Link>
  );
}
