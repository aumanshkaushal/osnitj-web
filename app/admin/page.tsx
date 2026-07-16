import Link from "next/link";
import { BookOpen, Calendar, HelpCircle, ArrowRight, BarChart3 } from "lucide-react";

export default function AdminHubPage() {
  const modes = [
    {
      title: "Dispatches Manager",
      description: "Create, edit, and delete technical dispatches, announcements, and developer updates.",
      icon: BookOpen,
      href: "/admin/dispatches",
      status: "active",
    },
    {
      title: "Sprints & Goals",
      description: "Plan development sprints, track active progress, and maintain collaborative goals.",
      icon: Calendar,
      href: "/admin/sprints",
      status: "active",
    },
    {
      title: "FAQ Manager",
      description: "Manage categories, icons, questions, and answers for the college fresher FAQ guide.",
      icon: HelpCircle,
      href: "/admin/faq",
      status: "active",
    },
    {
      title: "Visitor Analytics",
      description: "Monitor real-time pageviews, visitor sessions, FAQ queries, and custom feature usage.",
      icon: BarChart3,
      href: "/admin/analytics",
      status: "active",
    },
  ];

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-[1200px] mx-auto w-full">
      <div className="text-center max-w-2xl mb-12">
        <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-4">
          Admin Control Center<span className="text-[#C85A41]">.</span>
        </h1>
        <p className="text-sm text-zinc-500 font-mono leading-relaxed">
          Select a workspace module below to manage different sections of the OpenSource @ NITJ website.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = mode.status === "active";

          return isActive ? (
            <Link
              key={mode.title}
              href={mode.href}
              className="group border border-black/15 dark:border-white/15 bg-white dark:bg-[#171717] p-8 flex flex-col justify-between hover:border-[#C85A41] transition-all duration-300 relative rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <div>
                <div className="w-10 h-10 border border-black/10 dark:border-white/10 flex items-center justify-center text-[#C85A41] mb-6 group-hover:bg-[#C85A41] group-hover:text-white transition-colors">
                  <Icon className="size-5" />
                </div>
                <h2 className="font-serif text-2xl font-semibold mb-3 flex items-center gap-2">
                  {mode.title}
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="size-4 text-zinc-400 group-hover:text-[#C85A41]" />
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                  {mode.description}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5 text-[10px] uppercase tracking-wider text-[#C85A41] font-semibold">
                Manage Section
              </div>
            </Link>
          ) : (
            <div
              key={mode.title}
              className="border border-black/10 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] p-8 flex flex-col justify-between opacity-60 rounded-sm select-none"
            >
              <div>
                <div className="w-10 h-10 border border-black/5 dark:border-white/5 flex items-center justify-center text-zinc-400 mb-6">
                  <Icon className="size-5" />
                </div>
                <h2 className="font-serif text-2xl font-semibold mb-3 text-zinc-400 flex items-center gap-2">
                  {mode.title}
                  <span className="text-[10px] uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-sm border border-black/10 dark:border-white/10 text-zinc-400 font-mono font-normal">
                    Coming Soon
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  {mode.description}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-black/5 dark:border-white/5 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold font-mono">
                Locked
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
