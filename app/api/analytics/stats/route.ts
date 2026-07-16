import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/admin/actions";
import { getCombinedAnalytics } from "@/lib/analytics-db";

export const dynamic = "force-dynamic";

interface CacheEntry {
  data: any;
  timestamp: number;
}

const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 300000;

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";
    const periodOption = ["24h", "7d", "30d", "all"].includes(period) ? period : "7d";
    
    const bypassCache = searchParams.get("refresh") === "true";
    const now = Date.now();

    if (!bypassCache) {
      const cached = statsCache.get(periodOption);
      if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
        return NextResponse.json(cached.data);
      }
    }

    const result = await getCombinedAnalytics(periodOption);

    statsCache.set(periodOption, {
      data: result,
      timestamp: now
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Failed to load analytics statistics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load database stats" },
      { status: 500 }
    );
  }
}
