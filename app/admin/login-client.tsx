"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function AdminLoginClient() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Reload page to re-render Server Component with valid session
      window.location.reload();
    });
  };

  return (
    <main className="min-h-screen w-full bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] flex flex-col font-mono transition-colors">
      {/* Return to Index link */}
      <header className="border-b border-black/10 dark:border-white/10 px-6 py-4 flex items-center">
        <Link
          href="/"
          className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-zinc-500 hover:text-[#C85A41] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Return to Index
        </Link>
      </header>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-8 shadow-sm rounded-sm">
          <div className="text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#C85A41] mb-2">
              System Admin
            </div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              Sign In<span className="text-[#C85A41]">.</span>
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 rounded-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label htmlFor="username" className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-black text-[#F7F7F2] dark:bg-[#F4F4F0] dark:text-[#121212] hover:opacity-90 transition-opacity font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Authenticate"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
