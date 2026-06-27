"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAdminByUsername } from "@/lib/admin-db";
import { verifyPassword, signToken, verifyToken } from "@/lib/auth";
import { createDispatchInDb, updateDispatchInDb, deleteDispatchFromDb } from "@/lib/dispatch-db";

const SESSION_COOKIE_NAME = "admin_session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Please enter both username and password." };
  }

  try {
    const admin = await getAdminByUsername(username);
    if (!admin) {
      return { error: "Invalid username or password." };
    }

    const isValid = verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return { error: "Invalid username or password." };
    }

    const token = signToken({ username: admin.username });
    const cookieStore = await cookies();
    
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login action error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  revalidatePath("/admin");
  return { success: true };
}

export async function saveDispatchAction(
  prevState: any,
  data: {
    id?: string;
    title: string;
    slug: string;
    authorName: string;
    authorGithub: string;
    date: string;
    readTime: number;
    markdownContent: string;
  }
) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  const { id, title, slug, authorName, authorGithub, date, readTime, markdownContent } = data;

  if (!title || !slug || !markdownContent) {
    return { error: "Title, slug, and content are required." };
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(slug)) {
    return { error: "Slug can only contain lowercase letters, numbers, hyphens, and underscores." };
  }

  try {
    const dispatchPayload = {
      title,
      slug,
      author: {
        name: authorName || "OpenSource @ NITJ",
        github: authorGithub || "Opensource-NITJ",
      },
      date: date || new Date().toISOString(),
      readTime: Number(readTime) || 1,
      markdownContent,
    };

    if (id) {
      // Update existing dispatch
      await updateDispatchInDb(id, dispatchPayload);
      revalidatePath("/dispatches");
      revalidatePath(`/dispatch/${slug}`);
      revalidatePath("/admin/dispatches");
      return { success: true, message: "Dispatch updated successfully!" };
    } else {
      // Create new dispatch
      const newDispatch = await createDispatchInDb(dispatchPayload);
      revalidatePath("/dispatches");
      revalidatePath("/admin/dispatches");
      return { success: true, message: "Dispatch created successfully!", dispatch: newDispatch };
    }
  } catch (error: any) {
    console.error("Save dispatch action error:", error);
    if (error.message && error.message.includes("unique")) {
      return { error: "A dispatch with this slug already exists." };
    }
    return { error: "Failed to save dispatch. Please check database configuration." };
  }
}

export async function deleteDispatchAction(id: string) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  try {
    await deleteDispatchFromDb(id);
    revalidatePath("/dispatches");
    revalidatePath("/admin/dispatches");
    return { success: true, message: "Dispatch deleted successfully!" };
  } catch (error) {
    console.error("Delete dispatch action error:", error);
    return { error: "Failed to delete dispatch." };
  }
}
