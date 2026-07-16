import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

const globalForPostgres = global as unknown as {
  analyticsSql: ReturnType<typeof postgres> | undefined;
};

const sql = globalForPostgres.analyticsSql ?? (connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 5, // Increase pool size to handle concurrent query execution
      prepare: false,
      connect_timeout: 3, // 3 seconds timeout for socket connection
      idle_timeout: 5, // Close idle connections after 5 seconds of inactivity
    })
  : null);

if (process.env.NODE_ENV !== "production") {
  if (sql) globalForPostgres.analyticsSql = sql;
}

export type AnalyticsEvent = {
  id: string;
  timestamp: Date;
  session_id: string;
  event_name: string;
  page: string;
  metadata: Record<string, any> | null;
};

/**
 * Record a custom analytics event in the database
 */
export async function recordAnalyticsEvent(event: {
  session_id: string;
  event_name: string;
  page: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  await sql`
    insert into public.analytics_events (session_id, event_name, page, metadata)
    values (${event.session_id}, ${event.event_name}, ${event.page}, ${event.metadata ? sql.json(event.metadata) : null})
  `;
}

/**
 * Helper to generate the timestamp condition based on the period filter
 */
function getPeriodCondition(period: string) {
  switch (period) {
    case "24h":
      return sql`timestamp >= now() - interval '24 hours'`;
    case "7d":
      return sql`timestamp >= now() - interval '7 days'`;
    case "30d":
      return sql`timestamp >= now() - interval '30 days'`;
    case "all":
    default:
      return sql`1=1`;
  }
}

/**
 * Get core stats overview: pageviews, unique sessions, and total events count
 */
export async function getOverviewStats(period: string): Promise<{
  pageviews: number;
  uniqueSessions: number;
  totalEvents: number;
}> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const [row] = await sql`
    select 
      count(case when event_name = 'page_view' then 1 end)::int as pageviews,
      count(distinct session_id)::int as unique_sessions,
      count(*)::int as total_events
    from public.analytics_events
    where ${periodCond}
  `;

  return {
    pageviews: row?.pageviews || 0,
    uniqueSessions: row?.unique_sessions || 0,
    totalEvents: row?.total_events || 0,
  };
}

/**
 * Get daily (or hourly for 24h) traffic data for charts
 */
export async function getTrafficData(period: string): Promise<Array<{
  timeLabel: string;
  pageviews: number;
  visitors: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  if (period === "24h") {
    // Group by hour for the last 24h
    const rows = await sql`
      select 
        to_char(timezone('Asia/Kolkata', timestamp), 'HH24:00') as label,
        count(case when event_name = 'page_view' then 1 end)::int as pageviews,
        count(distinct session_id)::int as visitors
      from public.analytics_events
      where ${periodCond}
      group by label
      order by min(timestamp) asc
    `;
    return rows.map(r => ({
      timeLabel: r.label,
      pageviews: r.pageviews,
      visitors: r.visitors,
    }));
  } else {
    // Group by day for other periods
    const rows = await sql`
      select 
        to_char(timezone('Asia/Kolkata', timestamp), 'YYYY-MM-DD') as label,
        count(case when event_name = 'page_view' then 1 end)::int as pageviews,
        count(distinct session_id)::int as visitors
      from public.analytics_events
      where ${periodCond}
      group by label
      order by label asc
    `;
    return rows.map(r => ({
      timeLabel: r.label,
      pageviews: r.pageviews,
      visitors: r.visitors,
    }));
  }
}

/**
 * Get top pages by view count
 */
export async function getTopPages(period: string, limit: number = 10): Promise<Array<{
  page: string;
  views: number;
  visitors: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const rows = await sql`
    select 
      page,
      count(case when event_name = 'page_view' then 1 end)::int as views,
      count(distinct session_id)::int as visitors
    from public.analytics_events
    where ${periodCond} and event_name = 'page_view'
    group by page
    order by views desc
    limit ${limit}
  `;

  return rows.map(r => ({
    page: r.page,
    views: r.views,
    visitors: r.visitors,
  }));
}

