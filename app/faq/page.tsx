import { getCachedFaqData } from "@/lib/faq-db";
import FaqClient from "./faq-client";

export const revalidate = 60;

export default async function FAQPage() {
  const { tags, questions } = await getCachedFaqData();
  return <FaqClient initialTags={tags} initialQuestions={questions} />;
}
