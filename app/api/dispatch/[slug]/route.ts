import { NextResponse } from "next/server";
import { getDispatchBySlugFromDb } from "@/lib/dispatch-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const dispatch = await getDispatchBySlugFromDb(slug);

    if (!dispatch) {
      return NextResponse.json({ error: "Dispatch not found." }, { status: 404 });
    }

    return NextResponse.json(dispatch);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load dispatch.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
