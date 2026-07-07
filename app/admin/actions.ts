"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { getAdminByUsername } from "@/lib/admin-db";
import { verifyPassword, signToken, verifyToken } from "@/lib/auth";
import { createDispatchInDb, updateDispatchInDb, deleteDispatchFromDb } from "@/lib/dispatch-db";
import {
  createSprintInDb,
  addProjectToSprintInDb,
  addTaskToProjectInDb,
  updateTaskStatusInDb,
  deleteSprintFromDb,
  deleteTaskFromDb,
  deleteProjectFromSprintInDb
} from "@/lib/sprints-db";

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

export async function createSprintAction(
  sprintNumber: number,
  startDate: string,
  endDate: string
) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  try {
    const payload = {
      sprint_number: Number(sprintNumber),
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      status: "upcoming" as any
    };

    const newSprint = await createSprintInDb(payload);
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Sprint cycle created successfully!", sprint: newSprint };
  } catch (error: any) {
    console.error("Create sprint action error:", error);
    if (error.message && error.message.includes("unique")) {
      return { error: "A sprint with this number already exists." };
    }
    return { error: "Failed to create sprint cycle." };
  }
}

export async function addProjectToSprintAction(
  sprintId: string,
  projectName: string,
  githubRepo: string
) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  if (!projectName || !githubRepo) {
    return { error: "Project name and Github repo are required." };
  }

  try {
    let repoExists = false;
    let isOfflineFallback = false;
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
      };
      if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
      }
      
      const githubRes = await fetch(`https://api.github.com/repos/Opensource-NITJ/${githubRepo}`, { headers });
      if (githubRes.status === 200) {
        repoExists = true;
      } else if (githubRes.status === 404) {
        repoExists = false;
      } else {
        throw new Error(`GitHub responded with status: ${githubRes.status}`);
      }
    } catch (err) {
      isOfflineFallback = true;
      try {
        const cachePath = path.join(process.cwd(), ".next", "github-cache.json");
        const cacheContent = await fs.readFile(cachePath, "utf8");
        const cache = JSON.parse(cacheContent);
        if (cache && Array.isArray(cache.projects)) {
          repoExists = cache.projects.some(
            (p: any) => p.name.toLowerCase() === githubRepo.toLowerCase()
          );
        }
      } catch (cacheErr) {
        console.error("Verification fallback cache error:", cacheErr);
        repoExists = true;
      }
    }

    if (!repoExists) {
      if (isOfflineFallback) {
        return { error: `GitHub API rate-limited, and 'Opensource-NITJ/${githubRepo}' was not found in the local cache.` };
      } else {
        return { error: `Repository 'Opensource-NITJ/${githubRepo}' was not found on GitHub.` };
      }
    }

    const project = await addProjectToSprintInDb(sprintId, {
      project_name: projectName,
      github_repo: githubRepo,
    });
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Project added to sprint successfully!", project };
  } catch (error) {
    console.error("Add project to sprint action error:", error);
    return { error: "Failed to add project to sprint." };
  }
}

export async function addTaskToProjectAction(
  projectId: string,
  taskText: string,
  status: "completed" | "in-progress" | "pending",
  prLink?: string | null
) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  if (!taskText) {
    return { error: "Task description is required." };
  }

  try {
    const task = await addTaskToProjectInDb(projectId, {
      task_text: taskText,
      status,
      pr_link: prLink || null,
    });
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Task added to project successfully!", task };
  } catch (error) {
    console.error("Add task to project action error:", error);
    return { error: "Failed to add task to project." };
  }
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "completed" | "carried-forward" | "rejected" | "pending" | "in-progress"
) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  try {
    await updateTaskStatusInDb(taskId, status);
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Task status updated successfully!" };
  } catch (error) {
    console.error("Update task status action error:", error);
    return { error: "Failed to update task status." };
  }
}

export async function deleteSprintAction(sprintId: string) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  try {
    await deleteSprintFromDb(sprintId);
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Sprint deleted successfully!" };
  } catch (error) {
    console.error("Delete sprint action error:", error);
    return { error: "Failed to delete sprint." };
  }
}

export async function deleteTaskAction(taskId: string) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  try {
    await deleteTaskFromDb(taskId);
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Task deleted successfully!" };
  } catch (error) {
    console.error("Delete task action error:", error);
    return { error: "Failed to delete task." };
  }
}

export async function deleteProjectAction(projectId: string) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized. Please log in." };
  }

  try {
    await deleteProjectFromSprintInDb(projectId);
    revalidatePath("/");
    revalidatePath("/admin/sprints");
    return { success: true, message: "Project deleted successfully!" };
  } catch (error) {
    console.error("Delete project action error:", error);
    return { error: "Failed to delete project." };
  }
}
