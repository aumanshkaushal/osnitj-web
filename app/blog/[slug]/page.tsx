"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { getPostBySlug, type BlogPost } from "@/lib/blog";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="h-9 w-9 flex items-center justify-center border border-black/10 dark:border-white/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
      aria-label="Toggle Theme"
    >
      {dark ? (
        <Sun className="size-4" strokeWidth={1.5} />
      ) : (
        <Moon className="size-4" strokeWidth={1.5} />
      )}
    </button>
  );
}

function extractHeadings(markdown: string) {
  const regex = /^##\s(.+)$/gm;
  const headings: string[] = [];

  let match;
  while ((match = regex.exec(markdown)) !== null) {
    headings.push(getPlainHeadingText(match[1]));
  }

  return headings;
}

function getPlainHeadingText(text: string) {
  return text
    .replace(/\\([\\`*_[\]{}()#+\-.!>])/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim();
}

function getNodeText(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getNodeText).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return getNodeText(
      (children as React.ReactElement<{ children?: React.ReactNode }>).props
        .children,
    );
  }

  return "";
}

function getHeadingId(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
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
      <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] flex items-center justify-center transition-colors">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-500">
          Loading dispatch...
        </p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] flex items-center justify-center px-6 transition-colors">
        <div className="text-center">
          <h1 className="font-serif text-4xl mb-4">Post not found</h1>

          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#C85A41]"
          >
            <ArrowLeft className="size-3.5" />
            Return
          </Link>
        </div>
      </main>
    );
  }

  const headings = extractHeadings(post.markdownContent);

  return (
    <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] selection:bg-[#C85A41] selection:text-black transition-colors">
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-500 hover:text-[#C85A41] transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Layout */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-12">
        {/* Left spacer */}
        <div className="hidden xl:block xl:col-span-2" />

        {/* Article */}
        <article className="col-span-12 xl:col-span-7 px-6 md:px-10 py-14 md:py-20">
          <div className="max-w-[680px]">
            {/* Meta */}
            <div className="mb-8 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C85A41]">
              Technical Dispatch
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl md:text-5xl leading-[1.02] tracking-[-0.04em] text-[#111] dark:text-[#F5F1EA]">
              {post.title}
            </h1>

            {/* Info */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-zinc-600 dark:text-zinc-500 border-b border-black/10 dark:border-white/[0.06] pb-8">
              <div>
                By{" "}
                <a
                  href={`https://github.com/${post.author.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C85A41] hover:underline"
                >
                  @{post.author.github}
                </a>
              </div>

              <div>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              <div>{post.readTime} min read</div>
            </div>

            {/* Markdown */}
            <ReactMarkdown
              components={{
                h2: ({ children }) => {
                  const id = getHeadingId(getNodeText(children));

                  return (
                    <h2
                      id={id}
                      className="scroll-mt-24 mt-20 mb-6 font-serif text-3xl md:text-4xl leading-tight tracking-[-0.03em] text-[#111] dark:text-[#F5F1EA]"
                    >
                      {children}
                    </h2>
                  );
                },

                h3: ({ children }) => (
                  <h3 className="mt-14 mb-4 font-serif text-2xl leading-tight text-[#111] dark:text-[#F5F1EA]">
                    {children}
                  </h3>
                ),

                p: ({ children }) => {
                  const childArray = Array.isArray(children)
                    ? children
                    : [children];

                  const hasBlockContent = childArray.some((child: any) => {
                    if (!child || typeof child === "string") {
                      return false;
                    }

                    return (
                      child?.type === "img" ||
                      child?.type?.name === "img" ||
                      child?.props?.node?.tagName === "img" ||
                      child?.props?.node?.tagName === "pre" ||
                      child?.props?.node?.tagName === "blockquote"
                    );
                  });

                  if (hasBlockContent) {
                    return <>{children}</>;
                  }

                  return (
                    <p className="font-serif text-[17px] md:text-[18px] leading-[1.85] text-zinc-700 dark:text-[#DDD6CB] mb-7">
                      {children}
                    </p>
                  );
                },

                a: ({ href, children }) => (
                  <a
                    href={href}
                    target={href?.startsWith("http") ? "_blank" : undefined}
                    rel={href?.startsWith("http") ? "noreferrer" : undefined}
                    className="text-[#C85A41] underline underline-offset-4 decoration-[#C85A41]/30 hover:decoration-[#C85A41]"
                  >
                    {children}
                  </a>
                ),

                strong: ({ children }) => (
                  <strong className="font-semibold text-[#111] dark:text-[#F5F1EA]">
                    {children}
                  </strong>
                ),

                blockquote: ({ children }) => (
                  <blockquote className="my-10 border-l border-[#C85A41] pl-5">
                    <div className="font-serif italic text-[22px] leading-[1.7] text-zinc-800 dark:text-[#F1E8DD]">
                      {children}
                    </div>
                  </blockquote>
                ),

                ul: ({ children }) => (
                  <ul className="my-6 ml-6 space-y-3 list-disc marker:text-[#C85A41]">
                    {children}
                  </ul>
                ),

                ol: ({ children }) => (
                  <ol className="my-6 ml-6 space-y-3 list-decimal marker:text-[#C85A41]">
                    {children}
                  </ol>
                ),

                li: ({ children }) => (
                  <li className="font-serif text-[17px] leading-[1.8] text-zinc-700 dark:text-[#DDD6CB]">
                    {children}
                  </li>
                ),

                code: ({ inline, children }: any) => {
                  if (inline) {
                    return (
                      <code className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded px-1.5 py-0.5 text-[14px] font-mono text-[#C85A41]">
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className="font-mono text-[14px] leading-7 text-[#111] dark:text-[#EDE7DD]">
                      {children}
                    </code>
                  );
                },

                pre: ({ children }) => (
                  <div className="my-10 overflow-hidden border border-black/[0.08] dark:border-white/[0.06] bg-black/[0.03] dark:bg-white/[0.03] rounded-sm">
                    <div className="px-4 py-2 border-b border-black/[0.08] dark:border-white/[0.06] font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                      Code
                    </div>

                    <pre className="overflow-x-auto px-5 py-5">{children}</pre>
                  </div>
                ),

                img: ({ src, alt }) => (
                  <div className="my-12">
                    <img
                      src={src || ""}
                      alt={alt || ""}
                      className="w-full border border-black/[0.08] dark:border-white/[0.08]"
                    />
                  </div>
                ),

                hr: () => (
                  <div className="my-16 border-t border-black/[0.08] dark:border-white/[0.06]" />
                ),
              }}
            >
              {post.markdownContent}
            </ReactMarkdown>
          </div>
        </article>

        {/* TOC */}
        {headings.length > 0 && (
          <aside className="hidden xl:block xl:col-span-3 border-l border-black/10 dark:border-white/[0.06]">
            <div className="sticky top-0 px-8 py-20">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-6">
                On this page
              </div>

              <nav className="space-y-4">
                {headings.map((heading) => (
                  <a
                    key={heading}
                    href={`#${getHeadingId(heading)}`}
                    className="block font-serif text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400 hover:text-[#C85A41] transition-colors"
                  >
                    {heading}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
