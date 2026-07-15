import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/app/admin/actions";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error("IMGBB_API_KEY environment variable is not defined.");
    return NextResponse.json(
      { error: "ImgBB upload service is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const imgbbForm = new FormData();
    imgbbForm.append("image", file);

    const imgbbResponse = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgbbForm,
    });

    if (!imgbbResponse.ok) {
      const errorText = await imgbbResponse.text();
      console.error("ImgBB upload error response:", errorText);
      return NextResponse.json({ error: "Failed to upload image to ImgBB." }, { status: 502 });
    }

    const result = await imgbbResponse.json();
    const imageUrl = result.data?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL not returned by ImgBB." }, { status: 502 });
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("Server image upload handler error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
