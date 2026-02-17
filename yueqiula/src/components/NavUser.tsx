"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function NavUser() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-slate-400">...</span>;
  }

  if (session?.user) {
    const display = session.user.name || session.user.email || "用户";
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">{display}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/login"
      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      登录
    </Link>
  );
}
