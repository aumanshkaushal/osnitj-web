import { getCachedFaqData } from "@/lib/faq-db";
import FaqClient from "../faq-client";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const { questions } = await getCachedFaqData();
    return questions.map((q) => ({
      slug: q.slug,
    }));
  } catch (error) {
    console.error("Error generating static params for FAQ:", error);
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function FAQQuestionPage({ params }: PageProps) {
  const { slug } = await params;
  const { tags, questions } = await getCachedFaqData();

  return (
    <FaqClient
      initialTags={tags}
      initialQuestions={questions}
      initialSelectedSlug={slug}
    />
  );
}
