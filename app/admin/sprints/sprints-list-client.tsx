"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Calendar, 
  Trash2, 
  Plus, 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  ArrowRight,
  X,
  Loader2 
} from "lucide-react";
import type { DbSprint, DbSprintProject, DbSprintTask } from "@/lib/sprints-db";
import { 
  createSprintAction, 
  addProjectToSprintAction, 
  addTaskToProjectAction, 
  deleteSprintAction,
  updateTaskStatusAction
} from "@/app/admin/actions";

interface SprintsListClientProps {
  initialSprints: DbSprint[];
}

export default function SprintsListClient({ initialSprints }: SprintsListClientProps) {
  const [sprints, setSprints] = useState<DbSprint[]>(initialSprints);
  const [isPending, startTransition] = useTransition();

  // Helper to determine sprint status dynamically based on dates
  const getSprintStatus = (startStr: string, endStr: string): "retro" | "active" | "upcoming" => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);

    if (today < start) return "upcoming";
    if (today > end) return "retro";
    return "active";
  };

  const [selectedSprintNumber, setSelectedSprintNumber] = useState<number>(() => {
    const active = initialSprints.find(s => getSprintStatus(s.start_date, s.end_date) === "active");
    return active?.sprint_number ?? initialSprints[0]?.sprint_number ?? 1;
  });

  // Form states for Sprints (Auto-calculated, read-only preview)
  const [newSprintNumber, setNewSprintNumber] = useState<string>("1");
  const [newStartDate, setNewStartDate] = useState<string>("");
  const [newEndDate, setNewEndDate] = useState<string>("");

  // GitHub integration & custom selector states
  const [gitHubProjects, setGitHubProjects] = useState<any[]>([]);
  const [searchRepoQuery, setSearchRepoQuery] = useState("");
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  // Form states for Projects
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectRepo, setNewProjectRepo] = useState<string>("");

  // Form states for Tasks (mapped by projectId)
  const [activeTaskFormProjectId, setActiveTaskFormProjectId] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState<string>("");

  const selectedSprint = sprints.find(s => s.sprint_number === selectedSprintNumber);

  // Fetch GitHub org repositories list
  useEffect(() => {
    fetch("/api/github")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.projects)) {
          setGitHubProjects(data.projects);
        }
      })
      .catch((err) => console.error("Error loading GitHub projects:", err));
  }, []);

  // Auto-populate new sprint cycle numbers and start/end dates
  useEffect(() => {
    if (sprints.length === 0) {
      setNewSprintNumber("1");
      
      const today = new Date();
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + ((7 - today.getDay()) % 7 || 7));
      
      const nextSaturday = new Date(nextSunday);
      nextSaturday.setDate(nextSunday.getDate() + 6);
      
      setNewStartDate(nextSunday.toISOString().split("T")[0]);
      setNewEndDate(nextSaturday.toISOString().split("T")[0]);
    } else {
      const maxSprint = [...sprints].sort((a, b) => b.sprint_number - a.sprint_number)[0];
      setNewSprintNumber(String(maxSprint.sprint_number + 1));
      
      const lastEndDate = new Date(maxSprint.end_date);
      const nextSunday = new Date(lastEndDate);
      nextSunday.setDate(lastEndDate.getDate() + 1);
      
      const nextSaturday = new Date(nextSunday);
      nextSaturday.setDate(nextSunday.getDate() + 6);
      
      setNewStartDate(nextSunday.toISOString().split("T")[0]);
      setNewEndDate(nextSaturday.toISOString().split("T")[0]);
    }
  }, [sprints]);

  // Handlers
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintNumber || !newStartDate || !newEndDate) {
      toast.error("Invalid sprint cycle data.");
      return;
    }

    startTransition(async () => {
      const res = await createSprintAction(
        Number(newSprintNumber),
        newStartDate,
        newEndDate
      );

      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.sprint) {
        toast.success(res.message);
        setSprints(prev => [...prev, res.sprint as DbSprint].sort((a, b) => a.sprint_number - b.sprint_number));
        setSelectedSprintNumber(res.sprint.sprint_number);
      }
    });
  };

  const handleDeleteSprint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sprint cycle? All subsequent sprint numbers will decrement dynamically to remain orderly.")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteSprintAction(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        
        // Fetch fresh sprints from database to reflect re-indexed sprint numbers
        fetch("/api/sprints")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setSprints(data);
              const active = data.find(s => getSprintStatus(s.start_date, s.end_date) === "active");
              setSelectedSprintNumber(active?.sprint_number ?? data[0]?.sprint_number ?? 1);
            }
          });
      }
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSprint) return;
    if (!newProjectName || !newProjectRepo) {
      toast.error("Please select a project repository.");
      return;
    }

    // Verify duplicate project in same sprint
    const duplicate = selectedSprint.projects.find(p => p.project_name === newProjectName);
    if (duplicate) {
      toast.error("This project is already part of the selected sprint cycle.");
      return;
    }

    startTransition(async () => {
      const res = await addProjectToSprintAction(selectedSprint.id, newProjectName, newProjectRepo);
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.project) {
        toast.success(res.message);
        setSprints(prev => prev.map(s => {
          if (s.id === selectedSprint.id) {
            return {
              ...s,
              projects: [...s.projects, res.project as DbSprintProject]
            };
          }
          return s;
        }));
        setNewProjectName("");
        setNewProjectRepo("");
        setSearchRepoQuery("");
      }
    });
  };

  const handleAddTask = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!newTaskText) {
      toast.error("Goal description is required.");
      return;
    }

    startTransition(async () => {
      // New goals for active sprint are created with 'pending' by default
      const res = await addTaskToProjectAction(projectId, newTaskText, "pending", null);
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.task) {
        toast.success(res.message);
        setSprints(prev => prev.map(s => {
          return {
            ...s,
            projects: s.projects.map(p => {
              if (p.id === projectId) {
                return {
                  ...p,
                  tasks: [...p.tasks, res.task as DbSprintTask]
                };
              }
              return p;
            })
          };
        }));
        setNewTaskText("");
        setActiveTaskFormProjectId(null);
      }
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, status: "completed" | "carried-forward" | "rejected" | "pending" | "in-progress") => {
    startTransition(async () => {
      const res = await updateTaskStatusAction(taskId, status);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
        
        // Refresh local data to pull carried forward tasks or updated indicators
        fetch("/api/sprints")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              setSprints(data);
            }
          });
      }
    });
  };

  // Filtered repositories list based on search
  const filteredRepos = gitHubProjects.filter(p => 
    p.name.toLowerCase().includes(searchRepoQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-black/15 dark:border-white/15">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-8 h-8 border border-black/10 dark:border-white/10 flex items-center justify-center text-zinc-500 hover:text-black dark:hover:text-white hover:border-black/30 dark:hover:border-white/30 transition-all rounded-sm"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">Sprints Workspace</h1>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1">
              Active Sprints & Weekly Shipments Board
            </p>
          </div>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 font-mono text-[10px] text-[#C85A41] uppercase tracking-wider">
            <Loader2 className="size-3.5 animate-spin" />
            Synchronizing DB...
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Side: Sprints list & Auto-calculated Creator */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Sprints Index */}
          <div className="border border-black/15 dark:border-white/15 p-6 bg-white dark:bg-[#171717] rounded-sm">
            <h2 className="font-serif text-xl font-semibold mb-4 border-b border-black/5 dark:border-white/5 pb-2">
              Sprints Ledger
            </h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {sprints.length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono italic">No sprints logged in system.</p>
              ) : (
                sprints.map((sprint) => {
                  const status = getSprintStatus(sprint.start_date, sprint.end_date);
                  const isCurrentSelected = selectedSprintNumber === sprint.sprint_number;
                  
                  return (
                    <button
                      key={sprint.id}
                      onClick={() => setSelectedSprintNumber(sprint.sprint_number)}
                      className={`w-full text-left px-4 py-3 border font-mono text-xs uppercase tracking-wider flex items-center justify-between transition-all rounded-sm cursor-pointer ${
                        isCurrentSelected
                          ? "border-[#C85A41] bg-[#C85A41]/5 text-[#C85A41] font-bold"
                          : "border-black/10 dark:border-white/10 hover:border-black/35 dark:hover:border-white/35"
                      }`}
                    >
                      <span>Issue {String(sprint.sprint_number).padStart(2, "0")} · Sprint #{sprint.sprint_number}</span>
                      <span className="text-[9px] opacity-75">
                        {status === "active" ? "[NOW]" : status === "retro" ? "[PAST]" : "[NEXT]"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Custom Auto-Creator Form */}
          <div className="border border-black/15 dark:border-white/15 p-6 bg-[#FAFAFA] dark:bg-[#1A1A1A] rounded-sm">
            <h2 className="font-serif text-xl font-semibold mb-4 border-b border-black/5 dark:border-white/5 pb-2">
              Next Cycle Preview
            </h2>
            <form onSubmit={handleCreateSprint} className="space-y-6 font-mono text-xs">
              {/* Ticket-Stub Style Read Only Dates Display */}
              <div className="border border-dashed border-[#C85A41]/20 bg-[#C85A41]/[0.02] p-4 rounded-sm space-y-3 relative overflow-hidden">
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Auto-calculated Sprint Cycle</div>
                <div className="flex justify-between items-baseline">
                  <span className="text-zinc-500">Sprint Identity:</span>
                  <span className="font-bold text-sm text-[#C85A41]">Sprint #{newSprintNumber}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Starts (Sunday):</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {newStartDate ? new Date(newStartDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : "Calculating..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ends (Saturday):</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {newEndDate ? new Date(newEndDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : "Calculating..."}
                    </span>
                  </div>
                </div>
                {/* Visual side cuts for ticket look */}
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-3 h-6 rounded-r-full bg-[#F7F7F2] dark:bg-[#121212] border-r border-[#C85A41]/10" />
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-6 rounded-l-full bg-[#F7F7F2] dark:bg-[#121212] border-l border-[#C85A41]/10" />
              </div>

              <button
                type="submit"
                disabled={isPending || !newStartDate}
                className="w-full bg-[#C85A41] text-white py-3 font-bold uppercase tracking-wider hover:bg-[#b04b34] transition-colors rounded-sm cursor-pointer disabled:opacity-50"
              >
                Log Next Sprint
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Selected Sprint projects & targets CRUD */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {selectedSprint ? (() => {
            const sprintStatus = getSprintStatus(selectedSprint.start_date, selectedSprint.end_date);
            const isRetro = sprintStatus === "retro";
            const isUpcoming = sprintStatus === "upcoming";
            const isCurrent = sprintStatus === "active";

            return (
              <div className="border border-black/15 dark:border-white/15 p-6 md:p-8 bg-white dark:bg-[#171717] rounded-sm relative">
                {/* Sprint Details Head */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-black/15 dark:border-white/15 mb-8 gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-2xl font-semibold">Sprint #{selectedSprint.sprint_number} Details</span>
                      <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border rounded-sm ${
                        isCurrent 
                          ? "border-[#C85A41]/30 bg-[#C85A41]/5 text-[#C85A41] font-bold" 
                          : isRetro 
                          ? "border-zinc-500/20 bg-zinc-500/5 text-zinc-500"
                          : "border-zinc-400/20 text-zinc-400 border-dashed"
                      }`}>
                        {isCurrent ? "NOW" : isRetro ? "PAST" : "NEXT"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mt-1.5">
                      Cycle: {new Date(selectedSprint.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – {new Date(selectedSprint.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
                    </p>
                  </div>

                  {/* Deletion Action */}
                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    <button
                      onClick={() => handleDeleteSprint(selectedSprint.id)}
                      className="border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white px-3 py-2 rounded-sm transition-all cursor-pointer flex items-center gap-1.5 font-bold uppercase tracking-wider"
                    >
                      <Trash2 className="size-3.5" />
                      Delete Cycle
                    </button>
                  </div>
                </div>

                {/* Projects list */}
                <div className="space-y-8">
                  <div>
                    <h3 className="font-serif text-xl font-semibold mb-6 flex items-center gap-2">
                      <span>Assigned Repositories</span>
                      <span className="text-[10px] uppercase font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-sm text-zinc-500">
                        {selectedSprint.projects.length} Total
                      </span>
                    </h3>

                    {selectedSprint.projects.length === 0 ? (
                      <div className="border border-dashed border-black/10 dark:border-white/10 p-12 text-center rounded-sm">
                        <p className="text-xs text-zinc-500 font-mono italic">No projects assigned to this sprint cycle yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedSprint.projects.map((project) => (
                          <div key={project.id} className="border border-black/15 dark:border-white/15 p-5 bg-[#FAFAFA] dark:bg-[#1A1A1A] rounded-sm relative group flex flex-col justify-between min-h-[220px]">
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h4 className="font-serif text-lg font-bold">{project.project_name}</h4>
                                  <a
                                    href={`https://github.com/Opensource-NITJ/${project.github_repo}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-[#C85A41] font-mono hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    <span>Opensource-NITJ/{project.github_repo}</span>
                                    <ExternalLink className="size-2.5" />
                                  </a>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveTaskFormProjectId(
                                      activeTaskFormProjectId === project.id ? null : project.id
                                    );
                                    setNewTaskText("");
                                  }}
                                  className="w-6 h-6 border border-black/10 dark:border-white/10 hover:border-[#C85A41] hover:text-[#C85A41] flex items-center justify-center rounded-sm transition-all cursor-pointer"
                                  title="Add Target Goal"
                                >
                                  <Plus className="size-3.5" />
                                </button>
                              </div>

                              {/* Target goals list */}
                              <ul className="space-y-4 font-mono text-xs border-t border-black/5 dark:border-white/5 pt-4 mb-4">
                                {project.tasks.length === 0 ? (
                                  <li className="text-[10px] text-zinc-400 italic">No goals mapped to repository.</li>
                                ) : (
                                  project.tasks.map((task) => {
                                    const isTaskCompleted = task.status === "completed";
                                    const isTaskCarried = task.status === "carried-forward";
                                    const isTaskRejected = task.status === "rejected";

                                    return (
                                      <li key={task.id} className="flex flex-col gap-2.5 border-b border-black/[0.03] dark:border-white/[0.03] pb-3 last:border-b-0">
                                        <div className="flex items-start gap-2 text-[11px] leading-relaxed">
                                          <span className={`mt-0.5 select-none font-bold ${
                                            isTaskCompleted 
                                              ? "text-green-500" 
                                              : isTaskCarried 
                                              ? "text-[#C85A41]" 
                                              : isTaskRejected 
                                              ? "text-red-500"
                                              : "text-zinc-400 animate-pulse"
                                          }`}>
                                            {isTaskCompleted ? "✓" : isTaskCarried ? "↳" : isTaskRejected ? "✗" : "◒"}
                                          </span>
                                          <span className={isTaskCompleted ? "text-zinc-400 line-through" : isTaskRejected ? "text-zinc-400 line-through decoration-red-500/50" : "text-zinc-700 dark:text-zinc-300"}>
                                            {task.task_text}
                                          </span>
                                        </div>

                                        {/* Dynamic Status Switchers (Only for past/completed weeks) */}
                                        {isRetro && (
                                          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider pl-4">
                                            <button
                                              onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                                              className={`px-2 py-1 rounded-sm border cursor-pointer transition-colors ${
                                                isTaskCompleted 
                                                  ? "bg-green-500/10 border-green-500 text-green-500 font-bold" 
                                                  : "border-black/10 dark:border-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                                              }`}
                                            >
                                              Completed
                                            </button>
                                            <button
                                              onClick={() => handleUpdateTaskStatus(task.id, "carried-forward")}
                                              className={`px-2 py-1 rounded-sm border cursor-pointer transition-colors ${
                                                isTaskCarried 
                                                  ? "bg-[#C85A41]/10 border-[#C85A41] text-[#C85A41] font-bold" 
                                                  : "border-black/10 dark:border-white/10 text-zinc-500 hover:text-[#C85A41]"
                                              }`}
                                              title="Carry over to next sprint automatically"
                                            >
                                              Carry Forward
                                            </button>
                                            <button
                                              onClick={() => handleUpdateTaskStatus(task.id, "rejected")}
                                              className={`px-2 py-1 rounded-sm border cursor-pointer transition-colors ${
                                                isTaskRejected 
                                                  ? "bg-red-500/10 border-red-500 text-red-500 font-bold" 
                                                  : "border-black/10 dark:border-white/10 text-zinc-500 hover:text-red-500"
                                              }`}
                                            >
                                              Rejected
                                            </button>
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })
                                )}
                              </ul>
                            </div>

                            {/* Goal Input form inline */}
                            {activeTaskFormProjectId === project.id && (
                              <form onSubmit={(e) => handleAddTask(e, project.id)} className="border-t border-black/5 dark:border-white/5 pt-4 space-y-3 font-mono text-[10px] mt-auto">
                                <div>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter target goal description..."
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    className="w-full border border-black/10 dark:border-white/10 bg-white dark:bg-[#171717] px-2.5 py-2 rounded-sm text-[10px] focus:border-[#C85A41] outline-none"
                                  />
                                </div>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTaskFormProjectId(null)}
                                    className="border border-black/10 dark:border-white/10 px-2.5 py-1 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="bg-[#C85A41] text-white px-2.5 py-1 rounded-sm hover:bg-[#b04b34] cursor-pointer font-bold"
                                  >
                                    Add Goal
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Repository Selector component (Magazine theme) */}
                  <div className="border-t border-black/15 dark:border-white/15 pt-8 relative">
                    <h3 className="font-serif text-lg font-semibold mb-4">Add Project to this Sprint</h3>
                    <div className="max-w-md space-y-2 font-mono text-xs">
                      <label className="block text-zinc-500 uppercase tracking-wider mb-1 font-bold">Search Org Repository</label>
                      
                      {/* Custom select search box */}
                      <div className="relative">
                        <div className="flex border border-black/10 dark:border-white/10 rounded-sm bg-white dark:bg-[#171717] items-center px-3 py-2 focus-within:border-[#C85A41] transition-colors">
                          <input
                            type="text"
                            placeholder={newProjectName ? `Selected: Opensource-NITJ/${newProjectName}` : "Search or select org repo (e.g. asknitj)..."}
                            value={searchRepoQuery}
                            onFocus={() => setShowRepoDropdown(true)}
                            onChange={(e) => {
                              setSearchRepoQuery(e.target.value);
                              setShowRepoDropdown(true);
                            }}
                            className="w-full bg-transparent border-none outline-none text-xs"
                          />
                          {newProjectName && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewProjectName("");
                                setNewProjectRepo("");
                                setSearchRepoQuery("");
                              }}
                              className="text-zinc-400 hover:text-red-500 cursor-pointer"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown popup */}
                        {showRepoDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 border border-black/15 dark:border-white/15 bg-white dark:bg-[#1A1A1A] z-20 rounded-sm shadow-lg max-h-[180px] overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                            {filteredRepos.length === 0 ? (
                              // Allow typing fallback project manually in case GitHub API limit is reached
                              <div className="p-3 text-center">
                                <p className="text-[10px] text-zinc-400 italic mb-2">No matched repository found.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (searchRepoQuery.trim()) {
                                      setNewProjectName(searchRepoQuery.trim());
                                      setNewProjectRepo(searchRepoQuery.trim());
                                      setShowRepoDropdown(false);
                                    }
                                  }}
                                  className="text-[10px] text-white bg-[#C85A41] px-2.5 py-1 rounded-sm uppercase font-bold hover:bg-[#b04b34] cursor-pointer"
                                >
                                  Use "{searchRepoQuery}" as Manual Input
                                </button>
                              </div>
                            ) : (
                              filteredRepos.map((repo) => (
                                <button
                                  key={repo.name}
                                  type="button"
                                  onClick={() => {
                                    setNewProjectName(repo.name);
                                    setNewProjectRepo(repo.name);
                                    setSearchRepoQuery("");
                                    setShowRepoDropdown(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 hover:bg-[#C85A41]/5 hover:text-[#C85A41] transition-colors flex items-center justify-between cursor-pointer"
                                >
                                  <span className="font-bold">{repo.name}</span>
                                  <span className="text-[9px] opacity-60">Opensource-NITJ/{repo.name}</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Backdrop to close dropdown */}
                      {showRepoDropdown && (
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowRepoDropdown(false)} 
                        />
                      )}

                      {/* Confirmation stub */}
                      {newProjectName && (
                        <div className="border border-green-500/20 bg-green-500/[0.01] p-3 text-[10px] rounded-sm text-green-600 dark:text-green-500 uppercase flex items-center justify-between">
                          <span>Target: Opensource-NITJ/{newProjectName} selected</span>
                          <button
                            onClick={handleAddProject}
                            disabled={isPending}
                            className="bg-[#C85A41] text-white px-3 py-1.5 hover:bg-[#b04b34] rounded-sm cursor-pointer font-bold flex items-center gap-1"
                          >
                            <Check className="size-3.5" />
                            Confirm Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="border border-dashed border-black/15 dark:border-white/15 p-16 text-center rounded-sm bg-white dark:bg-[#171717]">
              <Calendar className="size-10 text-zinc-300 mx-auto mb-4" />
              <p className="text-sm text-zinc-500 font-mono italic">Select or create a sprint cycle from the index to manage its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
