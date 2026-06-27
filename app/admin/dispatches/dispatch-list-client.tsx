"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  User,
  Clock,
  Search,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Dispatch } from "@/lib/dispatch";
import { deleteDispatchAction } from "@/app/admin/actions";
import { toast } from "sonner";

interface AdminDispatchListClientProps {
  initialDispatches: Dispatch[];
}

export default function AdminDispatchListClient({ initialDispatches }: AdminDispatchListClientProps) {
  const [dispatches, setDispatches] = useState<Dispatch[]>(initialDispatches);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Confirmation Modal State
  const [dispatchToDelete, setDispatchToDelete] = useState<{ id: string; slug: string } | null>(null);

  const handleDeleteClick = (id: string, slug: string) => {
    setDispatchToDelete({ id, slug });
  };

  const handleConfirmDelete = () => {
    if (!dispatchToDelete) return;

    const { id, slug } = dispatchToDelete;
    setDispatchToDelete(null);

    startTransition(async () => {
      const result = await deleteDispatchAction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Dispatch deleted successfully!");
      setDispatches((prev) => prev.filter((d) => d.id !== id));
    });
  };

  const filteredDispatches = useMemo(() => {
    if (!searchQuery) return dispatches;
    const query = searchQuery.toLowerCase();
    return dispatches.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.slug.toLowerCase().includes(query) ||
        d.author.name.toLowerCase().includes(query)
    );
  }, [dispatches, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden max-w-[1200px] mx-auto w-full p-6 md:p-10 h-full relative">
      {/* Return to Dashboard and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-wider flex items-center gap-1.5 text-zinc-500 hover:text-[#C85A41] transition-colors mb-2"
          >
            <ArrowLeft className="size-3.5" />
            Back to Hub
          </Link>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
            Manage Dispatches<span className="text-[#C85A41]">.</span>
          </h1>
        </div>

        <Link
          href="/admin/dispatch/new"
          className="self-start md:self-auto py-2 px-4 bg-[#C85A41] hover:bg-[#b04a32] text-white flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-colors font-mono"
        >
          <Plus className="size-4" />
          Create Dispatch
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 size-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search dispatches by title, slug, or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/15 dark:border-white/15 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#C85A41] transition-colors placeholder-zinc-500 font-mono"
        />
      </div>

      {/* Dispatches Container */}
      <div className="flex-1 overflow-y-auto border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {filteredDispatches.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-sm font-mono">
            No dispatches found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {filteredDispatches.map((dispatch) => (
              <div
                key={dispatch.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
                      /{dispatch.slug}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl leading-snug font-semibold hover:text-[#C85A41] transition-colors">
                    <Link href={`/admin/dispatch/${dispatch.slug}`}>{dispatch.title}</Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {new Date(dispatch.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {dispatch.readTime}m read
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" />
                      @{dispatch.author.github} ({dispatch.author.name})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto font-mono">
                  <Link
                    href={`/admin/dispatch/${dispatch.slug}`}
                    className="p-2 border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-[#C85A41] hover:text-[#C85A41] transition-colors flex items-center gap-1.5 text-xs uppercase tracking-wider rounded-sm"
                  >
                    <Edit2 className="size-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(dispatch.id, dispatch.slug)}
                    className="p-2 border border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500 transition-colors flex items-center gap-1.5 text-xs uppercase tracking-wider rounded-sm cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {dispatchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-6 rounded-sm shadow-xl animate-scale-up font-mono">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertTriangle className="size-6" />
              </div>
              <h4 className="font-serif text-xl font-bold">Delete Dispatch?</h4>
            </div>
            
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete the dispatch: <strong className="text-black dark:text-white">/{dispatchToDelete.slug}</strong>? This action is irreversible and the dispatch will immediately disappear from the public website.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDispatchToDelete(null)}
                className="px-4 py-2 border border-black/10 dark:border-white/10 text-xs uppercase tracking-wider hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Loader */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 dark:bg-white/5 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#171717] border border-black/10 dark:border-white/10 p-4 flex items-center gap-3 rounded-sm shadow-md font-mono text-xs">
            <Loader2 className="size-4 animate-spin text-[#C85A41]" />
            <span>Deleting dispatch...</span>
          </div>
        </div>
      )}
    </div>
  );
}
