"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
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
  Check,
  ChevronDown,
  Bold,
  Italic,
  Heading3,
  Link as LinkIcon,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Code,
  Upload,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import {
  saveFaqTagAction,
  deleteFaqTagAction,
  saveFaqQuestionAction,
  deleteFaqQuestionAction
} from "../actions";
const ICON_OPTIONS = [
  { name: "HelpCircle", icon: HelpCircle },
  { name: "Home", icon: Home },
  { name: "BookOpen", icon: BookOpen },
  { name: "Compass", icon: Compass },
  { name: "Wifi", icon: Wifi },
  { name: "Users", icon: Users },
  { name: "Sparkles", icon: Sparkles },
  { name: "Flag", icon: Flag },
  { name: "Info", icon: Info },
  { name: "Calendar", icon: Calendar },
  { name: "Award", icon: Award },
  { name: "Activity", icon: Activity },
  { name: "Heart", icon: Heart },
  { name: "Coffee", icon: Coffee },
  { name: "Briefcase", icon: Briefcase },
  { name: "MapPin", icon: MapPin },
  { name: "Phone", icon: Phone },
  { name: "Shield", icon: Shield },
];
function renderLucideIcon(iconName: string, className = "size-4") {
  const option = ICON_OPTIONS.find((opt) => opt.name === iconName);
  const IconComponent = option ? option.icon : HelpCircle;
  return <IconComponent className={className} />;
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
};
export default function FaqManagerClient({ initialTags, initialQuestions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "tag" | "question";
    idOrSlug: string;
    label?: string;
  } | null>(null);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [questionId, setQuestionId] = useState("");
  const [questionSlug, setQuestionSlug] = useState("");
  const [questionTagSlug, setQuestionTagSlug] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [questionOrderIndex, setQuestionOrderIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isTagFormOpen, setIsTagFormOpen] = useState(false);
  const [isNewTag, setIsNewTag] = useState(true);
  const [tagSlug, setTagSlug] = useState("");
  const [tagLabel, setTagLabel] = useState("");
  const [tagIcon, setTagIcon] = useState("HelpCircle");
  const filteredQuestions = activeTab === "all"
    ? initialQuestions
    : initialQuestions.filter((q) => q.tag_slug === activeTab);
  const insertMarkdown = (syntaxBefore: string, syntaxAfter = "") => {
    const textarea = document.getElementById("faq-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = syntaxBefore + selectedText + syntaxAfter;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setQuestionAnswer(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + selectedText.length
      );
    }, 0);
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to upload image.");
      }
      const cleanFileName = file.name.split(".")[0].replace(/[^a-zA-Z0-9]/g, "-");
      insertMarkdown(`![${cleanFileName}](${data.url})`, "");
      toast.success("Image uploaded and inserted successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };
  const handleQuestionTitleChange = (title: string) => {
    setQuestionText(title);
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setQuestionSlug((prev) => {
      const prevAutoSlug = questionText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      if (prev === "" || prev === prevAutoSlug) {
        return generatedSlug;
      }
      return prev;
    });
  };
  const openNewQuestionForm = () => {
    setQuestionId("");
    setQuestionSlug("");
    setQuestionTagSlug(initialTags[0]?.slug || "");
    setQuestionText("");
    setQuestionAnswer("");
    setQuestionOrderIndex(10);
    setIsQuestionFormOpen(true);
  };
  const openEditQuestionForm = (q: FaqQuestion) => {
    setQuestionId(q.id);
    setQuestionSlug(q.slug);
    setQuestionTagSlug(q.tag_slug);
    setQuestionText(q.question);
    setQuestionAnswer(q.answer);
    setQuestionOrderIndex(q.order_index);
    setIsQuestionFormOpen(true);
  };
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionTagSlug || !questionText || !questionAnswer) {
      toast.error("Please fill in all required fields.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await saveFaqQuestionAction({
          id: questionId || undefined,
          slug: questionSlug,
          tag_slug: questionTagSlug,
          question: questionText,
          answer: questionAnswer,
          order_index: questionOrderIndex,
        });
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message);
          setIsQuestionFormOpen(false);
          router.refresh();
        }
      } catch (err: any) {
        console.error("Save FAQ question error:", err);
        toast.error(err?.message || "An unexpected error occurred while saving the question.");
      }
    });
  };
  const triggerDeleteQuestion = (id: string) => {
    setDeleteTarget({ type: "question", idOrSlug: id });
    setDeleteConfirmOpen(true);
  };
  const openNewTagForm = () => {
    setIsNewTag(true);
    setTagSlug("");
    setTagLabel("");
    setTagIcon("HelpCircle");
    setIsTagFormOpen(true);
  };
  const openEditTagForm = (tag: FaqTag) => {
    setIsNewTag(false);
    setTagSlug(tag.slug);
    setTagLabel(tag.label);
    setTagIcon(tag.icon);
    setIsTagFormOpen(true);
  };
  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagSlug || !tagLabel || !tagIcon) {
      toast.error("Please fill in all required fields.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await saveFaqTagAction({
          slug: tagSlug,
          label: tagLabel,
          icon: tagIcon,
          isNew: isNewTag,
        });
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(res.message);
          setIsTagFormOpen(false);
          router.refresh();
        }
      } catch (err: any) {
        console.error("Save FAQ tag error:", err);
        toast.error(err?.message || "An unexpected error occurred while saving the category.");
      }
    });
  };
  const triggerDeleteTag = (slug: string, label: string) => {
    setDeleteTarget({ type: "tag", idOrSlug: slug, label });
    setDeleteConfirmOpen(true);
  };
  const confirmDeletion = () => {
    if (!deleteTarget) return;
    const { type, idOrSlug } = deleteTarget;
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
    if (type === "tag") {
      startTransition(async () => {
        try {
          const res = await deleteFaqTagAction(idOrSlug);
          if (res.error) {
            toast.error(res.error);
          } else {
            toast.success(res.message);
            if (activeTab === idOrSlug) setActiveTab("all");
            router.refresh();
          }
        } catch (err: any) {
          console.error("Delete FAQ tag error:", err);
          toast.error(err?.message || "An unexpected error occurred while deleting the category.");
        }
      });
    } else {
      startTransition(async () => {
        try {
          const res = await deleteFaqQuestionAction(idOrSlug);
          if (res.error) {
            toast.error(res.error);
          } else {
            toast.success(res.message);
            router.refresh();
          }
        } catch (err: any) {
          console.error("Delete FAQ question error:", err);
          toast.error(err?.message || "An unexpected error occurred while deleting the question.");
        }
      });
    }
  };
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-zinc-500 hover:text-[#C85A41] transition-colors mb-3 font-mono"
          >
            <ArrowLeft className="size-3" />
            Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">
            FAQ Survival Guide Manager<span className="text-[#C85A41]">.</span>
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Create, edit, and reorganize FAQ items and categories for freshers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openNewTagForm}
            className="px-4 py-2 border border-black/15 dark:border-white/15 hover:border-[#C85A41] hover:text-[#C85A41] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            + New Category
          </button>
          <button
            onClick={openNewQuestionForm}
            className="px-4 py-2 bg-black dark:bg-[#F4F4F0] text-[#F7F7F2] dark:text-[#121212] hover:opacity-90 text-xs font-mono uppercase tracking-wider transition-opacity cursor-pointer border border-transparent"
          >
            + Add Question
          </button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="border border-black/10 dark:border-white/10 p-5 rounded-none bg-black/[0.01] dark:bg-white/[0.01]">
            <h2 className="font-serif text-xl mb-4 border-b border-black/5 dark:border-white/5 pb-2">
              Categories
            </h2>
            <div className="space-y-1.5 font-mono text-xs uppercase tracking-wider">
              <button
                onClick={() => setActiveTab("all")}
                className={`w-full flex items-center justify-between px-3 py-2.5 border transition-all text-left ${
                  activeTab === "all"
                    ? "bg-[#111] text-[#F7F7F2] border-[#111] dark:bg-[#F4F4F0] dark:text-[#121212] dark:border-[#F4F4F0]"
                    : "bg-transparent text-zinc-700 dark:text-zinc-300 border-black/5 dark:border-white/5 hover:border-black/25 dark:hover:border-white/25"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="size-3.5" />
                  <span>All Categories</span>
                </div>
                <span className="tabular-nums opacity-60">({initialQuestions.length})</span>
              </button>
              {initialTags.map((tag) => {
                const count = initialQuestions.filter((q) => q.tag_slug === tag.slug).length;
                const isActive = activeTab === tag.slug;
                return (
                  <div key={tag.slug} className="group relative flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab(tag.slug)}
                      className={`flex-1 flex items-center justify-between px-3 py-2.5 border transition-all text-left ${
                        isActive
                          ? "bg-[#111] text-[#F7F7F2] border-[#111] dark:bg-[#F4F4F0] dark:text-[#121212] dark:border-[#F4F4F0]"
                          : "bg-transparent text-zinc-700 dark:text-zinc-300 border-black/5 dark:border-white/5 hover:border-black/25 dark:hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {renderLucideIcon(tag.icon, "size-3.5")}
                        <span>{tag.label}</span>
                      </div>
                      <span className="tabular-nums opacity-60">({count})</span>
                    </button>
                    <div className="flex items-center border border-black/5 dark:border-white/5 h-[38px] divide-x divide-black/5 dark:divide-white/5 bg-white dark:bg-[#171717]">
                      <button
                        onClick={() => openEditTagForm(tag)}
                        className="px-2 hover:text-[#C85A41] transition-colors h-full flex items-center cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        onClick={() => triggerDeleteTag(tag.slug, tag.label)}
                        className="px-2 hover:text-red-500 transition-colors h-full flex items-center cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <h2 className="font-serif text-2xl">
              Questions & Answers ({filteredQuestions.length})
            </h2>
            <span className="font-mono text-[10px] uppercase text-zinc-400">
              Ordered by order index
            </span>
          </div>
          {filteredQuestions.length > 0 ? (
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const parentTag = initialTags.find((t) => t.slug === q.tag_slug);
                return (
                  <div
                    key={q.id}
                    className="border border-black/10 dark:border-white/10 p-5 bg-white dark:bg-[#171717] hover:border-black/25 dark:hover:border-white/25 transition-all relative"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {parentTag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black/10 dark:border-white/10 font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                            {renderLucideIcon(parentTag.icon, "size-2.5")}
                            {parentTag.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase">
                        <button
                          onClick={() => openEditQuestionForm(q)}
                          className="hover:text-[#C85A41] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="size-3" /> Edit
                        </button>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <button
                          onClick={() => triggerDeleteQuestion(q.id)}
                          className="hover:text-red-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="size-3" /> Delete
                        </button>
                      </div>
                    </div>
                    <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                      {q.question}
                    </h3>
                    <div className="prose dark:prose-invert max-w-none text-left faq-markdown-content font-serif">
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
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3 last:mb-0">
                                {children}
                              </p>
                            );
                          },
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#C85A41] underline"
                            >
                              {children}
                            </a>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-2 ml-5 space-y-1 list-disc marker:text-[#C85A41]">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-2 ml-5 space-y-1 list-decimal marker:text-[#C85A41]">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              {children}
                            </li>
                          ),
                          table: ({ children }) => (
                            <div className="my-3 overflow-x-auto border border-black/[0.08] dark:border-white/[0.08] max-w-full">
                              <table className="w-full border-collapse">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-[#111] dark:text-[#F5F1EA] bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.08] dark:border-white/[0.08]">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 text-[13px] text-zinc-600 dark:text-zinc-400 border-b border-black/[0.06] dark:border-white/[0.06] align-top">
                              {children}
                            </td>
                          ),
                          code: ({ inline, children }: any) => (
                            <code className="bg-black/[0.04] dark:bg-white/[0.04] px-1 py-0.5 rounded text-xs text-[#C85A41] font-mono">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {q.answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-black/15 dark:border-white/15 p-12 text-center font-mono rounded-sm bg-black/[0.01] dark:bg-white/[0.01]">
              <HelpCircle className="size-8 mx-auto text-zinc-400 mb-3" />
              <p className="text-xs uppercase tracking-widest text-zinc-500">No questions found in this category.</p>
              <button
                onClick={openNewQuestionForm}
                className="mt-4 text-[10px] text-[#C85A41] uppercase tracking-widest hover:underline cursor-pointer"
              >
                Add the first question
              </button>
            </div>
          )}
        </div>
      </div>
      {isQuestionFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F7F2] dark:bg-[#171717] border border-black/25 dark:border-white/25 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col rounded-sm shadow-xl font-mono text-xs">
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
              <h2 className="font-serif text-2xl font-medium">
                {questionId ? "Edit FAQ Item" : "Create FAQ Item"}
              </h2>
              <button
                type="button"
                onClick={() => setIsQuestionFormOpen(false)}
                className="p-1 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-zinc-500 hover:text-zinc-800"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
              <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto space-y-4 flex flex-col border-r border-black/10 dark:border-white/10 h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block uppercase tracking-wider text-zinc-500 font-semibold text-[10px]">
                      Category *
                    </label>
                    <select
                      value={questionTagSlug}
                      onChange={(e) => setQuestionTagSlug(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 uppercase tracking-wider outline-none text-zinc-800 dark:text-zinc-100"
                    >
                      {initialTags.map((tag) => (
                        <option key={tag.slug} value={tag.slug}>
                          {tag.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block uppercase tracking-wider text-zinc-500 font-semibold text-[10px]">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={questionOrderIndex}
                      onChange={(e) => setQuestionOrderIndex(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 outline-none text-zinc-800 dark:text-zinc-100"
                      placeholder="e.g. 10, 20"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-zinc-500 font-semibold text-[10px]">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => handleQuestionTitleChange(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 outline-none font-serif text-sm text-zinc-800 dark:text-zinc-100"
                    placeholder="Which hostels are allotted to first-year students?"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-zinc-500 font-semibold text-[10px]">
                    Slug (Unique URL ID) *
                  </label>
                  <input
                    type="text"
                    value={questionSlug}
                    onChange={(e) => setQuestionSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}
                    className="w-full p-2 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 outline-none font-mono text-xs text-zinc-800 dark:text-zinc-100"
                    placeholder="e.g. which-hostels-are-allotted-to-first-year-students"
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col space-y-1.5 min-h-[300px]">
                  <div className="flex items-center justify-between">
                    <label className="block uppercase tracking-wider text-zinc-500 font-semibold text-[10px]">
                      Answer (Markdown supported) *
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-black/[0.03] dark:bg-white/[0.03] border border-black/15 dark:border-white/15 border-b-0 rounded-t-sm">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", "**")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Bold (**text**)"
                    >
                      <Bold className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("*", "*")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Italic (*text*)"
                    >
                      <Italic className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("### ", "")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Heading 3 (### Heading)"
                    >
                      <Heading3 className="size-3.5" />
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("[", "](https://)")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Insert Link ([text](url))"
                    >
                      <LinkIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("- ", "")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Bullet List (- item)"
                    >
                      <List className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("1. ", "")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Numbered List (1. item)"
                    >
                      <ListOrdered className="size-3.5" />
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Insert Table"
                    >
                      <TableIcon className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("`", "`")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Inline Code (`code`)"
                    >
                      <Code className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("![Alt Text](", ")")}
                      className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer"
                      title="Insert Image Syntax"
                    >
                      <ImageIcon className="size-3.5" />
                    </button>
                    <input
                      type="file"
                      id="faq-image-uploader"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("faq-image-uploader")?.click()}
                      className="p-1 px-2 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors cursor-pointer text-[#C85A41] flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider border border-[#C85A41]/10 bg-[#C85A41]/5 ml-auto"
                      title="Upload Image from Local Computer"
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <>
                          <span className="size-2 rounded-full border-t-2 border-[#C85A41] animate-spin shrink-0" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="size-3" />
                          Upload Image
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    id="faq-textarea"
                    value={questionAnswer}
                    onChange={(e) => setQuestionAnswer(e.target.value)}
                    className="w-full flex-1 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 rounded-b-sm p-3 text-sm focus:outline-none focus:border-[#C85A41] transition-colors font-mono resize-none min-h-[220px]"
                    placeholder="Write the FAQ answer..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsQuestionFormOpen(false)}
                    className="px-4 py-2 border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-wider cursor-pointer font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-[#C85A41] hover:bg-[#b04a32] text-[#F7F7F2] hover:opacity-90 disabled:opacity-50 uppercase tracking-wider cursor-pointer font-mono"
                  >
                    {isPending ? "Saving..." : "Save Question"}
                  </button>
                </div>
              </form>
              <div className="bg-[#F7F7F2] dark:bg-[#101014] p-6 overflow-y-auto h-full flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C85A41] font-semibold border-b border-black/5 pb-2 mb-4 block">
                  Live FAQ Render Preview
                </span>
                <div className="flex-1 bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 p-6 rounded-none relative">
                  <h3 className="font-serif text-xl font-normal leading-snug text-[#C85A41] border-b border-black/5 pb-3 mb-4">
                    {questionText || "Question Title Preview"}
                  </h3>
                  <div className="prose dark:prose-invert max-w-none text-left faq-markdown-content font-serif">
                    {questionAnswer.trim() === "" ? (
                      <p className="text-zinc-400 italic text-sm font-mono">
                        Begin writing in the editor to see the live rendering...
                      </p>
                    ) : (
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
                              <p className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4 last:mb-0">
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
                            <strong className="font-semibold text-[#111] dark:text-[#F5F1EA]">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-3 ml-5 space-y-1 list-disc marker:text-[#C85A41]">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-3 ml-5 space-y-1 list-decimal marker:text-[#C85A41]">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {children}
                            </li>
                          ),
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto border border-black/[0.08] dark:border-white/[0.08] max-w-full">
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
                              className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-[#111] dark:text-[#F5F1EA]"
                              style={{ fontFamily: "var(--font-inter)" }}
                            >
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td
                              className="px-3 py-2 text-[13px] leading-[1.5] text-zinc-600 dark:text-zinc-400 align-top"
                              style={{ fontFamily: "var(--font-inter)" }}
                            >
                              {children}
                            </td>
                          ),
                          code: ({ inline, children }: any) => {
                            if (inline) {
                              return (
                                <code
                                  className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded px-1.5 py-0.5 text-xs text-[#C85A41]"
                                  style={{ fontFamily: "var(--font-inter)" }}
                                >
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code
                                className="text-xs text-[#111] dark:text-[#EDE7DD]"
                                style={{ fontFamily: "var(--font-inter)" }}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <div className="my-4 overflow-hidden border border-black/[0.08] dark:border-white/[0.06] bg-[#EFEAE1] dark:bg-[#171717] rounded-sm">
                              <pre className="overflow-x-auto p-4 font-mono text-xs">
                                {children}
                              </pre>
                            </div>
                          ),
                          img: ({ src, alt }) => (
                            <div className="my-4">
                              <img
                                src={src || ""}
                                alt={alt || ""}
                                className="max-w-full h-auto border border-black/[0.08] dark:border-white/[0.08] mx-auto"
                              />
                            </div>
                          ),
                        }}
                      >
                        {questionAnswer}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isTagFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F7F2] dark:bg-[#171717] border border-black/25 dark:border-white/25 w-full max-w-lg p-6 md:p-8 rounded-sm shadow-xl font-mono text-xs">
            <h2 className="font-serif text-2xl mb-6 border-b border-black/10 dark:border-white/10 pb-3">
              {isNewTag ? "Create Category" : "Edit Category"}
            </h2>
            <form onSubmit={handleSaveTag} className="space-y-5">
              <div className="space-y-2">
                <label className="block uppercase tracking-wider text-zinc-500 font-semibold">
                  Category Slug *
                </label>
                <input
                  type="text"
                  value={tagSlug}
                  onChange={(e) => setTagSlug(e.target.value.toLowerCase())}
                  disabled={!isNewTag}
                  className="w-full p-2.5 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 outline-none uppercase tracking-wider text-zinc-800 dark:text-zinc-100 disabled:opacity-55"
                  placeholder="e.g. hostels"
                  required
                />
                {isNewTag && (
                  <p className="text-[10px] text-zinc-400">Lowercase letters, numbers, and hyphens only. Permanent ID.</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="block uppercase tracking-wider text-zinc-500 font-semibold">
                  Display Label *
                </label>
                <input
                  type="text"
                  value={tagLabel}
                  onChange={(e) => setTagLabel(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-[#121212] border border-black/15 dark:border-white/15 outline-none text-zinc-800 dark:text-zinc-100"
                  placeholder="e.g. Hostels & Mess"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block uppercase tracking-wider text-zinc-500 font-semibold">
                  Select Icon *
                </label>
                <div className="grid grid-cols-6 gap-2 border border-black/15 dark:border-white/15 p-3 max-h-[160px] overflow-y-auto bg-white dark:bg-[#121212]">
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = tagIcon === opt.name;
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => setTagIcon(opt.name)}
                        className={`flex flex-col items-center justify-center p-2 border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-black text-white border-black dark:bg-[#F4F4F0] dark:text-[#121212]"
                            : "border-black/5 dark:border-white/5 hover:border-black/25 dark:hover:border-white/25"
                        }`}
                        title={opt.name}
                      >
                        <Icon className="size-4" />
                        <span className="text-[8px] mt-1 text-center truncate w-full">{opt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10 font-mono">
                <button
                  type="button"
                  onClick={() => setIsTagFormOpen(false)}
                  className="px-4 py-2 border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-black dark:bg-[#F4F4F0] text-[#F7F7F2] dark:text-[#121212] hover:opacity-90 disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirmOpen && deleteTarget && (
        <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F7F7F2] dark:bg-[#171717] border border-black/25 dark:border-white/25 w-full max-w-md p-6 rounded-sm shadow-xl font-mono text-xs text-left">
            <div className="flex items-center gap-2.5 text-[#C85A41] mb-4">
              <AlertTriangle className="size-5" />
              <span className="font-serif text-lg font-semibold uppercase tracking-wider">
                Confirm Deletion
              </span>
            </div>
            <p className="font-serif text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
              {deleteTarget.type === "tag" ? (
                <>
                  Are you sure you want to delete the category <strong className="text-zinc-900 dark:text-white">"{deleteTarget.label}"</strong>?<br /><br />
                  <span className="text-red-500 font-semibold">WARNING:</span> This action is permanent and will cascade delete all questions inside this category.
                </>
              ) : (
                <>
                  Are you sure you want to delete this question? This action is permanent and cannot be undone.
                </>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-black/10 dark:border-white/10 font-mono">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletion}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white uppercase tracking-wider cursor-pointer border border-transparent"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
