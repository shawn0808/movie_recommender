import Link from "next/link";
import { NavUser } from "@/components/NavUser";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
            约球啦
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-slate-900 hover:text-amber-600">
              浏览活动
            </Link>
            <Link href="/create" className="text-sm text-slate-500 hover:text-slate-900">
              创建活动
            </Link>
            <Link href="/games" className="text-sm text-slate-500 hover:text-slate-900">
              我的活动
            </Link>
            <Link href="/messages" className="text-sm text-slate-500 hover:text-slate-900">
              消息
            </Link>
            <Link href="/profile" className="text-sm text-slate-500 hover:text-slate-900">
              个人
            </Link>
            <NavUser />
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
