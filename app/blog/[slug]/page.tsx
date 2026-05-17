"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, Sun, Moon } from "lucide-react";
import { getPostBySlug, type BlogPost } from "@/lib/blog";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? (
        <Sun className="size-5" strokeWidth={1.5} />
      ) : (
        <Moon className="size-5" strokeWidth={1.5} />
      )}
    </button>
  );
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostBySlug(slug).then((p) => {
      setPost(p);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] transition-colors flex items-center justify-center">
        <p className="font-mono text-zinc-500">Loading...</p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] transition-colors flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl mb-4">Post not found</p>
          <Link
            href="/blog"
            className="font-mono text-[#C85A41] hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowUpRight className="size-3.5 rotate-180" strokeWidth={1.5} />
            Back to Dispatches
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] selection:bg-[#111] selection:text-[#F7F7F2] dark:selection:bg-[#F4F4F0] dark:selection:text-[#121212] transition-colors">
      {/* Header */}
      <header className="grid grid-cols-12 border-b border-black/15 dark:border-white/15 font-mono text-[11px] uppercase tracking-[0.22em]">
        <Link
          href="/blog"
          className="col-span-12 md:col-span-6 px-4 md:px-8 lg:px-10 py-6 flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-[#C85A41] transition-colors border-b md:border-b-0 md:border-r border-black/15 dark:border-white/15"
        >
          <ArrowUpRight className="size-3.5 rotate-180" strokeWidth={1.5} />
          Return to Dispatches
        </Link>
        <div className="col-span-12 md:col-span-6 px-4 md:px-8 lg:px-10 py-6 flex items-center justify-end md:border-l border-black/15 dark:border-white/15">
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <article className="min-h-[calc(100vh-80px)] px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-5xl py-12 lg:py-16">
          {/* Title */}
          <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] tracking-tight pb-2 mb-12">
            {post.title}
          </h1>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4 border-y border-black/15 dark:border-white/15 py-6 mb-10 font-mono text-[11px] uppercase tracking-[0.22em]">
            <div>
              <div className="text-zinc-600 dark:text-zinc-400 mb-2">
                Author
              </div>
              <a
                href={`https://github.com/${post.author.github}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#C85A41] hover:underline"
              >
                @{post.author.github}
              </a>
              <div className="text-zinc-600 dark:text-zinc-400 text-[10px] mt-1 font-serif">
                {post.author.name}
              </div>
            </div>
            <div>
              <div className="text-zinc-600 dark:text-zinc-400 mb-2">
                Published
              </div>
              <div>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div>
              <div className="text-zinc-600 dark:text-zinc-400 mb-2">
                Read Time
              </div>
              <div>{post.readTime} min</div>
            </div>
          </div>

          {/* Body - Markdown */}
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="font-serif text-base md:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 mb-6">
                  {children}
                </p>
              ),
              h2: ({ children }) => (
                <h2 className="font-serif text-3xl tracking-tight mt-12 mb-4 pb-1">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-serif text-2xl tracking-tight mt-8 mb-3 pb-1">
                  {children}
                </h3>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={href?.startsWith("http") ? "noreferrer" : undefined}
                  className="text-[#C85A41] underline underline-offset-4 decoration-[#C85A41]/40 hover:decoration-[#C85A41] transition-colors"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#C85A41] pl-6 my-6 font-serif italic text-zinc-700 dark:text-zinc-300">
                  {children}
                </blockquote>
              ),
              code: ({ inline, children }: any) => {
                if (inline) {
                  return (
                    <code className="bg-black/5 dark:bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-[#C85A41] rounded">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="font-mono text-[13px] text-zinc-800 dark:text-zinc-200">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-black/5 dark:bg-white/5 p-4 border border-black/10 dark:border-white/10 overflow-x-auto text-[13px] font-mono text-zinc-800 dark:text-zinc-200 my-6 rounded">
                  {children}
                </pre>
              ),
              ul: ({ children }) => (
                <ul className="font-serif text-base text-zinc-800 dark:text-zinc-200 my-6 ml-6 space-y-2 list-disc">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="font-serif text-base text-zinc-800 dark:text-zinc-200 my-6 ml-6 space-y-2 list-decimal">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="font-serif text-base text-zinc-800 dark:text-zinc-200">
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-serif font-bold text-zinc-800 dark:text-zinc-200">
                  {children}
                </strong>
              ),
            }}
          >
            {post.markdownContent}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
