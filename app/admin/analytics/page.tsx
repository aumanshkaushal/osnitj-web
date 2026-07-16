import { getAdminSession } from "../actions";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ period?: string }>;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="font-mono text-sm text-zinc-500">Redirecting to login...</p>
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const period = resolvedParams.period || "7d";

  return <AnalyticsClient initialPeriod={period} />;
}
