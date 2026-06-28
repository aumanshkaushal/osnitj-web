import { NextResponse } from "next/server";
import { getSprintsFromDb } from "@/lib/sprints-db";

export async function GET() {
  try {
    const sprints = await getSprintsFromDb();
    return NextResponse.json(sprints);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load sprints.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
