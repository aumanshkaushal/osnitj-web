"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Link2 } from "lucide-react";
import { getDispatchBySlug, type Dispatch } from "@/lib/dispatch";
import ThemeToggle from "@/components/theme-toggle";

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

export default function DispatchPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    getDispatchBySlug(slug).then((d) => {
      setDispatch(d);
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
    return dispatch ? extractHeadings(dispatch.markdownContent) : [];
  }, [dispatch]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] flex items-center justify-center transition-colors antialiased">
        <p
          className="text-xs uppercase tracking-[0.22em] text-zinc-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Loading dispatch...
        </p>
      </main>
    );
  }

  if (!dispatch) {
    return (
      <main className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] flex items-center justify-center px-6 transition-colors antialiased">
        <div className="text-center">
          <h1
            className="text-5xl mb-5"
            style={{ fontFamily: "var(--font-lora)" }}
          >
            Dispatch not found
          </h1>

          <Link
            href="/dispatches"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#C85A41]"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <ArrowLeft className="size-3.5" />
            Return
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#F7F7F2] dark:bg-[#101014] text-[#111] dark:text-[#ECE7DF] selection:bg-[#C85A41] selection:text-black transition-colors antialiased bg-[radial-gradient(circle_at_top,rgba(200,90,65,0.03),transparent_40%)] animate-[fadeIn_.4s_ease]"
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {/* Reading Progress */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-[#C85A41] z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/[0.06] backdrop-blur-xl sticky top-0 z-40 bg-[#F7F7F2]/80 dark:bg-[#101014]/80">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link
            href="/dispatches"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-zinc-600 dark:text-zinc-500 hover:text-[#C85A41] transition-colors"
            style={{ fontFamily: "var(--font-inter)" }}
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
          <div className="max-w-[680px]">
            {/* Meta */}
            <div
              className="mb-10 text-[10px] uppercase tracking-[0.22em] text-[#C85A41]"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Technical Dispatch
            </div>

            {/* Title */}
            <h1
              className="text-[3.2rem] md:text-[4.5rem] leading-[1.05] tracking-[-0.03em] text-[#111] dark:text-[#F5F1EA] text-balance font-semibold"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {dispatch.title}
            </h1>

            {/* Info */}
            <div
              className="mt-10 flex flex-wrap items-center gap-6 text-[13px] text-zinc-600 dark:text-zinc-500 border-b border-black/10 dark:border-white/[0.06] pb-10"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <div>
                By{" "}
                <a
                  href={`https://github.com/${dispatch.author.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#C85A41] hover:underline"
                >
                  @{dispatch.author.github}
                </a>
              </div>

              <div>
                {new Date(dispatch.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              <div>{dispatch.readTime} min read</div>
            </div>

            {/* Content */}
            <div className="mt-14">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => {
                    const id = getHeadingId(getNodeText(children));

                    return (
                      <h2
                        id={id}
                        className="group scroll-mt-32 mt-24 mb-7 text-[2.2rem] leading-[1.15] tracking-[-0.03em] text-[#111] dark:text-[#F5F1EA] font-semibold"
                        style={{ fontFamily: "var(--font-lora)" }}
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
                    <h3
                      className="mt-16 mb-5 text-[1.75rem] leading-[1.2] tracking-[-0.02em] text-[#111] dark:text-[#F5F1EA] font-medium"
                      style={{ fontFamily: "var(--font-lora)" }}
                    >
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => {
                    const childArray = Array.isArray(children)
                      ? children
                      : [children];

                    const hasBlockContent = childArray.some((child: any) => {
                      if (!child || typeof child === "string") return false;
                      return (
                        child?.type === "img" ||
                        child?.props?.node?.tagName === "img" ||
                        child?.props?.node?.tagName === "pre" ||
                        child?.props?.node?.tagName === "blockquote" ||
                        child?.props?.node?.tagName === "table"
                      );
                    });

                    if (hasBlockContent) {
                      return <>{children}</>;
                    }

                    return (
                      <p
                        className="text-[21px] leading-[2.0] text-[#3A3936] dark:text-[#DDD6CB] mb-9"
                        style={{ fontFamily: "var(--font-lora)" }}
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
                    <strong
                      className="font-semibold text-[#111] dark:text-[#F5F1EA]"
                      style={{ fontFamily: "var(--font-lora)" }}
                    >
                      {children}
                    </strong>
                  ),

                  blockquote: ({ children }) => (
                    <blockquote className="my-14 pl-8 border-l-2 border-[#C85A41]">
                      <div
                        className="italic text-[1.5rem] leading-[1.7] tracking-[-0.01em] text-zinc-800 dark:text-[#F1E8DD]"
                        style={{ fontFamily: "var(--font-lora)" }}
                      >
                        {children}
                      </div>
                    </blockquote>
                  ),

                  ul: ({ children }) => (
                    <ul className="my-9 ml-6 space-y-3 list-disc marker:text-[#C85A41]">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="my-9 ml-6 space-y-3 list-decimal marker:text-[#C85A41]">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li
                      className="text-[21px] leading-[1.95] text-[#3A3936] dark:text-[#DDD6CB]"
                      style={{ fontFamily: "var(--font-lora)" }}
                    >
                      {children}
                    </li>
                  ),

                  table: ({ children }) => (
                    <div className="my-12 overflow-x-auto border border-black/[0.08] dark:border-white/[0.08]">
                      <table className="w-full border-collapse">
                        {children}
                      </table>
                    </div>
                  ),

                  thead: ({ children }) => (
                    <thead className="bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/[0.08] dark:border-white/[0.08]">
                      {children}
                    </thead>
                  ),

                  tbody: ({ children }) => <tbody>{children}</tbody>,

                  tr: ({ children }) => (
                    <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                      {children}
                    </tr>
                  ),

                  th: ({ children }) => (
                    <th
                      className="px-5 py-4 text-left text-[13px] uppercase tracking-[0.12em] text-[#111] dark:text-[#F5F1EA]"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {children}
                    </th>
                  ),

                  td: ({ children }) => (
                    <td
                      className="px-5 py-5 text-[16px] leading-[1.8] text-zinc-700 dark:text-zinc-300 align-top"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {children}
                    </td>
                  ),

                  code: ({ inline, children }: any) => {
                    if (inline) {
                      return (
                        <code
                          className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded px-1.5 py-0.5 text-[15px] text-[#C85A41]"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <code
                        className="text-[14px] leading-7 text-[#111] dark:text-[#EDE7DD]"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {children}
                      </code>
                    );
                  },

                  pre: ({ children }) => (
                    <div className="my-12 overflow-hidden border border-black/[0.08] dark:border-white/[0.06] bg-[#EFEAE1] dark:bg-[#171717] rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      <div
                        className="px-4 py-2 border-b border-black/[0.08] dark:border-white/[0.06] text-[10px] uppercase tracking-[0.22em] text-zinc-500"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        Code
                      </div>

                      <pre className="overflow-x-auto px-5 py-5">
                        {children}
                      </pre>
                    </div>
                  ),

                  img: ({ src, alt }) => (
                    <div className="my-14">
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
                {dispatch.markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        </article>

        {/* TOC */}
        {headings.length > 0 && (
          <aside className="hidden xl:block xl:col-span-3 border-l border-black/10 dark:border-white/[0.06]">
            <div className="sticky top-20 px-8 py-20">
              <div
                className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-6"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                On this page
              </div>

              <nav className="space-y-3">
                {headings.map((heading) => (
                  <a
                    key={heading}
                    href={`#${getHeadingId(heading)}`}
                    className="block text-[16px] leading-[1.8] text-zinc-600 dark:text-zinc-400 hover:text-[#C85A41] transition-colors"
                    style={{ fontFamily: "var(--font-lora)" }}
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
