import { NextResponse } from "next/server";
import { getBlogPostBySlugFromDb } from "@/lib/blog-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const post = await getBlogPostBySlugFromDb(slug);

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load blog post.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