/**
 * Get top custom events by count
 */
export async function getTopEvents(period: string, limit: number = 15): Promise<Array<{
  eventName: string;
  count: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const rows = await sql`
    select 
      event_name,
      count(*)::int as count
    from public.analytics_events
    where ${periodCond} and event_name != 'page_view'
    group by event_name
    order by count desc
    limit ${limit}
  `;

  return rows.map(r => ({
    eventName: r.event_name,
    count: r.count,
  }));
}

/**
 * Get search queries, popular ones, and ones with no results
 */
export async function getSearchAnalytics(period: string): Promise<{
  popularSearches: Array<{ query: string; count: number }>;
  noResultSearches: Array<{ query: string; count: number }>;
}> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  // Popular searches
  const popularRows = await sql`
    select 
      metadata->>'query' as search_query,
      count(*)::int as count
    from public.analytics_events
    where ${periodCond} 
      and event_name = 'search_query'
      and metadata->>'query' is not null
      and metadata->>'query' != ''
    group by search_query
    order by count desc
    limit 10
  `;

  // No result searches
  const noResultRows = await sql`
    select 
      metadata->>'query' as search_query,
      count(*)::int as count
    from public.analytics_events
    where ${periodCond} 
      and event_name = 'search_query'
      and (metadata->>'resultsCount')::int = 0
      and metadata->>'query' is not null
      and metadata->>'query' != ''
    group by search_query
    order by count desc
    limit 10
  `;

  return {
    popularSearches: popularRows.map(r => ({ query: r.search_query, count: r.count })),
    noResultSearches: noResultRows.map(r => ({ query: r.search_query, count: r.count })),
  };
}

/**
 * Get FAQ specific stats: which FAQs are opened/closed the most
 */
export async function getFaqStats(period: string): Promise<Array<{
  faqId: string;
  question: string;
  opens: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const rows = await sql`
    select 
      metadata->>'faqId' as faq_id,
      metadata->>'question' as question,
      count(*)::int as opens
    from public.analytics_events
    where ${periodCond} 
      and event_name = 'faq_open'
      and metadata->>'faqId' is not null
    group by faq_id, question
    order by opens desc
    limit 10
  `;

  return rows.map(r => ({
    faqId: r.faq_id,
    question: r.question || r.faq_id,
    opens: r.opens,
  }));
}

/**
 * Get referrers breakdown (from session-start / external_link_click / referrer page view)
 */
export async function getReferrerStats(period: string): Promise<Array<{
  referrer: string;
  count: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const rows = await sql`
    select 
      coalesce(metadata->>'referrer', 'Direct/Unknown') as referrer_name,
      count(*)::int as count
    from public.analytics_events
    where ${periodCond}
      and (
        (event_name = 'page_view' and metadata->>'referrer' is not null and metadata->>'referrer' != '')
      )
    group by referrer_name
    order by count desc
    limit 10
  `;

  return rows.map(r => ({
    referrer: r.referrer_name,
    count: r.count,
  }));
}

/**
 * Get the latest raw analytics logs
 */
