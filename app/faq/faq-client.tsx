"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUpRight,
  ArrowLeft,
  Search,
  BookOpen,
  Home,
  HelpCircle,
  Wifi,
  Users,
  Compass,
  Sparkles,
  Flag,
  Info,
  Calendar,
  Award,
  Activity,
  Heart,
  Coffee,
  Briefcase,
  MapPin,
  Phone,
  Shield,
  Clock
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  HelpCircle,
  Home,
  BookOpen,
  Compass,
  Wifi,
  Users,
  Sparkles,
  Flag,
  Info,
  Calendar,
  Award,
  Activity,
  Heart,
  Coffee,
  Briefcase,
  MapPin,
  Phone,
  Shield,
};
function renderFaqIcon(iconName: string, className = "size-3.5") {
  const IconComponent = ICON_MAP[iconName] || HelpCircle;
  return <IconComponent className={className} strokeWidth={1.5} />;
}
type FaqTag = {
  id: string;
  slug: string;
  label: string;
  icon: string;
};
type FaqQuestion = {
  id: string;
  slug: string;
  tag_slug: string;
  question: string;
  answer: string;
  order_index: number;
};
type Props = {
  initialTags: FaqTag[];
  initialQuestions: FaqQuestion[];
  initialSelectedSlug?: string;
};
export default function FaqClient({ initialTags, initialQuestions, initialSelectedSlug }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const initialSelectedId = useMemo(() => {
    if (initialSelectedSlug && initialQuestions) {
      const found = initialQuestions.find((q) => q && q.slug === initialSelectedSlug);
      if (found) return found.id;
    }
    return null;
  }, [initialSelectedSlug, initialQuestions]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(initialSelectedId);
  useEffect(() => {
    if (initialSelectedSlug && initialQuestions) {
      const found = initialQuestions.find((q) => q && q.slug === initialSelectedSlug);
      if (found) {
        setSelectedQuestionId(found.id);
      }
    }
  }, [initialSelectedSlug, initialQuestions]);
  const filteredQuestions = useMemo(() => {
    if (!initialQuestions) return [];
    return initialQuestions.filter((item) => {
      if (!item) return false;
      const matchesCategory = selectedCategory === "all" || item.tag_slug === selectedCategory;
      const matchesSearch =
        (item.question || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
        (item.answer || "").toLowerCase().includes((searchQuery || "").toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, initialQuestions]);
  useEffect(() => {
    if (!selectedQuestionId && filteredQuestions.length > 0) {
      if (window.innerWidth >= 1024) {
        setSelectedQuestionId(filteredQuestions[0].id);
        router.replace(`/faq/${filteredQuestions[0].slug}`, { scroll: false });
      }
    }
  }, [filteredQuestions, selectedQuestionId, router]);
  useEffect(() => {
    if (selectedQuestionId) {
      const exists = filteredQuestions.some((q) => q.id === selectedQuestionId);
      if (!exists && filteredQuestions.length > 0) {
        if (window.innerWidth >= 1024) {
          setSelectedQuestionId(filteredQuestions[0].id);
          router.replace(`/faq/${filteredQuestions[0].slug}`, { scroll: false });
        } else {
          setSelectedQuestionId(null);
          router.replace("/faq", { scroll: false });
        }
      } else if (!exists) {
        setSelectedQuestionId(null);
        router.replace("/faq", { scroll: false });
      }
    }
  }, [filteredQuestions, selectedQuestionId, router]);
  const handleSelectQuestion = (q: FaqQuestion) => {
    setSelectedQuestionId(q.id);
    router.push(`/faq/${q.slug}`, { scroll: false });
  };
  const handleBackToList = () => {
    setSelectedQuestionId(null);
    router.push("/faq", { scroll: false });
  };
  const activeQuestion = useMemo(() => {
    return initialQuestions.find((q) => q.id === selectedQuestionId) || null;
  }, [selectedQuestionId, initialQuestions]);
  const activeTag = useMemo(() => {
    if (!activeQuestion) return null;
    return initialTags.find((t) => t.slug === activeQuestion.tag_slug) || null;
  }, [activeQuestion, initialTags]);
  return (
    <main className="min-h-screen lg:h-screen w-full overflow-y-auto lg:overflow-hidden faq-custom-scrollbar bg-[#F7F7F2] dark:bg-[#121212] text-[#111] dark:text-[#F4F4F0] selection:bg-[#111] selection:text-[#F7F7F2] dark:selection:bg-[#F4F4F0] dark:selection:text-[#121212] transition-colors flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        .faq-custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .faq-custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .faq-custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(200, 90, 65, 0.25);
          border-radius: 9999px;
        }
        .faq-custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(200, 90, 65, 0.7);
        }
        .faq-custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(200, 90, 65, 0.25) transparent;
        }
      `}} />
      <header className="flex items-center justify-between border-b border-black/15 dark:border-white/15 font-mono text-[11px] uppercase tracking-[0.22em] shrink-0 h-14 px-4 md:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-[#C85A41] transition-colors"
        >
          <ArrowLeft className="size-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline">Return to Homepage</span>
          <span className="sm:hidden">Home</span>
        </Link>
        <div className="flex items-center gap-6">
          <span className="text-[10px] text-zinc-500 font-mono tracking-widest hidden lg:inline">
            NITJ FRESHER SURVIVAL HANDBOOK
          </span>
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">
        <div
          className={`w-full lg:w-[35%] xl:w-[30%] shrink-0 border-r border-black/15 dark:border-white/15 flex flex-col bg-black/[0.01] dark:bg-white/[0.01] transition-all duration-300 lg:h-full lg:overflow-y-auto faq-custom-scrollbar ${
            selectedQuestionId ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-6 border-b border-black/10 dark:border-white/10 space-y-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C85A41] font-semibold">
                CAMPUS ARCHIVES
              </span>
              <h1 className="mt-1 font-serif text-4xl tracking-tight font-medium">
                Survival Guide<span className="text-[#C85A41]">.</span>
              </h1>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-black/15 dark:border-white/15 rounded-none font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-[#C85A41] transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 faq-custom-scrollbar font-mono text-[10px] uppercase tracking-wider">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-[#111] text-[#F7F7F2] border-[#111] dark:bg-[#F4F4F0] dark:text-[#121212] dark:border-[#F4F4F0]"
                    : "bg-transparent text-zinc-700 dark:text-zinc-300 border-black/10 dark:border-white/10 hover:border-black/30"
                }`}
              >
                All
              </button>
              {initialTags.map((tag) => (
                <button
                  key={tag.slug}
                  onClick={() => setSelectedCategory(tag.slug)}
                  className={`px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === tag.slug
                      ? "bg-[#111] text-[#F7F7F2] border-[#111] dark:bg-[#F4F4F0] dark:text-[#121212] dark:border-[#F4F4F0]"
                      : "bg-transparent text-zinc-700 dark:text-zinc-300 border-black/10 dark:border-white/10 hover:border-black/30"
                  }`}
                >
                  {renderFaqIcon(tag.icon, "size-3")}
                  {(tag.label || "").split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto faq-custom-scrollbar divide-y divide-black/10 dark:divide-white/10">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q) => {
                const isSelected = q.id === selectedQuestionId;
                const tag = initialTags.find((t) => t.slug === q.tag_slug);
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className={`w-full text-left p-5 transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-white dark:bg-[#1a1a1a] border-l-4 border-l-[#C85A41] shadow-[inset_1px_0_0_rgba(0,0,0,0.05)]"
                        : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {tag && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                          {renderFaqIcon(tag.icon, "size-2.5")}
                          {tag.label}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-medium leading-snug text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {q.question}
                    </h3>
                  </button>
                );
              })
            ) : (
              <div className="p-10 text-center font-mono text-zinc-400 text-xs uppercase tracking-widest">
                No matching queries.
              </div>
            )}
          </div>
        </div>
        <div
          className={`flex-1 bg-white dark:bg-[#121212] flex flex-col transition-all duration-300 lg:h-full lg:overflow-y-auto faq-custom-scrollbar ${
            !selectedQuestionId ? "hidden lg:flex" : "flex"
          }`}
        >
          {activeQuestion ? (
            <div className="flex-1 max-w-[850px] mx-auto w-full px-6 md:px-12 py-10 md:py-16 flex flex-col justify-between">
              <div>
                <button
                  onClick={handleBackToList}
                  className="lg:hidden flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-[#C85A41] mb-8 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  ← Back to List
                </button>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C85A41] mb-4">
                  {activeTag && (
                    <span className="flex items-center gap-1.5 border border-[#C85A41]/10 bg-[#C85A41]/5 px-2.5 py-1 text-[9px]">
                      {renderFaqIcon(activeTag.icon, "size-3")}
                      {activeTag.label}
                    </span>
                  )}
                </div>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-tight text-[#111] dark:text-[#F4F4F0] font-semibold mb-8 pb-6 border-b border-black/10 dark:border-white/10"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {activeQuestion.question}
                </h2>
                <div className="prose dark:prose-invert max-w-none text-left faq-markdown-content selection:bg-[#C85A41]/20">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => {
                        const childArray = Array.isArray(children) ? children : [children];
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
                            className="text-[17px] md:text-[19px] leading-[1.85] text-zinc-700 dark:text-zinc-300 mb-6 last:mb-0"
                            style={{ fontFamily: "var(--font-lora)" }}
                          >
                            {children}
                          </p>
                        );
                      },
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
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
                      ul: ({ children }) => (
                        <ul className="my-6 ml-6 space-y-2.5 list-disc marker:text-[#C85A41]">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="my-6 ml-6 space-y-2.5 list-decimal marker:text-[#C85A41]">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li
                          className="text-[17px] md:text-[19px] leading-[1.8] text-zinc-700 dark:text-zinc-300"
                          style={{ fontFamily: "var(--font-lora)" }}
                        >
                          {children}
                        </li>
                      ),
                      table: ({ children }) => (
                        <div className="my-8 overflow-x-auto border border-black/[0.08] dark:border-white/[0.08] max-w-full">
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
                        <tr className="border-b border-black/[0.06] dark:border-white/[0.06] last:border-b-0">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th
                          className="px-5 py-3 text-left text-[12px] uppercase tracking-[0.12em] text-[#111] dark:text-[#F5F1EA]"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td
                          className="px-5 py-4 text-[15px] leading-[1.6] text-zinc-700 dark:text-zinc-300 align-top"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {children}
                        </td>
                      ),
                      code: ({ inline, children }: any) => {
                        if (inline) {
                          return (
                            <code
                              className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded px-1.5 py-0.5 text-[14px] text-[#C85A41] font-mono"
                            >
                              {children}
                            </code>
                          );
                        }
                        return (
                          <code
                            className="text-[13px] leading-6 text-[#111] dark:text-[#EDE7DD] font-mono"
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <div className="my-8 overflow-hidden border border-black/[0.08] dark:border-white/[0.06] bg-[#EFEAE1] dark:bg-[#171717] rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                          <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed">
                            {children}
                          </pre>
                        </div>
                      ),
                      img: ({ src, alt }) => (
                        <div className="my-8">
                          <img
                            src={src || ""}
                            alt={alt || ""}
                            className="max-w-full h-auto border border-black/[0.08] dark:border-white/[0.08] mx-auto shadow-sm"
                          />
                        </div>
                      ),
                      hr: () => (
                        <div className="my-10 border-t border-black/[0.08] dark:border-white/[0.06]" />
                      ),
                    }}
                  >
                    {activeQuestion.answer}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="mt-16 pt-6 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 font-mono text-[10px] text-zinc-400">
                <span className="uppercase tracking-wider">
                  OpenSource @ NITJ Editorial
                </span>
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="size-3" />
                  Continuous Updates
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 font-mono text-zinc-400">
              <BookOpen className="size-10 mb-4 stroke-[1.25] text-zinc-300 dark:text-zinc-700" />
              <h2 className="font-serif text-2xl text-zinc-800 dark:text-zinc-200 mb-2">
                Survival Handbook Archives
              </h2>
              <p className="max-w-xs text-xs uppercase tracking-wider leading-relaxed text-zinc-500">
                Select a query from the index on the left to read full answers and campus references.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
