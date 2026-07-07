import { getAdminSession, logoutAction } from "./actions";
import AdminLoginClient from "./login-client";
import Link from "next/link";
import { ExternalLink, LogOut, ArrowLeft } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Admin Panel | OpenSource @ NITJ",
  description: "Administrative panel for managing open-source website dispatches.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  
  if (!session) {
    return <AdminLoginClient />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] font-mono selection:bg-[#C85A41]/20 dark:selection:bg-[#C85A41]/40 flex flex-col transition-colors">
      <Toaster position="bottom-right" />
      {/* Top Header */}
      <header className="border-b border-black/10 dark:border-white/10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="font-serif text-2xl tracking-tight font-semibold flex items-center gap-2 hover:text-[#C85A41] transition-colors"
          >
            OSNITJ Admin<span className="text-[#C85A41]">.</span>
          </Link>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-sm">
            Active: {session.username}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/dispatches"
            target="_blank"
            className="text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 border border-black/10 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
          >
            Visit Dispatches
            <ExternalLink className="size-3" />
          </Link>
          <form action={logoutAction as any} className="inline">
            <button
              type="submit"
              className="text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 bg-black text-[#F7F7F2] dark:bg-[#F4F4F0] dark:text-[#121212] hover:opacity-90 transition-opacity cursor-pointer border border-transparent"
            >
              Logout
              <LogOut className="size-3" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
