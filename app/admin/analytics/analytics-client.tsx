"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Eye, 
  Users, 
  MousePointerClick, 
  Search, 
  HelpCircle, 
  Globe, 
  Link2, 
  AlertCircle, 
  ChevronRight,
  AlertTriangle,
  Loader2,
  RotateCw
} from "lucide-react";
import { TrafficChart, EventsBarChart, ReferrerBarChart, CountryBarChart } from "@/components/analytics-charts";

type AnalyticsData = {
  overview: { pageviews: number; uniqueSessions: number; totalEvents: number };
  traffic: Array<{ timeLabel: string; pageviews: number; visitors: number }>;
  pages: Array<{ page: string; views: number; visitors: number }>;
  events: Array<{ eventName: string; count: number }>;
  searchData: {
    popularSearches: Array<{ query: string; count: number }>;
    noResultSearches: Array<{ query: string; count: number }>;
  };
  faqData: Array<{ faqId: string; question: string; opens: number }>;
  referrers: Array<{ referrer: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  cities: Array<{ city: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
  osList: Array<{ os: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  rawLogs: any[];
};

export default function AnalyticsClient({ initialPeriod }: { initialPeriod: string }) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normal data fetching (uses 5-minute memory cache by default)
  const loadData = async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/stats?period=${period}${bypassCache ? "&refresh=true" : ""}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }
      const stats = await response.json();
      setData(stats);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load database statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [period]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    // Sync with URL query parameter
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/admin/analytics?period=${p}`);
    }
  };

  const handleForceRefresh = () => {
    loadData(true);
  };

  const periods = [
    { label: "24 Hours", value: "24h" },
    { label: "7 Days", value: "7d" },
    { label: "30 Days", value: "30d" },
    { label: "All Time", value: "all" },
  ];

  return (
    <main className="flex-1 flex flex-col p-6 md:p-12 max-w-[1200px] mx-auto w-full gap-8 overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-black/15 dark:border-white/15">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-[#C85A41] transition-colors mb-3 group"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Hub
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
            Analytics Dashboard<span className="text-[#C85A41]">.</span>
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1 flex items-center gap-2">
            Privacy-friendly custom visitor analytics and feature usage metrics.
            {loading && <Loader2 className="size-3 animate-spin text-[#C85A41]" />}
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          {/* Period selector */}
          <div className="flex border border-black/10 dark:border-white/10 rounded-sm overflow-hidden bg-white dark:bg-[#171717] p-0.5 shadow-sm">
            {periods.map((p) => {
              const isActive = p.value === period;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePeriodChange(p.value)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#C85A41] text-white font-semibold rounded-sm"
                      : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Force Refresh Button */}
          <button
            type="button"
            onClick={handleForceRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-sm text-xs font-mono font-medium disabled:opacity-50 cursor-pointer shadow-sm"
            title="Bypass cached reports and run clean queries against the database"
          >
            <RotateCw className={`size-3.5 ${loading ? "animate-spin text-[#C85A41]" : ""}`} />
            Force Refresh
          </button>
        </div>
      </div>

      {/* Database Error Banner */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 p-4 rounded-sm flex items-start gap-3">
          <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" />
          <div className="font-mono text-xs">
            <div className="font-bold text-red-500 uppercase tracking-wider mb-1">Database Connection Warning</div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Failed to query database statistics. Make sure the DATABASE_URL is valid and the database server is reachable.
            </p>
            <pre className="mt-2 p-2 bg-black/5 dark:bg-black/35 rounded-sm overflow-x-auto text-[10px] text-red-400 font-mono border border-black/5 dark:border-white/5">
              {error}
            </pre>
          </div>
        </div>
      )}

      {/* Metrics Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Pageviews */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono mb-2">Total Pageviews</div>
            {loading && !data ? (
              <div className="h-7 w-20 bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
            ) : (
              <div className="font-serif text-3xl font-semibold leading-none">{(data?.overview.pageviews || 0).toLocaleString()}</div>
            )}
          </div>
          <div className="w-10 h-10 border border-black/10 dark:border-white/10 flex items-center justify-center text-[#C85A41] bg-[#C85A41]/5">
            <Eye className="size-5" />
          </div>
        </div>

        {/* Card 2: Visitors */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono mb-2">Unique Visitors</div>
            {loading && !data ? (
              <div className="h-7 w-20 bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
            ) : (
              <div className="font-serif text-3xl font-semibold leading-none">{(data?.overview.uniqueSessions || 0).toLocaleString()}</div>
            )}
          </div>
          <div className="w-10 h-10 border border-black/10 dark:border-white/10 flex items-center justify-center text-[#C85A41] bg-[#C85A41]/5">
            <Users className="size-5" />
          </div>
        </div>

        {/* Card 3: Event logs */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono mb-2">Total Event Logs</div>
            {loading && !data ? (
              <div className="h-7 w-20 bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
            ) : (
              <div className="font-serif text-3xl font-semibold leading-none">{(data?.overview.totalEvents || 0).toLocaleString()}</div>
            )}
          </div>
          <div className="w-10 h-10 border border-black/10 dark:border-white/10 flex items-center justify-center text-[#C85A41] bg-[#C85A41]/5">
            <MousePointerClick className="size-5" />
          </div>
        </div>
      </div>

      {/* Traffic Chart Component */}
      <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h2 className="font-serif text-xl font-semibold mb-1">Traffic Overview</h2>
        <p className="text-[10px] text-zinc-500 font-mono mb-4 uppercase tracking-wider">
          Pageviews vs unique visitors over {period === "24h" ? "last 24 hours" : `last ${period}`}
        </p>
        <TrafficChart data={data?.traffic || []} />
      </div>

      {/* Detailed Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Pages Table */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Globe className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Top Pages</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.pages.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No page views recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Page URL</th>
                      <th className="pb-2 text-right font-medium">Views</th>
                      <th className="pb-2 text-right font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.pages.map((p, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 break-all pr-4 text-zinc-700 dark:text-zinc-300">{p.page}</td>
                        <td className="py-2.5 text-right font-semibold">{p.views.toLocaleString()}</td>
                        <td className="py-2.5 text-right text-zinc-500">{p.visitors.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Referrers Chart & List */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Link2 className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Referrer Sources</h3>
            </div>
            {loading && !data ? (
              <div className="h-[220px] w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm mt-4" />
            ) : (
              <ReferrerBarChart data={data?.referrers || []} />
            )}
          </div>
        </div>

        {/* Geographics - Top Countries Chart */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Globe className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Visitor Countries</h3>
            </div>
            {loading && !data ? (
              <div className="h-[220px] w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm mt-4" />
            ) : (
              <CountryBarChart data={data?.countries || []} />
            )}
          </div>
        </div>

        {/* Geographics - Top Cities Table */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Globe className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Visitor Cities</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.cities.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No location details logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">City Name</th>
                      <th className="pb-2 text-right font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.cities.map((c, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{c.city}</td>
                        <td className="py-2.5 text-right font-semibold">{c.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* User Agents - Device Type Breakdown */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Users className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">User Devices</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.devices.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No device details logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Device Class</th>
                      <th className="pb-2 text-right font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.devices.map((d, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{d.device}</td>
                        <td className="py-2.5 text-right font-semibold">{d.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* User Agents - Browser Breakdown */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Eye className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Web Browsers</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.browsers.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No browser details logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Browser</th>
                      <th className="pb-2 text-right font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.browsers.map((b, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{b.browser}</td>
                        <td className="py-2.5 text-right font-semibold">{b.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* User Agents - Operating Systems */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Globe className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Operating Systems</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.osList.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No OS details logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Operating System</th>
                      <th className="pb-2 text-right font-medium">Visitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.osList.map((o, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{o.os}</td>
                        <td className="py-2.5 text-right font-semibold">{o.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>


        {/* Feature Clicks Chart */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <MousePointerClick className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Event Clicks Breakdown</h3>
            </div>
            {loading && !data ? (
              <div className="h-[220px] w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm mt-4" />
            ) : (
              <EventsBarChart data={data?.events || []} />
            )}
          </div>
        </div>

        {/* FAQ Engagement */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <HelpCircle className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Top FAQ Opens</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.faqData.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No FAQ clicks logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Question</th>
                      <th className="pb-2 text-right font-medium">Opens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.faqData.map((f, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-4 text-zinc-700 dark:text-zinc-300 truncate max-w-[240px]" title={f.question}>
                          {f.question}
                        </td>
                        <td className="py-2.5 text-right font-semibold">{f.opens.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Popular Searches */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <Search className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold">Popular Search Queries</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.searchData.popularSearches.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No search logs recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Query String</th>
                      <th className="pb-2 text-right font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.searchData.popularSearches.map((s, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 italic text-zinc-700 dark:text-zinc-300">"{s.query}"</td>
                        <td className="py-2.5 text-right font-semibold">{s.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Searches with No Results */}
        <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
              <AlertCircle className="size-4 text-[#C85A41]" />
              <h3 className="font-serif text-lg font-semibold text-[#C85A41]">No Results Found Queries</h3>
            </div>
            {loading && !data ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-6 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
                ))}
              </div>
            ) : !data || data.searchData.noResultSearches.length === 0 ? (
              <p className="font-mono text-xs text-zinc-400 py-6 text-center">No "no results" queries logged. Perfect!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400">
                      <th className="pb-2 font-medium">Query String</th>
                      <th className="pb-2 text-right font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {data.searchData.noResultSearches.map((s, idx) => (
                      <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-[#C85A41] bg-[#C85A41]/[0.02]">
                        <td className="py-2.5 italic font-medium pr-4">"{s.query}"</td>
                        <td className="py-2.5 text-right font-semibold">{s.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Raw Event Logs Table */}
      <div className="border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-4 border-b border-black/5 dark:border-white/5 pb-3">
          <ChevronRight className="size-4 text-[#C85A41]" />
          <h3 className="font-serif text-lg font-semibold">Raw Event Stream</h3>
          <span className="text-[9px] uppercase tracking-wider bg-black/5 dark:bg-white/5 text-zinc-500 px-2 py-0.5 rounded-sm ml-2 font-mono">
            Latest 100 events
          </span>
        </div>
        {loading && !data ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-7 w-full bg-black/5 dark:bg-white/5 animate-pulse rounded-sm" />
            ))}
          </div>
        ) : !data || data.rawLogs.length === 0 ? (
          <p className="font-mono text-xs text-zinc-400 py-6 text-center">No raw logs recorded in database yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto faq-custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10 text-zinc-400 sticky top-0 bg-white dark:bg-[#171717] z-10">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Session ID</th>
                  <th className="pb-2 font-medium">Event Name</th>
                  <th className="pb-2 font-medium">Page Path</th>
                  <th className="pb-2 font-medium">Metadata (JSON)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {data.rawLogs.map((log: any, idx: number) => {
                  const isPageView = log.event_name === "page_view";
                  return (
                    <tr key={idx} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 whitespace-nowrap text-zinc-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td className="py-2.5 font-mono text-[10px] text-zinc-500" title={log.session_id}>
                        {log.session_id.substring(0, 8)}...
                      </td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded-sm font-semibold border ${
                          isPageView 
                            ? "bg-zinc-500/5 border-zinc-500/10 text-zinc-500" 
                            : "bg-[#C85A41]/5 border-[#C85A41]/10 text-[#C85A41]"
                        }`}>
                          {log.event_name}
                        </span>
                      </td>
                      <td className="py-2.5 break-all text-zinc-700 dark:text-zinc-300 pr-4">{log.page}</td>
                      <td className="py-2.5 text-zinc-500 dark:text-zinc-400 max-w-[300px] truncate" title={JSON.stringify(log.metadata)}>
                        {log.metadata && Object.keys(log.metadata).length > 0 
                          ? JSON.stringify(log.metadata) 
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
