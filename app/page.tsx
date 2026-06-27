"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Sun,
  Moon,
  Star,
  GitFork,
  Users,
  Sparkles,
  GitBranch,
  Flag,
  Search,
} from "lucide-react";
import { getDispatchesFromPostgres, type Dispatch } from "@/lib/dispatch";
import Link from "next/link";
import { NavMenu } from "@/components/nav-menu";
import { useTheme } from "next-themes";

type Project = {
  no: string;
  name: string;
  desc: string;
  tag: string;
  stars: number;
  forks: number;
  contributors: number;
  url: string;
};

type Contributor = {
  handle: string;
  role: string;
  avatar: string;
  url: string;
};


type RecentCommit = {
  sha: string;
  message: string;
  date: string;
  repo: string;
  repoUrl: string;
  url: string;
  author: string;
  authorUrl: string | null;
  branch: string;
};

const NAV = [
  { label: "Index", href: "#index" },
  { label: "Spotlight", href: "#spotlight" },
  { label: "Contributors", href: "#contributors" },
  { label: "Activity", href: "#activity" },
  { label: "Dispatches", href: "#dispatches" },
  { label: "Manifesto", href: "#manifesto" },
  { label: "Contact", href: "#contact" },
];

const ORG_LOGIN = "Opensource-NITJ";
const REPO_BASE = `https://github.com/${ORG_LOGIN}`;

