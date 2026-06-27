"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDispatchesFromPostgres, type Dispatch } from "@/lib/dispatch";
import ThemeToggle from "@/components/theme-toggle";

export default function DispatchesPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);

  useEffect(() => {
    getDispatchesFromPostgres().then(setDispatches);
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] selection:bg-[#111] selection:text-[#F7F7F2] dark:selection:bg-[#F4F4F0] dark:selection:text-[#121212] transition-colors">
      {/* Header */}
      <header className="grid grid-cols-12 border-b border-black/15 dark:border-white/15 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link
          href="/"
          className="col-span-12 md:col-span-6 px-4 md:px-8 lg:px-10 py-6 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-[#C85A41] transition-colors border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15"
        >
          <ArrowUpRight className="size-3.5 rotate-180" strokeWidth={1.5} />
          Return to Index
        </Link>
        <div className="col-span-12 md:col-span-6 px-4 md:px-8 lg:px-10 py-6 flex items-center justify-end md:border-l border-black/15 dark:border-white/15">
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-10">
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight pb-1">
            Dispatches<span className="text-[#C85A41]">.</span>
          </h1>
          <p className="mt-6 font-serif text-base md:text-lg text-zinc-700 dark:text-zinc-300 text-pretty">
            All technical posts, initiative updates, and team reflections.
          </p>
        </div>

        <div className="col-span-12 md:col-span-8 px-4 md:px-8 lg:px-10 py-10">
          <div className="border border-black/15 dark:border-white/15">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 border-b border-black/15 dark:border-white/15 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              <div className="col-span-2 px-5 py-3 border-r border-black/15 dark:border-white/15">Date</div>
              <div className="col-span-7 px-5 py-3 border-r border-black/15 dark:border-white/15">Title</div>
              <div className="col-span-3 px-5 py-3">Author</div>
            </div>

            {/* All Dispatches */}
            {dispatches.map((dispatch) => (
              <Link
                key={dispatch.id}
                href={`/dispatch/${dispatch.slug}`}
                className="flex flex-col lg:grid lg:grid-cols-12 lg:items-stretch border-b border-black/15 dark:border-white/15 last:border-b-0 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              >
                {/* Mobile layout */}
                <div className="lg:hidden px-4 py-5 flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-xl md:text-2xl leading-[1.15] tracking-tight text-left pb-1">
                      {dispatch.title}
                    </h3>
                    <ArrowUpRight className="size-4 text-zinc-500 dark:text-zinc-500 transition-all duration-300 shrink-0" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-300">
                    <span>
                      {new Date(dispatch.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span>{dispatch.readTime} min read</span>
                    <span>·</span>
                    <span>@{dispatch.author.github}</span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden lg:flex col-span-2 px-5 py-5 border-r border-black/15 dark:border-white/15 items-center font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {new Date(dispatch.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="hidden lg:flex col-span-7 px-5 py-5 border-r border-black/15 dark:border-white/15 items-center">
                  <span className="font-serif text-lg leading-[1.15] tracking-tight pb-1">{dispatch.title}</span>
                </div>
                <div className="hidden lg:flex col-span-3 px-5 py-5 items-center justify-between">
                  <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                    @{dispatch.author.github}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                    Read
                    <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
