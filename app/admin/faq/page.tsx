import { getFaqTagsFromDb, getFaqQuestionsFromDb, FaqTag, FaqQuestion } from "@/lib/faq-db";
import { getAdminSession } from "../actions";
import { redirect } from "next/navigation";
import FaqManagerClient from "./faq-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }

  let tags: FaqTag[] = [];
  let questions: FaqQuestion[] = [];
  let dbError = null;

  try {
    tags = await getFaqTagsFromDb();
    questions = await getFaqQuestionsFromDb();
  } catch (error: any) {
    console.error("Failed to load FAQs for admin:", error);
    dbError = error.message || "Database connection error";
  }

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 max-w-[1400px] mx-auto w-full">
      {dbError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded font-mono text-sm">
          <strong>Database Error:</strong> {dbError}. Please check your connection or database status.
        </div>
      )}
      <FaqManagerClient initialTags={tags} initialQuestions={questions} />
    </div>
  );
}
