import { getFaqTagsFromDb, getFaqQuestionsFromDb } from "@/lib/faq-db";
import { getAdminSession } from "../actions";
import { redirect } from "next/navigation";
import FaqManagerClient from "./faq-manager-client";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }

  const tags = await getFaqTagsFromDb();
  const questions = await getFaqQuestionsFromDb();

  return (
    <div className="flex-1 flex flex-col p-6 md:p-10 max-w-[1400px] mx-auto w-full">
      <FaqManagerClient initialTags={tags} initialQuestions={questions} />
    </div>
  );
}
