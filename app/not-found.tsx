import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] transition-colors flex items-center justify-center">
      <div className="text-center">
        <p className="font-serif text-2xl mb-4">404 | Not found</p>
        <Link
          href="/"
          className="font-mono text-[#C85A41] hover:underline flex items-center gap-2 justify-center"
        >
          <ArrowUpRight className="size-3.5 rotate-180" strokeWidth={1.5} />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
