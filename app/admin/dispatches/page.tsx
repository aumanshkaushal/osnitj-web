import { getDispatchesFromDb } from "@/lib/dispatch-db";
import AdminDispatchListClient from "./dispatch-list-client";

export const metadata = {
  title: "Manage Dispatches | OpenSource @ NITJ",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDispatchesPage() {
  let dispatches: any[] = [];
  try {
    dispatches = await getDispatchesFromDb();
  } catch (error) {
    console.error("Failed to load dispatches for admin list:", error);
  }

  return <AdminDispatchListClient initialDispatches={dispatches} />;
}
