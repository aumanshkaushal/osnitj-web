import { NextResponse } from "next/server";
import { getBlogPostsFromDb } from "@/lib/blog-db";

export async function GET() {
  try {
    const posts = await getBlogPostsFromDb();
    return NextResponse.json(posts);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load blog posts.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
