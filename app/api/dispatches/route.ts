import { NextResponse } from "next/server";
import { getDispatchesFromDb } from "@/lib/dispatch-db";

export async function GET() {
  try {
    const dispatches = await getDispatchesFromDb();
    return NextResponse.json(dispatches);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load dispatches.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
