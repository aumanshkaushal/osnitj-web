"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Moon, Sun, Link2 } from "lucide-react";
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
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    getPostBySlug(slug).then((p) => {
      setPost(p);
      setLoading(false);
    });
  }, [slug]);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress = (scrollTop / docHeight) * 100;
      setScrollProgress(progress);
    }

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headings = useMemo(() => {
    return post ? extractHeadings(post.markdownContent) : [];
  }, [post]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] flex items-center justify-center transition-colors antialiased">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
          Loading dispatch...
        </p>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] flex items-center justify-center px-6 transition-colors antialiased">
        <div className="text-center">
          <h1 className="font-serif text-5xl mb-5">Post not found</h1>

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

  let paragraphIndex = 0;

  return (
    <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] selection:bg-[#C85A41] selection:text-black transition-colors antialiased bg-[radial-gradient(circle_at_top,rgba(200,90,65,0.03),transparent_40%)] animate-[fadeIn_.4s_ease]">
      {/* Reading Progress */}
      <div
        className="fixed top-0 left-0 h-px bg-[#C85A41] z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/[0.06] backdrop-blur-xl sticky top-0 z-40 bg-[#F7F7F2]/80 dark:bg-[#101014]/80">
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
        <div className="hidden xl:block xl:col-span-2" />

        {/* Article */}
        <article className="col-span-12 xl:col-span-7 px-5 md:px-12 lg:px-16 py-14 md:py-24">
          <div className="max-w-[620px]">
            {/* Meta */}
            <div className="mb-10 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C85A41]">
              Technical Dispatch
            </div>

            {/* Title */}
            <h1 className="font-serif text-[3.5rem] md:text-[5rem] leading-[0.95] tracking-[-0.05em] text-[#111] dark:text-[#F5F1EA] text-balance">
              {post.title}
            </h1>

            {/* Info */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-zinc-600 dark:text-zinc-500 border-b border-black/10 dark:border-white/[0.06] pb-10">
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

            {/* Content */}
            <div className="mt-14">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => {
                    const id = getHeadingId(getNodeText(children));

                    return (
                      <h2
                        id={id}
                        className="group scroll-mt-32 mt-28 mb-8 font-serif text-[2.4rem] leading-[1.05] tracking-[-0.04em] text-[#111] dark:text-[#F5F1EA]"
                      >
                        <a
                          href={`#${id}`}
                          className="inline-flex items-center gap-3"
                        >
                          {children}

                          <Link2 className="size-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#C85A41]" />
                        </a>
                      </h2>
                    );
                  },

                  h3: ({ children }) => (
                    <h3 className="mt-20 mb-5 font-serif text-[2rem] leading-[1.1] tracking-[-0.03em] text-[#111] dark:text-[#F5F1EA]">
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => {
                    paragraphIndex++;

                    const childArray = Array.isArray(children)
                      ? children
                      : [children];

                    const hasBlockContent = childArray.some((child: any) => {
                      if (!child || typeof child === "string") {
                        return false;
                      }

                      return (
                        child?.type === "img" ||
                        child?.props?.node?.tagName === "img" ||
                        child?.props?.node?.tagName === "pre" ||
                        child?.props?.node?.tagName === "blockquote"
                      );
                    });

                    if (hasBlockContent) {
                      return <>{children}</>;
                    }

                    const isFirst = paragraphIndex === 1;

                    return (
                      <p
                        className={`font-serif text-[19px] leading-[1.95] text-[#3A3936] dark:text-[#DDD6CB] mb-10 ${
                          isFirst
                            ? "first-letter:text-7xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:leading-[0.9] first-letter:text-[#C85A41]"
                            : ""
                        }`}
                      >
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
                    <blockquote className="my-16 pl-8 border-l-2 border-[#C85A41]">
                      <div className="font-serif italic text-[28px] leading-[1.5] tracking-[-0.02em] text-zinc-800 dark:text-[#F1E8DD]">
                        {children}
                      </div>
                    </blockquote>
                  ),

                  ul: ({ children }) => (
                    <ul className="my-10 ml-6 space-y-4 list-disc marker:text-[#C85A41]">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="my-10 ml-6 space-y-4 list-decimal marker:text-[#C85A41]">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li className="font-serif text-[19px] leading-[1.9] text-[#3A3936] dark:text-[#DDD6CB]">
                      {children}
                    </li>
                  ),

                  code: ({ inline, children }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded px-1.5 py-0.5 text-[15px] font-mono text-[#C85A41]">
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
                    <div className="my-14 overflow-hidden border border-black/[0.08] dark:border-white/[0.06] bg-[#EFEAE1] dark:bg-[#171717] rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      <div className="px-4 py-2 border-b border-black/[0.08] dark:border-white/[0.06] font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                        Code
                      </div>

                      <pre className="overflow-x-auto px-5 py-5">
                        {children}
                      </pre>
                    </div>
                  ),

                  img: ({ src, alt }) => (
                    <div className="my-16">
                      <img
                        src={src || ""}
                        alt={alt || ""}
                        className="w-full border border-black/[0.08] dark:border-white/[0.08]"
                      />
                    </div>
                  ),

                  hr: () => (
                    <div className="my-20 border-t border-black/[0.08] dark:border-white/[0.06]" />
                  ),
                }}
              >
                {post.markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        {/* TOC */}
        {headings.length > 0 && (
          <aside className="hidden xl:block xl:col-span-3 border-l border-black/10 dark:border-white/[0.06]">
            <div className="sticky top-20 px-8 py-20">
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
