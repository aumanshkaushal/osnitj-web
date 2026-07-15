"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Strikethrough,
  Quote,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Table as TableIcon,
  Image as ImageIcon,
  Code,
  Upload,
  AlertTriangle,
  Minus
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
    
    // Custom placeholder handler if nothing is selected for complex syntaxes
    let finalSyntaxBefore = syntaxBefore;
    let finalSyntaxAfter = syntaxAfter;
    let placeholderText = selectedText;
    
    if (selectedText.length === 0) {
      if (syntaxBefore === "[" && syntaxAfter === "](https://)") {
        placeholderText = "link text";
      } else if (syntaxBefore === "![alt text](" && syntaxAfter === ")") {
        placeholderText = "image description";
      } else if (syntaxBefore === "<u>" && syntaxAfter === "</u>") {
        placeholderText = "underlined text";
      } else if (syntaxBefore === "**" && syntaxAfter === "**") {
        placeholderText = "bold text";
      } else if (syntaxBefore === "*" && syntaxAfter === "*") {
        placeholderText = "italic text";
      } else if (syntaxBefore === "~~" && syntaxAfter === "~~") {
        placeholderText = "strikethrough text";
      } else if (syntaxBefore === "`" && syntaxAfter === "`") {
        placeholderText = "code";
      }
    }
    
    const replacement = finalSyntaxBefore + placeholderText + finalSyntaxAfter;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setQuestionAnswer(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + finalSyntaxBefore.length,
        start + finalSyntaxBefore.length + placeholderText.length
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMeta = e.ctrlKey || e.metaKey;
    if (isMeta) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        insertMarkdown("**", "**");
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        insertMarkdown("*", "*");
      } else if (e.key.toLowerCase() === "u") {
        e.preventDefault();
        insertMarkdown("<u>", "</u>");
      }
    }
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#F8F9FA] dark:bg-[#0D0D11] border border-zinc-200 dark:border-zinc-800/80 w-full max-w-7xl h-[95vh] lg:h-[90vh] max-h-[920px] overflow-hidden flex flex-col rounded-xl shadow-2xl transition-all duration-300 font-sans text-sm">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-5 text-[#C85A41]" strokeWidth={1.5} />
                <h2 className="font-serif text-xl md:text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {questionId ? "Edit FAQ Item" : "Create FAQ Item"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionFormOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-955 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1.5 uppercase font-semibold font-sans"
              >
                <span>✕ Close</span>
              </button>
            </div>
            
            {/* Modal Split View */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
              {/* Form Input Side */}
              <form onSubmit={handleSaveQuestion} className="p-6 overflow-y-auto space-y-5 flex flex-col border-r border-zinc-200 dark:border-zinc-800 h-full bg-white dark:bg-[#0E0E12]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold text-[10px] font-sans">
                      Category *
                    </label>
                    <select
                      value={questionTagSlug}
                      onChange={(e) => setQuestionTagSlug(e.target.value)}
                      className="w-full p-2.5 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-[#C85A41] focus:ring-2 focus:ring-[#C85A41]/10 transition-all rounded-md text-zinc-800 dark:text-zinc-100 uppercase tracking-wider cursor-pointer font-sans font-medium"
                    >
                      {initialTags.map((tag) => (
                        <option key={tag.slug} value={tag.slug} className="uppercase tracking-wider">
                          {tag.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold text-[10px] font-sans">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={questionOrderIndex}
                      onChange={(e) => setQuestionOrderIndex(Number(e.target.value))}
                      className="w-full p-2.5 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-[#C85A41] focus:ring-2 focus:ring-[#C85A41]/10 transition-all rounded-md text-zinc-800 dark:text-zinc-100 font-mono"
                      placeholder="e.g. 10, 20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold text-[10px] font-sans">
                    Question Title *
                  </label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => handleQuestionTitleChange(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-base font-serif text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-[#C85A41] focus:ring-2 focus:ring-[#C85A41]/10 transition-all rounded-md font-medium"
                    placeholder="Which hostels are allotted to first-year students?"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold text-[10px] font-sans">
                    Slug (Unique URL ID) *
                  </label>
                  <input
                    type="text"
                    value={questionSlug}
                    onChange={(e) => setQuestionSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"))}
                    className="w-full p-2.5 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-[#C85A41] focus:ring-2 focus:ring-[#C85A41]/10 transition-all rounded-md"
                    placeholder="e.g. which-hostels-are-allotted-to-first-year-students"
                    required
                  />
                </div>

                {/* Editor Textarea Section */}
                <div className="flex-1 flex flex-col space-y-1.5 min-h-[320px]">
                  <div className="flex items-center justify-between font-sans">
                    <label className="block uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold text-[10px]">
                      Answer Content (Markdown) *
                    </label>
                  </div>

                  {/* Notion-Style Toolbar */}
                  <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-b-0 rounded-t-lg select-none">
                    {/* Inline Typography */}
                    <div className="flex items-center gap-0.5 mr-1.5 pr-1.5 border-r border-zinc-200 dark:border-zinc-800">
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("**", "**")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Bold className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Bold</span>
                            <kbd className="bg-zinc-800 dark:bg-zinc-200 text-zinc-400 dark:text-zinc-600 px-1 rounded text-[9px] font-mono border border-zinc-700 dark:border-zinc-300">Ctrl+B</kbd>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("*", "*")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Italic className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Italic</span>
                            <kbd className="bg-zinc-800 dark:bg-zinc-200 text-zinc-400 dark:text-zinc-600 px-1 rounded text-[9px] font-mono border border-zinc-700 dark:border-zinc-300">Ctrl+I</kbd>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("<u>", "</u>")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Underline className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Underline</span>
                            <kbd className="bg-zinc-800 dark:bg-zinc-200 text-zinc-400 dark:text-zinc-600 px-1 rounded text-[9px] font-mono border border-zinc-700 dark:border-zinc-300">Ctrl+U</kbd>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("~~", "~~")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Strikethrough className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Strikethrough</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center gap-0.5 mr-1.5 pr-1.5 border-r border-zinc-200 dark:border-zinc-800">
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("# ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-bold text-xs cursor-pointer"
                        >
                          <Heading1 className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Heading 1</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("## ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-bold text-xs cursor-pointer"
                        >
                          <Heading2 className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Heading 2</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("### ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-bold text-xs cursor-pointer"
                        >
                          <Heading3 className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Heading 3</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("#### ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded font-bold text-xs cursor-pointer"
                        >
                          <Heading4 className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Heading 4</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>
                    </div>

                    {/* Lists & Quotes */}
                    <div className="flex items-center gap-0.5 mr-1.5 pr-1.5 border-r border-zinc-200 dark:border-zinc-800">
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("- ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <List className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Bullet List</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("1. ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <ListOrdered className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Numbered List</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("- [ ] ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <ListTodo className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Task List</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("> ", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Quote className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Quote</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>
                    </div>

                    {/* Blocks & Media */}
                    <div className="flex items-center gap-0.5 mr-1.5 pr-1.5 border-r border-zinc-200 dark:border-zinc-800">
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("`", "`")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Code className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Inline Code</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("\n```javascript\n", "\n```\n")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Code className="size-4" strokeWidth={2.5} />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Code Block</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("[", "](https://)")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <LinkIcon className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Link</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <TableIcon className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Insert Table</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("![alt text](", ")")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <ImageIcon className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Image Syntax</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => insertMarkdown("\n---\n", "")}
                          className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded transition-all duration-150 cursor-pointer"
                        >
                          <Minus className="size-4" />
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Horizontal Rule</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px]" />
                        </div>
                      </div>
                    </div>

                    {/* Local image uploader */}
                    <div className="ml-auto flex items-center">
                      <input
                        type="file"
                        id="faq-image-uploader"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={() => document.getElementById("faq-image-uploader")?.click()}
                          className="p-1 px-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[#C85A41] rounded transition-all duration-150 cursor-pointer flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider border border-[#C85A41]/10 bg-[#C85A41]/5 disabled:opacity-50"
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <>
                              <span className="size-2.5 rounded-full border-t-2 border-[#C85A41] animate-spin shrink-0" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="size-3.5" />
                              <span>Upload Image</span>
                            </>
                          )}
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
                          <div className="bg-zinc-950 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 text-[10px] font-sans font-semibold py-1 px-2.5 rounded shadow-md border border-zinc-800 dark:border-zinc-200/50 whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider">
                            <span>Upload Image File</span>
                          </div>
                          <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-100 rotate-45 -mt-[3px] mr-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    id="faq-textarea"
                    value={questionAnswer}
                    onChange={(e) => setQuestionAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full flex-1 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 border-t-0 rounded-b-lg p-4 text-sm focus:outline-none focus:border-[#C85A41] focus:ring-2 focus:ring-[#C85A41]/10 transition-all font-mono resize-none leading-relaxed overflow-y-auto"
                    placeholder="Write the FAQ answer in Markdown..."
                    required
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 font-sans">
                  <button
                    type="button"
                    onClick={() => setIsQuestionFormOpen(false)}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-md transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-[#C85A41] hover:bg-[#b04a32] text-white hover:opacity-90 disabled:opacity-50 rounded-md shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    {isPending ? "Saving..." : "Save Question"}
                  </button>
                </div>
              </form>

              {/* Live Preview Side */}
              <div className="bg-zinc-100 dark:bg-[#070709] p-6 overflow-y-auto h-full flex flex-col">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C85A41] font-bold border-b border-zinc-200 dark:border-zinc-800/80 pb-2 mb-4 block">
                  Live FAQ Render Preview
                </span>
                
                <div className="flex-1 bg-[#F7F7F2] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800/80 p-8 rounded-lg shadow-sm relative overflow-y-auto max-w-[850px] mx-auto w-full transition-all duration-300">
                  <h3 className="font-serif text-2xl md:text-3xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50 border-b border-black/10 dark:border-white/10 pb-4 mb-6">
                    {questionText || "Question Title Preview"}
                  </h3>
                  
                  <div className="prose dark:prose-invert max-w-none text-left faq-markdown-content font-serif">
                    {questionAnswer.trim() === "" ? (
                      <p className="text-zinc-400 italic text-sm font-sans">
                        Begin writing in the editor to see the live rendering...
                      </p>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#111] dark:text-[#F4F4F0] mt-8 mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#111] dark:text-[#F4F4F0] mt-8 mb-4 border-b border-black/10 dark:border-white/10 pb-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg md:text-xl font-serif font-semibold text-[#C85A41] mt-6 mb-3">
                              {children}
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-base md:text-lg font-serif font-semibold text-[#111] dark:text-[#F4F4F0] mt-4 mb-2">
                              {children}
                            </h4>
                          ),
                          u: ({ children }) => (
                            <span className="underline decoration-[#C85A41]/50 underline-offset-4">
                              {children}
                            </span>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="my-6 pl-4 border-l-4 border-[#C85A41] bg-black/[0.02] dark:bg-white/[0.02] py-2 pr-2 italic text-zinc-600 dark:text-zinc-400">
                              {children}
                            </blockquote>
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
                              <p className="text-[15px] md:text-[17px] leading-[1.8] text-zinc-700 dark:text-zinc-300 mb-5 last:mb-0">
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
                            <strong className="font-semibold text-zinc-950 dark:text-zinc-50">
                              {children}
                            </strong>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-5 ml-6 space-y-2 list-disc marker:text-[#C85A41]">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-5 ml-6 space-y-2 list-decimal marker:text-[#C85A41]">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-[15px] md:text-[17px] leading-[1.75] text-zinc-700 dark:text-zinc-300">
                              {children}
                            </li>
                          ),
                          table: ({ children }) => (
                            <div className="my-6 overflow-x-auto border border-zinc-200 dark:border-zinc-800 max-w-full">
                              <table className="w-full border-collapse">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => <tbody>{children}</tbody>,
                          tr: ({ children }) => (
                            <tr className="border-b border-zinc-100 dark:border-zinc-900 last:border-b-0">
                              {children}
                            </tr>
                          ),
                          th: ({ children }) => (
                            <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 font-semibold">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 align-top">
                              {children}
                            </td>
                          ),
                          code: ({ inline, children }: any) => {
                            if (inline) {
                              return (
                                <code className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-1.5 py-0.5 text-xs text-[#C85A41] font-mono">
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code className="text-xs text-zinc-900 dark:text-zinc-50 font-mono">
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <div className="my-6 overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
                                {children}
                              </pre>
                            </div>
                          ),
                          img: ({ src, alt }) => (
                            <div className="my-6">
                              <img
                                src={src || ""}
                                alt={alt || ""}
                                className="max-w-full h-auto border border-zinc-200 dark:border-zinc-800 mx-auto rounded shadow-xs"
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
