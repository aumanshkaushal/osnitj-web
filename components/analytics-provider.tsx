"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("osnitj_session_id");
  if (!sessionId) {
    sessionId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem("osnitj_session_id", sessionId);
  }
  return sessionId;
}

function getDeviceType(): string {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

function getBrowserName(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("SamsungBrowser")) return "Samsung Browser";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  if (ua.includes("Trident")) return "Internet Explorer";
  if (ua.includes("Edge") || ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

function getOsName(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Macintosh") || ua.includes("Mac OS X")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

export function trackEvent(event: string, metadata?: Record<string, any>) {
  if (typeof window === "undefined") return;

  const page = window.location.pathname;

  if (page.startsWith("/admin") || page.startsWith("/api")) {
    return;
  }

  const sessionId = getOrCreateSessionId();
  const referrer = document.referrer;

  const payload = {
    event,
    page,
    sessionId,
    referrer: referrer || undefined,
    device: getDeviceType(),
    browser: getBrowserName(),
    os: getOsName(),
    language: navigator.language || "Unknown",
    screen: `${window.screen.width}x${window.screen.height}`,
    ...metadata,
  };

  fetch("/api/analytics/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.debug("Failed to record analytics event:", err);
  });
}

function AnalyticsTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    getOrCreateSessionId();

    const handleAnchorClick = (e: MouseEvent) => {
      if (window.location.pathname.startsWith("/admin")) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      if (isExternal) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) {
            let eventName = "external_link_click";
            if (url.hostname.includes("github.com")) {
              eventName = "github_click";
            } else if (url.hostname.includes("discord.gg") || url.hostname.includes("discord.com")) {
              eventName = "discord_click";
            }

            trackEvent(eventName, {
              url: href,
              text: anchor.innerText?.trim() || "",
            });
          }
        } catch {
          // Ignore invalid URLs
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;

    const searchString = searchParams ? searchParams.toString() : "";
    const fullPath = searchString ? `${pathname}?${searchString}` : pathname;
    
    if (lastTrackedRef.current === fullPath) return;
    lastTrackedRef.current = fullPath;

    trackEvent("page_view", {
      search: searchString || undefined,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsTrackerContent />
    </Suspense>
  );
}
