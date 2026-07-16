import { NextRequest, NextResponse } from "next/server";
import { recordAnalyticsEvent } from "@/lib/analytics-db";
import crypto from "crypto";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ipCache = new Map<string, { city: string; country: string }>();

async function resolveIpLocation(ip: string) {
  if (
    !ip || 
    ip === "127.0.0.1" || 
    ip === "::1" || 
    ip.startsWith("192.168.") || 
    ip.startsWith("10.") || 
    ip.startsWith("172.16.")
  ) {
    return { city: "Local", country: "Local" };
  }

  if (ipCache.has(ip)) {
    return ipCache.get(ip)!;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const loc = { 
          city: data.city || "Unknown", 
          country: data.country || "Unknown" 
        };
        ipCache.set(ip, loc);
        return loc;
      }
    }
  } catch (e) {
    console.error("GeoIP lookup failed for IP:", ip, e);
  }

  return { city: "Unknown", country: "Unknown" };
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { event, page, sessionId, ...extra } = body;

    if (!event || !page) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    let finalSessionId = sessionId;
    if (!finalSessionId || !UUID_REGEX.test(finalSessionId)) {
      finalSessionId = crypto.randomUUID();
    }

    let ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim();
    }

    const loc = await resolveIpLocation(ip);

    await recordAnalyticsEvent({
      session_id: finalSessionId,
      event_name: event,
      page: page,
      metadata: {
        ip,
        city: loc.city,
        country: loc.country,
        ...extra
      },
    });

    return NextResponse.json({ success: true, sessionId: finalSessionId });
  } catch (error: any) {
    console.error("Error logging analytics event:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
