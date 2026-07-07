import { getSprintsFromDb } from "@/lib/sprints-db";
import { getAdminSession } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import SprintsListClient from "./sprints-list-client";

export default async function AdminSprintsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }

  // Fetch initial sprints data from database
  let initialSprints: any[] = [];
  try {
    initialSprints = await getSprintsFromDb();
  } catch (error) {
    console.error("Failed to load sprints for admin:", error);
  }

  return (
    <main className="flex-1 p-6 md:p-10 max-w-[1200px] mx-auto w-full">
      <SprintsListClient initialSprints={initialSprints} />
    </main>
  );
}
