"use client";

import { useState, useTransition, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Check,
  Eye,
  BookOpen,
} from "lucide-react";
import type { Dispatch } from "@/lib/dispatch";
import { saveDispatchAction } from "@/app/admin/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AdminDispatchEditorProps {
  dispatch?: Dispatch | null;
}

export default function AdminDispatchEditor({ dispatch = null }: AdminDispatchEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [formData, setFormData] = useState({
    title: dispatch?.title || "",
    slug: dispatch?.slug || "",
    authorName: dispatch?.author.name || "OpenSource @ NITJ",
    authorGithub: dispatch?.author.github || "Opensource-NITJ",
    date: dispatch
      ? new Date(dispatch.date).toISOString().substring(0, 16)
      : new Date().toISOString().substring(0, 16),
    readTime: dispatch?.readTime !== undefined ? dispatch.readTime : 1,
    markdownContent: dispatch?.markdownContent || "",
  });

  const [isDirty, setIsDirty] = useState(false);
  const [isReadTimeManuallyEdited, setIsReadTimeManuallyEdited] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Sync isDirty
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Helper: auto-generate slug from title
  const handleTitleChange = (title: string) => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .trim()
      .replace(/\s+/g, "-"); // replace spaces with hyphens

    setFormData((prev) => {
      const isSlugAutoFilled =
        prev.slug === "" ||
        prev.slug ===
          prev.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

      return {
        ...prev,
        title,
        slug: isSlugAutoFilled ? generatedSlug : prev.slug,
      };
    });
    setIsDirty(true);
  };

  // Helper: auto-calculate read time
  const handleContentChange = (content: string) => {
    setFormData((prev) => {
      let updatedReadTime = prev.readTime;
      if (!isReadTimeManuallyEdited) {
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
        updatedReadTime = Math.max(1, Math.ceil(wordCount / 200));
      }
      return {
        ...prev,
        markdownContent: content,
        readTime: updatedReadTime,
      };
    });
    setIsDirty(true);
  };

  // Prevent accidental navigation/closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Discard them?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Handle Back Button Click
  const handleBackClick = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      router.push("/admin/dispatches");
    }
  };

  // Confirm Discard Changes
  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setIsDirty(false);
    router.push("/admin/dispatches");
  };

  // Handle Form Submit
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.slug || !formData.markdownContent) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const formattedDate = new Date(formData.date).toISOString();
      const payload = {
        id: dispatch?.id,
        title: formData.title,
        slug: formData.slug,
        authorName: formData.authorName,
        authorGithub: formData.authorGithub,
        date: formattedDate,
        readTime: Number(formData.readTime) || 1, // Fallback to 1 if empty
        markdownContent: formData.markdownContent,
      };

      const result = await saveDispatchAction({}, payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message || "Dispatch saved successfully!");
      setIsDirty(false);
      
      setTimeout(() => {
        router.push("/admin/dispatches");
        router.refresh();
      }, 1000);
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-69px)] relative font-mono text-left">
      {/* Editor Sub-Header */}
      <div className="px-6 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="p-1.5 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-1.5 text-xs uppercase"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <span className="text-zinc-400 font-normal">|</span>
          <h2 className="font-serif text-lg font-medium">
            {dispatch ? `Edit: ${dispatch.title}` : "New Dispatch"}
          </h2>
          {isDirty && (
            <span className="text-[10px] text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-sm bg-amber-500/5 animate-pulse">
              Unsaved Changes
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2 bg-[#C85A41] hover:bg-[#b04a32] text-white transition-opacity text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer font-mono"
        >
          {isPending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Dispatch"
          )}
        </button>
      </div>

      {/* Editor & Preview Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden h-full">
        {/* Left Side: Form Editor */}
        <form
          onSubmit={handleSave}
          className="flex flex-col h-full p-6 overflow-y-auto space-y-5 border-r border-black/10 dark:border-white/10 bg-white dark:bg-[#121212]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
                placeholder="Enter dispatch title"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Slug
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
                placeholder="e.g. initial-release"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Author Name */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Author Name
              </label>
              <input
                type="text"
                required
                value={formData.authorName}
                onChange={(e) => handleInputChange("authorName", e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
              />
            </div>

            {/* Author GitHub */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                GitHub Username
              </label>
              <input
                type="text"
                required
                value={formData.authorGithub}
                onChange={(e) => handleInputChange("authorGithub", e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
                placeholder="GitHub username (no @)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Publish Date
              </label>
              <input
                type="datetime-local"
                required
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
              />
            </div>

            {/* Read Time */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                Read Time (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={(formData.readTime as any) === "" ? "" : formData.readTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsReadTimeManuallyEdited(true);
                  setFormData((prev) => ({
                    ...prev,
                    readTime: val === "" ? "" as any : parseInt(val),
                  }));
                  setIsDirty(true);
                }}
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 px-3 py-2 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono"
              />
            </div>
          </div>

          {/* Markdown Content */}
          <div className="flex-1 flex flex-col space-y-1 pb-4">
            <label className="text-[10px] uppercase tracking-wider text-zinc-500 block">
              Markdown Content
            </label>
            <textarea
              required
              value={formData.markdownContent}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full flex-1 bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 p-4 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono resize-none min-h-[350px]"
              placeholder="# Hello World&#10;&#10;Write markdown content here..."
            />
          </div>
        </form>

        {/* Right Side: Live Renderer Preview */}
        <div className="overflow-y-auto bg-[#F7F7F2] dark:bg-[#101014] p-6 md:p-10 border-t lg:border-t-0 border-black/10 dark:border-white/10 h-full">
          <div className="max-w-[680px] mx-auto w-full select-text">
            {/* Meta */}
            <div className="mb-6 text-[10px] uppercase tracking-[0.22em] text-[#C85A41]">
              Technical Dispatch Preview
            </div>

            {/* Title */}
            <h1
              className="text-4xl md:text-5xl leading-[1.1] tracking-[-0.03em] text-[#111] dark:text-[#F5F1EA] font-semibold mb-6"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              {formData.title || "Untitled Dispatch"}
            </h1>

            {/* Info */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 border-b border-black/10 dark:border-white/[0.06] pb-6 mb-8 font-mono">
              <div>By @{formData.authorGithub}</div>
              <div>
                {formData.date
                  ? new Date(formData.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Date"}
              </div>
              <div>{formData.readTime || 1} min read</div>
            </div>

            {/* Rendered Markdown Content */}
            <div
              className="prose dark:prose-invert max-w-none text-left"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {formData.markdownContent.trim() === "" ? (
                <p className="text-zinc-400 italic text-sm font-mono">
                  No content written yet.
                </p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2
                        className="mt-14 mb-5 text-2xl md:text-3xl leading-[1.2] tracking-[-0.02em] text-[#111] dark:text-[#F5F1EA] font-semibold border-b border-black/5 dark:border-white/5 pb-2"
                        style={{ fontFamily: "var(--font-lora)" }}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3
                        className="mt-10 mb-4 text-xl md:text-2xl leading-[1.2] tracking-[-0.01em] text-[#111] dark:text-[#F5F1EA] font-medium"
                        style={{ fontFamily: "var(--font-lora)" }}
                      >
                        {children}
                      </h3>
                    ),
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
                          className="text-base md:text-lg leading-[1.8] text-[#3A3936] dark:text-[#DDD6CB] mb-6"
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
                    blockquote: ({ children }) => (
                      <blockquote className="my-8 pl-6 border-l-2 border-[#C85A41] italic text-zinc-700 dark:text-[#F1E8DD]">
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-6 ml-6 space-y-2 list-disc marker:text-[#C85A41]">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-6 ml-6 space-y-2 list-decimal marker:text-[#C85A41]">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li
                        className="text-base leading-[1.7] text-[#3A3936] dark:text-[#DDD6CB]"
                        style={{ fontFamily: "var(--font-lora)" }}
                      >
                        {children}
                      </li>
                    ),
                    table: ({ children }) => (
                      <div className="my-8 overflow-x-auto border border-black/[0.08] dark:border-white/[0.08]">
                        <table className="w-full border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/[0.08] dark:border-white/[0.08]">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => (
                      <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#111] dark:text-[#F5F1EA]">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 align-top">{children}</td>
                    ),
                    code: ({ inline, children }: any) => {
                      if (inline) {
                        return (
                          <code className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded px-1.5 py-0.5 text-sm text-[#C85A41]">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="text-sm leading-6 text-[#111] dark:text-[#EDE7DD]">
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => (
                      <div className="my-8 overflow-hidden border border-black/[0.08] dark:border-white/[0.06] bg-[#EFEAE1] dark:bg-[#171717] rounded-sm">
                        <div className="px-4 py-2 border-b border-black/[0.08] dark:border-white/[0.06] text-[10px] uppercase tracking-[0.22em] text-zinc-500 font-mono">
                          Code Preview
                        </div>
                        <pre className="overflow-x-auto p-4">{children}</pre>
                      </div>
                    ),
                    img: ({ src, alt }) => (
                      <div className="my-8">
                        <img
                          src={src || ""}
                          alt={alt || ""}
                          className="w-full border border-black/[0.08] dark:border-white/[0.08] rounded-sm"
                        />
                      </div>
                    ),
                    hr: () => (
                      <div className="my-10 border-t border-black/[0.08] dark:border-white/[0.06]" />
                    ),
                  }}
                >
                  {formData.markdownContent}
                </ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-full">
                <AlertTriangle className="size-6" />
              </div>
              <h4 className="font-serif text-xl font-bold">Discard Unsaved Changes?</h4>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              You have made modifications to this dispatch. Going back will discard all unsaved edits. Are you sure you want to proceed?
            </p>

            <div className="flex items-center justify-end gap-3 font-mono">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 border border-black/10 dark:border-white/10 text-xs uppercase tracking-wider hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Loading Indicator during Transition */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 dark:bg-white/5 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 p-4 flex items-center gap-3 rounded-sm shadow-md font-mono text-xs">
            <Loader2 className="size-4 animate-spin text-[#C85A41]" />
            <span>Saving dispatch changes...</span>
          </div>
        </div>
      )}
    </div>
  );
}
