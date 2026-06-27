import { getDispatchBySlugFromDb } from "@/lib/dispatch-db";
import AdminDispatchEditor from "@/components/admin-dispatch-editor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditDispatchPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = {
  title: "Edit Dispatch | OpenSource @ NITJ",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EditDispatchPage({ params }: EditDispatchPageProps) {
  const { slug } = await params;
  const dispatch = await getDispatchBySlugFromDb(slug);

  if (!dispatch) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center font-mono">
        <h2 className="font-serif text-3xl mb-4 text-zinc-800 dark:text-zinc-200">
          Dispatch not found
        </h2>
        <p className="text-xs text-zinc-500 mb-6">
          No dispatch was found matching the slug &quot;/{slug}&quot; in the database.
        </p>
        <Link
          href="/admin/dispatches"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#C85A41] hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Return to list
        </Link>
      </main>
    );
  }

  return <AdminDispatchEditor dispatch={dispatch} />;
}