const ISSUE_DATE = new Date()
  .toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
  .toUpperCase();

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${fmtNum(n)} ${n === 1 ? singular : plural}`;
}

function pad(n: number, w = 2) {
  return String(n).padStart(w, "0");
}



function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  function toggle() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="group flex w-full items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700 dark:text-zinc-300 hover:text-[#C85A41] dark:hover:text-[#C85A41] transition-colors"
    >
      <span className="hidden sm:inline">Theme:</span>
      <span className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 border border-black/15 dark:border-white/15 ${
            !dark
              ? "bg-[#111] text-[#F4F4F0] border-[#111] dark:bg-[#F4F4F0] dark:text-[#111] dark:border-[#F4F4F0]"
              : ""
          }`}
        >
          <Sun className="size-3" strokeWidth={1.5} />
          Print
        </span>
        <span className="text-zinc-400 dark:text-zinc-600">/</span>
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-1 border border-black/15 dark:border-white/15 ${
            dark
              ? "bg-[#F4F4F0] text-[#111] border-[#F4F4F0] dark:bg-[#F4F4F0] dark:text-[#111]"
              : ""
          }`}
        >
          <Moon className="size-3" strokeWidth={1.5} />
          Negative
        </span>
      </span>
    </button>
  );
}

function LiveDot() {
  return (
    <span className="relative inline-flex size-1.5">
      <span className="absolute inset-0 rounded-full bg-[#C85A41] animate-ping opacity-75" />
      <span className="relative inline-flex size-1.5 rounded-full bg-[#C85A41]" />
    </span>
  );
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function formatCommitTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function ActivityStream({
  commits,
  isLoading,
}: {
  commits: RecentCommit[];
  isLoading: boolean;
}) {
  const status = isLoading
    ? "Fetching"
    : commits.length > 0
      ? "Live"
      : "No commits";

  return (
    <div className="font-mono text-[11px] md:text-[12px] leading-[1.7] text-zinc-800 dark:text-zinc-200">
      <div className="flex items-center justify-between border-b border-black/15 dark:border-white/15 px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#C85A41]" />
            <span className="size-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
            <span className="size-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
            github.com/{ORG_LOGIN}/commits
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
          {commits.length > 0 && <LiveDot />}
          {status}
        </div>
      </div>
      <ol className="px-4 py-4 space-y-1.5 max-h-[320px] overflow-x-auto overflow-y-hidden">
        {isLoading && (
          <li className="text-zinc-500 dark:text-zinc-500">
            Fetching recent commits from GitHub...
          </li>
        )}

        {!isLoading && commits.length === 0 && (
          <li className="text-zinc-500 dark:text-zinc-500">
            No recent public commits were returned by GitHub.
          </li>
        )}

        {commits.map((commit) => (
          <li
            key={commit.sha}
            className="flex gap-3 whitespace-nowrap overflow-hidden"
          >
            <span className="text-zinc-500 dark:text-zinc-500 shrink-0">
              [{formatCommitTime(commit.date)}]
            </span>
            <a
              href={commit.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#C85A41] shrink-0 hover:underline"
            >
              {commit.repo}
            </a>
            <span className="text-zinc-400 dark:text-zinc-600 shrink-0">›</span>
            <a
              href={commit.url}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 underline decoration-dotted decoration-zinc-400 dark:decoration-zinc-600 underline-offset-4 hover:decoration-[#C85A41]"
            >
              commit {commit.sha.slice(0, 7)}
            </a>
            <span className="text-zinc-500 dark:text-zinc-500 shrink-0">
              -{" "}
              {commit.authorUrl ? (
                <a
                  href={commit.authorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#C85A41] hover:underline"
                >
                  @{commit.author}
                </a>
              ) : (
                commit.author
              )}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 shrink-0">
              ({commit.branch})
            </span>
            <span className="text-zinc-700 dark:text-zinc-300 shrink-0">
              {commit.message}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Page() {
  const clock = useClock();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([]);
  const [isGitHubLoading, setIsGitHubLoading] = useState(true);

  useEffect(() => {
    getDispatchesFromPostgres().then(setDispatches);
  }, []);

  useEffect(() => {
    let ignore = false;

    setIsGitHubLoading(true);

    fetch("/api/github")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(
        ({
          projects: githubProjects,
          contributors: githubContributors,
          commits,
        }) => {
          if (ignore) return;
          if (githubProjects.length > 0) {
            setProjects(githubProjects);
          }
          if (githubContributors.length > 0) {
            setContributors(githubContributors);
          }
          setRecentCommits(commits);
        },
      )
      .catch(() => {
        if (!ignore) {
          setProjects([]);
          setContributors([]);
          setRecentCommits([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsGitHubLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const totals = useMemo(() => {
    const stars = projects.reduce((a, p) => a + p.stars, 0);
    const forks = projects.reduce((a, p) => a + p.forks, 0);
    return { stars, forks, contributors: contributors.length };
  }, [contributors.length, projects]);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] selection:bg-[#111] selection:text-[#F7F7F2] dark:selection:bg-[#F4F4F0] dark:selection:text-[#121212] transition-colors">
      {/* Document Header */}
      <header className="border-b border-black/15 dark:border-white/15">
        <div className="grid grid-cols-12 items-stretch">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-5 py-4 flex items-center gap-3">
            <span
              className="inline-block size-2 rounded-full bg-[#C85A41]"
              aria-hidden
            />
            <span className="font-serif text-2xl leading-[1.15] tracking-tight pb-1">
              Opensource<span className="italic text-[#C85A41]">@</span>NITJ
            </span>
          </div>

          <div className="col-span-12 md:col-span-5 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-5 py-4 flex items-center justify-start md:justify-center">
            <NavMenu items={NAV} />
          </div>

          <div className="col-span-12 md:col-span-3 px-5 py-4 flex items-center justify-end">
            <ThemeToggle />
          </div>
        </div>

        {/* Sub-bar */}
        <div className="grid grid-cols-12 border-t border-black/15 dark:border-white/15 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700 dark:text-zinc-300">
          <div className="col-span-6 lg:col-span-3 px-5 py-2 border-r border-black/15 dark:border-white/15">
            Vol. 01
          </div>
          <div className="col-span-6 lg:col-span-3 px-5 py-2 lg:border-r border-black/15 dark:border-white/15">
            {ISSUE_DATE}
          </div>
          <div className="hidden lg:flex col-span-3 px-5 py-2 border-r border-black/15 dark:border-white/15 items-center gap-2">
            <LiveDot />
            <span>Live Sync - GitHub</span>
          </div>
          <div className="hidden lg:flex col-span-3 px-5 py-2 items-center justify-end gap-2 tabular-nums">
            <span className="text-zinc-500 dark:text-zinc-500">
              {clock
                ? (() => {
                    const off = -clock.getTimezoneOffset();
                    const sign = off >= 0 ? "+" : "-";
                    const abs = Math.abs(off);
                    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
                    const mm = String(abs % 60).padStart(2, "0");
                    return `GMT${sign}${hh}:${mm}`;
                  })()
                : "GMT"}
            </span>
            <span>
              {clock
                ? `${pad(clock.getHours())}:${pad(clock.getMinutes())}:${pad(
                    clock.getSeconds(),
                  )}`
                : "--:--:--"}
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-black/15 dark:border-white/15">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-8 border-b lg:border-b-0 lg:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 pt-10 pb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 mb-8 flex items-center gap-3">
              <span>01 / Premise</span>
              <span className="h-px w-10 bg-black/30 dark:bg-white/30" />
              <span>For builders, by builders</span>
            </div>

            <h1 className="font-serif font-normal leading-[0.95] tracking-[-0.03em] text-[44px] sm:text-[88px] md:text-[120px] lg:text-[148px] xl:text-[176px] pb-2">
              Building
              <br />
              <span className="italic text-[#C85A41]">Functional</span>
              <br />
              Projects.
            </h1>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-700 dark:text-zinc-300">
              <span>- Est. 2025</span>
              <span className="h-px w-10 bg-black/30 dark:bg-white/30" />
              <span>
                {isGitHubLoading
                  ? "Fetching public repositories"
                  : pluralize(projects.length, "public repository")}
              </span>
              <span className="h-px w-10 bg-black/30 dark:bg-white/30" />
              <span>Open to all branches</span>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 px-4 md:px-8 lg:px-10 pt-10 pb-8 flex flex-col justify-between gap-10">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 mb-6">
                Abstract
              </div>
              <p className="font-serif text-[20px] md:text-[26px] leading-[1.25] text-zinc-800 dark:text-zinc-200 text-pretty">
                An initiative for the NIT Jalandhar community to build, share,
                and scale <span className="italic">open-source code</span> -
                written by students, used by everyone, maintained in public.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-[11px] uppercase tracking-[0.18em] border-t border-black/15 dark:border-white/15 pt-6">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Repos</dt>
                <dd className="mt-1 text-base tabular-nums">
                  {isGitHubLoading ? "--" : pad(projects.length)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Stars</dt>
                <dd className="mt-1 text-base tabular-nums">
                  {isGitHubLoading ? "--" : fmtNum(totals.stars)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">Forks</dt>
                <dd className="mt-1 text-base tabular-nums">
                  {isGitHubLoading ? "--" : fmtNum(totals.forks)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-500">
                  Contributors
                </dt>
                <dd className="mt-1 text-base tabular-nums">
                  {isGitHubLoading ? "--" : fmtNum(totals.contributors)}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      {/* Index / Repositories */}
      <section
        id="index"
        className="border-b border-black/15 dark:border-white/15"
      >
        <div className="grid grid-cols-12 border-b border-black/15 dark:border-white/15">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              02 / The Ledger
            </div>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight pb-1">
              Repositories,
              <br />
              <span className="italic">in print.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6 flex items-end">
            <p className="font-serif text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl text-pretty">
              A live ledger of every project under the Opensource@NITJ banner.
              Each row is a repository - public, hackable, and looking for
              hands.
            </p>
          </div>
          <div className="col-span-12 md:col-span-3 px-4 md:px-8 lg:px-10 py-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-2">
              <LiveDot />
              Live Sync
            </span>
            <span className="text-zinc-500 dark:text-zinc-500">
              {clock
                ? `${pad(clock.getHours())}:${pad(clock.getMinutes())}:${pad(
                    clock.getSeconds(),
                  )}`
                : "--:--:--"}
            </span>
          </div>
        </div>

        {/* Table header */}
        <div className="hidden lg:grid grid-cols-12 border-b border-black/15 dark:border-white/15 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
          <div className="col-span-1 px-4 md:px-8 lg:px-10 py-3 border-r border-black/15 dark:border-white/15">
            №
          </div>
          <div className="col-span-3 px-5 py-3 border-r border-black/15 dark:border-white/15">
            Repository
          </div>
          <div className="col-span-4 px-5 py-3 border-r border-black/15 dark:border-white/15">
            Description
          </div>
          <div className="col-span-1 px-5 py-3 border-r border-black/15 dark:border-white/15 text-right">
            Stars
          </div>
          <div className="col-span-1 px-5 py-3 border-r border-black/15 dark:border-white/15 text-right">
            Forks
          </div>
          <div className="col-span-1 px-5 py-3 border-r border-black/15 dark:border-white/15">
            Lang
          </div>
          <div className="col-span-1 px-5 py-3 text-right">Source</div>
        </div>

        {/* Rows */}
        <div className="w-full overflow-x-auto">
          <ul>
            {isGitHubLoading && projects.length === 0 && (
              <li className="px-4 md:px-8 lg:px-10 py-7 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
                Fetching public repositories from GitHub...
              </li>
            )}

            {!isGitHubLoading && projects.length === 0 && (
              <li className="px-4 md:px-8 lg:px-10 py-7 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
                No public repositories were returned by GitHub.
              </li>
            )}

            {projects.map((p) => (
              <li
                key={p.name}
                className="border-b border-black/15 dark:border-white/15 last:border-b-0"
              >
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col lg:grid lg:grid-cols-12 lg:items-stretch transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                >
                  {/* Mobile: stacked layout */}
                  <div className="md:hidden px-4 py-5 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-3 min-w-0">
                        <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-500 shrink-0">
                          {p.no}
                        </span>
                        <span className="font-serif text-3xl leading-[1.15] tracking-tight truncate pb-1">
                          {p.name}
                        </span>
                      </div>
                      <ArrowUpRight
                        className="size-4 text-zinc-500 dark:text-zinc-500 group-hover:text-[#C85A41] transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="font-serif text-base leading-snug text-zinc-700 dark:text-zinc-300 text-pretty">
                      {p.desc}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-300">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-1.5 rounded-full bg-[#C85A41]"
                          aria-hidden
                        />
                        {p.tag}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Star className="size-3.5" strokeWidth={1.5} />
                        {fmtNum(p.stars)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <GitFork className="size-3.5" strokeWidth={1.5} />
                        {fmtNum(p.forks)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-500">
                        <Users className="size-3" strokeWidth={1.5} />
                        {p.contributors}
                      </span>
                    </div>
                  </div>

                  {/* Desktop: grid row */}
                  <div className="hidden lg:flex col-span-1 px-5 md:px-8 lg:px-10 py-7 border-r border-black/15 dark:border-white/15 font-mono text-xs text-zinc-500 dark:text-zinc-500 items-start">
                    {p.no}
                  </div>

                  <div className="hidden lg:flex col-span-3 px-5 py-7 border-r border-black/15 dark:border-white/15 flex-col justify-center gap-1">
                    <span className="font-serif text-3xl md:text-4xl leading-[1.15] tracking-tight pb-1">
                      {p.name}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 inline-flex items-center gap-1.5">
                      <Users className="size-3" strokeWidth={1.5} />
                      {p.contributors} contributors
                    </span>
                  </div>

                  <div className="hidden lg:flex col-span-4 px-5 py-7 border-r border-black/15 dark:border-white/15 items-center">
                    <p className="font-serif text-lg md:text-xl text-zinc-700 dark:text-zinc-300 text-pretty">
                      {p.desc}
                    </p>
                  </div>

                  <div className="hidden lg:flex col-span-1 px-5 py-7 border-r border-black/15 dark:border-white/15 items-center justify-end">
                    <span className="font-mono text-[12px] tabular-nums inline-flex items-center gap-1.5">
                      <Star className="size-3.5" strokeWidth={1.5} />
                      {fmtNum(p.stars)}
                    </span>
                  </div>

                  <div className="hidden lg:flex col-span-1 px-5 py-7 border-r border-black/15 dark:border-white/15 items-center justify-end">
                    <span className="font-mono text-[12px] tabular-nums inline-flex items-center gap-1.5">
                      <GitFork className="size-3.5" strokeWidth={1.5} />
                      {fmtNum(p.forks)}
                    </span>
                  </div>

                  <div className="hidden lg:flex col-span-1 px-5 py-7 border-r border-black/15 dark:border-white/15 items-center">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-2">
                      <span
                        className="size-1.5 rounded-full bg-[#C85A41]"
                        aria-hidden
                      />
                      {p.tag}
                    </span>
                  </div>

                  <div className="hidden lg:flex col-span-1 px-4 md:px-8 lg:px-10 py-7 items-center justify-end">
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 group-hover:text-[#C85A41] transition-colors inline-flex items-center gap-2">
                      <span>View</span>
                      <ArrowUpRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={1.5}
                      />
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Active Spotlight - MUNSOC */}
      <section
        id="spotlight"
        className="border-b border-black/15 dark:border-white/15"
      >
        <div className="grid grid-cols-12 border-b border-black/15 dark:border-white/15">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C85A41] inline-flex items-center gap-2">
              <Sparkles className="size-3.5" strokeWidth={1.5} />
              03 / Active Spotlight
            </div>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight pb-1">
              The
              <br />
              <span className="italic">MUNSOC</span>
              <br />
              website.
            </h2>
          </div>
          <div className="col-span-12 md:col-span-8 px-4 md:px-8 lg:px-10 py-6 flex items-end">
            <p className="font-serif text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-3xl text-pretty">
              We are actively building the official web platform for the Model
              United Nations (MUN) Society of NITJ, establishing a modern
              digital home for their conferences and society activities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-8 lg:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 mb-6">
              Initiative · in progress
            </div>
            <p className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight text-pretty">
              Building a{" "}
              <span className="italic text-[#C85A41]">
                bespoke web presence
              </span>{" "}
              for the Model United Nations Society of NIT Jalandhar - delegates,
              registrations, archives, resources.
            </p>

            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 border-t border-black/15 dark:border-white/15">
              {[
                { k: "Status", v: "Active" },
                { k: "Stack", v: "Next.js · Tailwind" },
                { k: "Open issues", v: "0" },
                { k: "Good first", v: "0" },
              ].map((m, i) => (
                <div
                  key={m.k}
                  className={`px-4 py-5 ${
                    i < 3 ? "border-r" : ""
                  } ${i < 2 ? "border-b md:border-b-0" : ""} border-black/15 dark:border-white/15`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
                    {m.k}
                  </div>
                  <div className="mt-2 font-serif text-2xl md:text-3xl leading-[1.15] pb-1">
                    {m.v}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="https://munsoc.opensourcenitj.com"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-3 border border-[#111] dark:border-[#F4F4F0] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors hover:bg-[#111] hover:text-[#F7F7F2] dark:hover:bg-[#F4F4F0] dark:hover:text-[#121212]"
              >
                Visit Website
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
              </a>
              <a
                href={`${REPO_BASE}/munsoc`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] transition-colors text-zinc-700 dark:text-zinc-300 hover:text-[#C85A41]"
              >
                Contribute
                <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 px-4 md:px-8 lg:px-10 py-10 flex flex-col gap-8 border-t lg:border-t-0 border-black/15 dark:border-white/15">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400 mb-4">
                Roadmap
              </div>
              <ol className="space-y-4 font-serif text-lg leading-snug">
                <li className="flex gap-4">
                  <span className="font-mono text-[10px] tracking-[0.2em] mt-2 text-zinc-500 dark:text-zinc-500">
                    01 - DONE
                  </span>
                  <span>
                    Core layouts, society showcase, and information hub.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="font-mono text-[10px] tracking-[0.2em] mt-2 text-[#C85A41]">
                    02 - NOW
                  </span>
                  <span>
                    Delegate registration and event management system.
                  </span>
                </li>
                <li className="flex gap-4">
                  <span className="font-mono text-[10px] tracking-[0.2em] mt-2 text-zinc-500 dark:text-zinc-500">
                    03 - NEXT
                  </span>
                  <span>Conference archive and debate resource center.</span>
                </li>
              </ol>
            </div>

            <div className="border-t border-black/15 dark:border-white/15 pt-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
                Looking for
              </div>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                {[
                  "Next.js",
                  "TypeScript",
                  "Tailwind CSS",
                  "UI/UX Design",
                  "Content Writing",
                  "QA",
                ].map((t) => (
                  <span
                    key={t}
                    className="border border-black/20 dark:border-white/20 px-2.5 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Contributors / Hall of Fame */}
      <section
        id="contributors"
        className="border-b border-black/15 dark:border-white/15"
      >
        <div className="grid grid-cols-12 border-b border-black/15 dark:border-white/15">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              04 / Hall of Fame
            </div>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight pb-1">
              The
              <br />
              <span className="italic">Contributors.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-8 px-4 md:px-8 lg:px-10 py-6 flex items-end">
            <p className="font-serif text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl text-pretty">
              Names on the masthead. Students, alumni and lurkers who shipped,
              reviewed, and maintained - listed in monospace, in no particular
              order.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {isGitHubLoading && contributors.length === 0 && (
            <li className="col-span-full px-4 md:px-8 lg:px-10 py-7 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
              Fetching contributors from GitHub...
            </li>
          )}

          {!isGitHubLoading && contributors.length === 0 && (
            <li className="col-span-full px-4 md:px-8 lg:px-10 py-7 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
              No public contributors were returned by GitHub.
            </li>
          )}

          {contributors.map((c) => (
            <li
              key={c.handle}
              className={`border-b border-r border-black/15 dark:border-white/15 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r sm:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(3n)]:border-r md:[&:nth-child(5n)]:border-r-0 lg:[&:nth-child(5n)]:border-r lg:[&:nth-child(6n)]:border-r-0`}
            >
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="group block px-5 py-6 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="aspect-square w-full overflow-hidden border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.03]">
                  <img
                    src={c.avatar}
                    alt={`${c.handle} GitHub avatar`}
                    className="size-full object-cover grayscale contrast-110 transition-all duration-500 group-hover:grayscale-0 group-hover:contrast-100 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <div className="mt-3 font-mono text-[12px] tracking-tight">
                  @{c.handle}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mt-1">
                  {c.role}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Activity Stream */}
      <section
        id="activity"
        className="border-b border-black/15 dark:border-white/15"
      >
        <div className="grid grid-cols-12">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              05 / Activity
            </div>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight pb-1">
              Recent
              <br />
              <span className="italic">commits.</span>
            </h2>
            <p className="mt-6 font-serif text-base md:text-lg text-zinc-700 dark:text-zinc-300 text-pretty">
              The latest public commits from repositories across the org...
            </p>
          </div>
          <div className="col-span-12 md:col-span-8 px-4 md:px-8 lg:px-10 py-10">
            <div className="border border-black/15 dark:border-white/15 bg-[#F4F4F0] dark:bg-[#1A1A1A]">
              <ActivityStream
                commits={recentCommits}
                isLoading={isGitHubLoading}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dispatches */}
      <section
        id="dispatches"
        className="border-b border-black/15 dark:border-white/15"
      >
        <div className="grid grid-cols-12">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              06 / Dispatches
            </div>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05] tracking-tight pb-1">
              Dispatches &amp;
              <br />
              <span className="italic">updates.</span>
            </h2>
            <p className="mt-6 font-serif text-base md:text-lg text-zinc-700 dark:text-zinc-300 text-pretty">
              Technical posts, initiative updates, and reflections from the
              team.
            </p>
          </div>
          <div className="col-span-12 md:col-span-8 px-4 md:px-8 lg:px-10 py-10">
            <div className="border border-black/15 dark:border-white/15">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-12 border-b border-black/15 dark:border-white/15 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
                <div className="col-span-2 px-5 py-3 border-r border-black/15 dark:border-white/15">
                  Date
                </div>
                <div className="col-span-7 px-5 py-3 border-r border-black/15 dark:border-white/15">
                  Title
                </div>
                <div className="col-span-3 px-5 py-3">Author</div>
              </div>

              {/* Dispatches List (first 5) */}
              {dispatches.slice(0, 5).map((dispatch) => (
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
                      <ArrowUpRight
                        className="size-4 text-zinc-500 dark:text-zinc-500 transition-all duration-300 shrink-0"
                        strokeWidth={1.5}
                      />
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
                    <span className="font-serif text-lg leading-[1.15] tracking-tight pb-1">
                      {dispatch.title}
                    </span>
                  </div>
                  <div className="hidden lg:flex col-span-3 px-5 py-5 items-center justify-between">
                    <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                      @{dispatch.author.github}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 flex items-center gap-2">
                      View
                      <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                    </span>
                  </div>
                </Link>
              ))}

              {/* View All Button */}
              {dispatches.length > 5 && (
                <Link
                  href="/dispatches"
                  className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center border-black/15 dark:border-white/15 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                >
                  <div className="col-span-12 px-5 py-5 flex items-center justify-between font-serif text-base lg:text-lg leading-[1.15] tracking-tight pb-1">
                    <span>
                      View all <span className="font-mono">{dispatches.length}</span>{" "}
                      dispatches
                    </span>
                    <ArrowUpRight
                      className="size-4 text-zinc-500 dark:text-zinc-500 transition-all duration-300"
                      strokeWidth={1.5}
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section
        id="manifesto"
        className="border-b border-black/15 dark:border-white/15"
      >
        <div className="grid grid-cols-12">
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              07 / Manifesto
            </div>
            <p className="mt-6 font-serif text-2xl md:text-3xl leading-[1.15] text-pretty">
              We don&apos;t ship demos.
              <br />
              We ship <span className="italic text-[#C85A41]">tools</span> our
              campus
              <br />
              actually uses.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              Principles
            </div>
            <ol className="mt-6 space-y-4 font-serif text-lg leading-snug">
              <li className="flex gap-4">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                  i.
                </span>
                <span>
                  Write code in the open. Pull requests over presentations.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                  ii.
                </span>
                <span>Solve a real problem before naming the project.</span>
              </li>
              <li className="flex gap-4">
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                  iii.
                </span>
                <span>Document for the freshers who will inherit it.</span>
              </li>
            </ol>
          </div>
          <div className="col-span-12 md:col-span-4 px-4 md:px-8 lg:px-10 py-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
              Your first PR
            </div>
            <ol className="mt-6 divide-y divide-black/15 dark:divide-white/15 border-y border-black/15 dark:border-white/15">
              {[
                {
                  n: "01",
                  Icon: Search,
                  t: "Find a 'good first issue'",
                  d: "Browse the index, open any repo, filter issues by the label.",
                },
                {
                  n: "02",
                  Icon: GitBranch,
                  t: "Fork & branch",
                  d: "Clone, branch off main, write small commits, push to your fork.",
                },
                {
                  n: "03",
                  Icon: Flag,
                  t: "Ship it",
                  d: "Open a PR, link the issue, accept review notes - and merge.",
                },
              ].map((s) => (
                <li key={s.n} className="flex items-start gap-4 py-4">
                  <span className="font-mono text-[11px] tracking-[0.2em] text-[#C85A41] mt-1 w-8 shrink-0">
                    {s.n}
                  </span>
                  <s.Icon
                    className="size-4 mt-1 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <div>
                    <div className="font-serif text-lg leading-tight">
                      {s.t}
                    </div>
                    <p className="mt-1 font-serif text-sm text-zinc-700 dark:text-zinc-300 text-pretty">
                      {s.d}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <a
              href={REPO_BASE}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] hover:text-[#C85A41] transition-colors"
            >
              Open the GitHub org
              <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* Marquee Footer */}
      <footer id="contact" className="bg-[#F7F7F2] dark:bg-[#121212]">
        <div className="marquee-track overflow-hidden border-b border-black/15 dark:border-white/15">
          <div className="flex w-max animate-marquee py-6 md:py-10">
            {Array.from({ length: 2 }).map((_, dup) => (
              <div key={dup} className="flex shrink-0 items-center pr-12">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="flex items-center pr-12 font-serif text-[22vw] md:text-[14vw] leading-[1.05] tracking-[-0.04em] whitespace-nowrap pb-2"
                  >
                    OPENSOURCE
                    <span className="mx-6 md:mx-10 inline-block size-3 md:size-4 rounded-full bg-[#C85A41] align-middle" />
                    NITJ
                    <span className="mx-6 md:mx-10 font-mono text-[3vw] md:text-[1.5vw] tracking-[0.2em] text-zinc-500 dark:text-zinc-500 self-end pb-[2vw]">
                      ※
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 border-b border-black/15 dark:border-white/15 font-mono text-[11px] uppercase tracking-[0.2em]">
          <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6">
            <div className="text-zinc-500 dark:text-zinc-500">Mail</div>
            <a
              href="mailto:opensourcenitj@gmail.com"
              className="mt-2 block normal-case tracking-normal hover:text-[#C85A41] transition-colors break-all"
            >
              opensourcenitj@gmail.com
            </a>
          </div>
          <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6">
            <div className="text-zinc-500 dark:text-zinc-500">GitHub</div>
            <a
              href={REPO_BASE}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 normal-case tracking-normal hover:text-[#C85A41] transition-colors"
            >
              github.com/Opensource-NITJ
              <ArrowUpRight className="size-3" strokeWidth={1.5} />
            </a>
          </div>
          <div className="col-span-6 md:col-span-3 border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-6">
            <div className="text-zinc-500 dark:text-zinc-500">Location</div>
            <div className="mt-2 normal-case tracking-normal">
              NIT Jalandhar, Punjab - 144008
            </div>
          </div>
          <div className="col-span-6 md:col-span-3 px-4 md:px-8 lg:px-10 py-6">
            <div className="text-zinc-500 dark:text-zinc-500">Hours</div>
            <div className="mt-2 normal-case tracking-normal">
              Always-on / async-first
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-400">
          <div className="col-span-6 md:col-span-4 border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-4">
            © {new Date().getFullYear()} Opensource@NITJ
          </div>
          <div className="hidden md:block col-span-4 border-r border-black/15 dark:border-white/15 px-4 md:px-8 lg:px-10 py-4 text-center">
            Crafted by contributors with ❤️ in public
          </div>
          <div className="col-span-6 md:col-span-4 px-4 md:px-8 lg:px-10 py-4 text-right">
            Edition 01 / {ISSUE_DATE}
          </div>
        </div>
      </footer>
    </main>
  );
}