export async function getRawLogs(limit: number = 50): Promise<AnalyticsEvent[]> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const rows = await sql`
    select id, timestamp, session_id, event_name, page, metadata
    from public.analytics_events
    order by timestamp desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    timestamp: new Date(row.timestamp),
    session_id: row.session_id,
    event_name: row.event_name,
    page: row.page,
    metadata: row.metadata,
  }));
}

/**
 * Get top visitor countries
 */
export async function getTopCountries(period: string, limit: number = 10): Promise<Array<{
  country: string;
  count: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const rows = await sql`
    select 
      coalesce(metadata->>'country', 'Unknown') as country_name,
      count(distinct session_id)::int as count
    from public.analytics_events
    where ${periodCond}
    group by country_name
    order by count desc
    limit ${limit}
  `;

  return rows.map(r => ({
    country: r.country_name,
    count: r.count,
  }));
}

/**
 * Get top visitor cities
 */
export async function getTopCities(period: string, limit: number = 10): Promise<Array<{
  city: string;
  count: number;
}>> {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = getPeriodCondition(period);

  const rows = await sql`
    select 
      coalesce(metadata->>'city', 'Unknown') as city_name,
      count(distinct session_id)::int as count
    from public.analytics_events
    where ${periodCond}
    group by city_name
    order by count desc
    limit ${limit}
  `;

  return rows.map(r => ({
    city: r.city_name,
    count: r.count,
  }));
}

/**
 * Get all analytics stats in a single database round-trip using SQL CTEs
 */
export async function getCombinedAnalytics(period: string) {
  if (!sql) throw new Error("DATABASE_URL is not configured.");

  const periodCond = period === "24h" 
    ? sql`timestamp >= now() - interval '24 hours'` 
    : period === "7d" 
      ? sql`timestamp >= now() - interval '7 days'` 
      : period === "30d" 
        ? sql`timestamp >= now() - interval '30 days'` 
        : sql`1=1`;

  const timeLabelSelect = period === "24h"
    ? sql`to_char(timezone('Asia/Kolkata', timestamp), 'HH24:00')`
    : sql`to_char(timezone('Asia/Kolkata', timestamp), 'YYYY-MM-DD')`;

  const timeLabelOrder = period === "24h"
    ? sql`min(timestamp) asc`
    : sql`to_char(timezone('Asia/Kolkata', timestamp), 'YYYY-MM-DD') asc`;

  const [row] = await sql`
    with 
      period_events as (
        select id, timestamp, session_id, event_name, page, metadata
        from public.analytics_events
        where ${periodCond}
      ),
      overview_stats as (
        select 
          count(case when event_name = 'page_view' then 1 end)::int as pageviews,
          count(distinct session_id)::int as unique_sessions,
          count(*)::int as total_events
        from period_events
      ),
      traffic_stats as (
        select 
          ${timeLabelSelect} as label,
          count(case when event_name = 'page_view' then 1 end)::int as pageviews,
          count(distinct session_id)::int as visitors
        from period_events
        group by label
        order by ${timeLabelOrder}
      ),
      top_pages as (
        select 
          page,
          count(case when event_name = 'page_view' then 1 end)::int as views,
          count(distinct session_id)::int as visitors
        from period_events
        group by page
        order by views desc
        limit 10
      ),
      top_events as (
        select 
          event_name as "eventName",
          count(*)::int as count
        from period_events
        where event_name != 'page_view'
        group by event_name
        order by count desc
        limit 10
      ),
      popular_searches as (
        select 
          lower(trim(metadata->>'query')) as query,
          count(*)::int as count
        from period_events
        where event_name = 'search_query' and metadata->>'query' is not null and trim(metadata->>'query') != ''
        group by query
        order by count desc
        limit 10
      ),
      no_result_searches as (
        select 
          lower(trim(metadata->>'query')) as query,
          count(*)::int as count
        from period_events
        where event_name = 'search_no_results' and metadata->>'query' is not null and trim(metadata->>'query') != ''
        group by query
        order by count desc
        limit 10
      ),
      faq_stats as (
        select 
          metadata->>'faqId' as faq_id,
          coalesce(metadata->>'question', 'Unknown Question') as question,
          count(*)::int as opens
        from period_events
        where event_name = 'faq_open' and metadata->>'faqId' is not null
        group by faq_id, question
        order by opens desc
        limit 10
      ),
      referrer_stats as (
        select 
          coalesce(metadata->>'referrer', 'Direct/None') as referrer_name,
          count(distinct session_id)::int as count
        from period_events
        where (event_name = 'page_view' and metadata->>'referrer' is not null and metadata->>'referrer' != '')
        group by referrer_name
        order by count desc
        limit 10
      ),
      country_stats as (
        select 
          coalesce(metadata->>'country', 'Unknown') as country,
          count(distinct session_id)::int as count
        from period_events
        group by country
        order by count desc
        limit 10
      ),
      city_stats as (
        select 
          coalesce(metadata->>'city', 'Unknown') as city,
          count(distinct session_id)::int as count
        from period_events
        group by city
        order by count desc
        limit 10
      ),
      browser_stats as (
        select 
          coalesce(metadata->>'browser', 'Unknown') as browser,
          count(distinct session_id)::int as count
        from period_events
        group by browser
        order by count desc
        limit 10
      ),
      os_stats as (
        select 
          coalesce(metadata->>'os', 'Unknown') as os,
          count(distinct session_id)::int as count
        from period_events
        group by os
        order by count desc
        limit 10
      ),
      device_stats as (
        select 
          coalesce(metadata->>'device', 'Desktop') as device,
          count(distinct session_id)::int as count
        from period_events
        group by device
        order by count desc
        limit 10
      ),
      raw_logs as (
        select id, timestamp, session_id, event_name, page, metadata
        from public.analytics_events
        order by timestamp desc
        limit 100
      )
    select 
      (select row_to_json(o) from overview_stats o) as overview,
      (select json_agg(t) from traffic_stats t) as traffic,
      (select json_agg(p) from top_pages p) as pages,
      (select json_agg(e) from top_events e) as events,
      (select json_agg(ps) from popular_searches ps) as popular_searches,
      (select json_agg(ns) from no_result_searches ns) as no_result_searches,
      (select json_agg(f) from faq_stats f) as faq_stats,
      (select json_agg(r) from referrer_stats r) as referrers,
      (select json_agg(c) from country_stats c) as countries,
      (select json_agg(ci) from city_stats ci) as cities,
      (select json_agg(b) from browser_stats b) as browsers,
      (select json_agg(ost) from os_stats ost) as os_list,
      (select json_agg(d) from device_stats d) as devices,
      (select json_agg(rl) from raw_logs rl) as raw_logs
  `;

  return {
    overview: {
      pageviews: row?.overview?.pageviews || 0,
      uniqueSessions: row?.overview?.unique_sessions || 0,
      totalEvents: row?.overview?.total_events || 0,
    },
    traffic: (row?.traffic || []).map((t: any) => ({
      timeLabel: t.label,
      pageviews: t.pageviews || 0,
      visitors: t.visitors || 0,
    })),
    pages: (row?.pages || []).map((p: any) => ({
      page: p.page,
      views: p.views || 0,
      visitors: p.visitors || 0,
    })),
    events: (row?.events || []).map((e: any) => ({
      eventName: e.eventName,
      count: e.count || 0,
    })),
    searchData: {
      popularSearches: (row?.popular_searches || []).map((s: any) => ({
        query: s.query,
        count: s.count || 0,
      })),
      noResultSearches: (row?.no_result_searches || []).map((s: any) => ({
        query: s.query,
        count: s.count || 0,
      })),
    },
    faqData: (row?.faq_stats || []).map((f: any) => ({
      faqId: f.faq_id,
      question: f.question,
      opens: f.opens || 0,
    })),
    referrers: (row?.referrers || []).map((r: any) => ({
      referrer: r.referrer_name,
      count: r.count || 0,
    })),
    countries: (row?.countries || []).map((c: any) => ({
      country: c.country,
      count: c.count || 0,
    })),
    cities: (row?.cities || []).map((c: any) => ({
      city: c.city,
      count: c.count || 0,
    })),
    browsers: (row?.browsers || []).map((b: any) => ({
      browser: b.browser,
      count: b.count || 0,
    })),
    osList: (row?.os_list || []).map((o: any) => ({
      os: o.os,
      count: o.count || 0,
    })),
    devices: (row?.devices || []).map((d: any) => ({
      device: d.device,
      count: d.count || 0,
    })),
    rawLogs: (row?.raw_logs || []).map((rl: any) => ({
      id: rl.id,
      timestamp: new Date(rl.timestamp),
      session_id: rl.session_id,
      event_name: rl.event_name,
      page: rl.page,
      metadata: rl.metadata,
    })),
  };
}
