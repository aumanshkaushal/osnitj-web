import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

const sql = connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 1,
      prepare: false,
    })
  : null;

export interface DbSprintTask {
  id: string;
  task_text: string;
  status: "completed" | "carried-forward" | "rejected" | "pending" | "in-progress";
  pr_link?: string | null;
}

export interface DbSprintProject {
  id: string;
  project_name: string;
  github_repo: string;
  tasks: DbSprintTask[];
}

export interface DbSprint {
  id: string;
  sprint_number: number;
  start_date: string;
  end_date: string;
  status: "retro" | "active" | "upcoming";
  retro_notes?: string | null;
  projects: DbSprintProject[];
}

export async function getSprintsFromDb(): Promise<DbSprint[]> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  // 1. Fetch sprints
  const sprintRows = await sql`
    select id, sprint_number, start_date::text, end_date::text, status, retro_notes
    from public.sprints
    order by sprint_number asc
  `;

  if (sprintRows.length === 0) {
    return [];
  }

  // 2. Fetch projects
  const projectRows = await sql`
    select id, sprint_id, project_name, github_repo
    from public.sprint_projects
  `;

  // 3. Fetch tasks
  const taskRows = await sql`
    select id, project_id, task_text, status, pr_link
    from public.sprint_tasks
  `;

  // Map tasks to their projects
  const tasksByProject: Record<string, DbSprintTask[]> = {};
  for (const t of taskRows) {
    if (!tasksByProject[t.project_id]) {
      tasksByProject[t.project_id] = [];
    }
    tasksByProject[t.project_id].push({
      id: t.id,
      task_text: t.task_text,
      status: t.status,
      pr_link: t.pr_link,
    });
  }

  // Map projects to their sprints
  const projectsBySprint: Record<string, DbSprintProject[]> = {};
  for (const p of projectRows) {
    if (!projectsBySprint[p.sprint_id]) {
      projectsBySprint[p.sprint_id] = [];
    }
    projectsBySprint[p.sprint_id].push({
      id: p.id,
      project_name: p.project_name,
      github_repo: p.github_repo,
      tasks: tasksByProject[p.id] || [],
    });
  }

  // Build the nested structure
  return sprintRows.map((s) => ({
    id: s.id,
    sprint_number: Number(s.sprint_number),
    start_date: s.start_date instanceof Date ? s.start_date.toISOString() : new Date(s.start_date).toISOString(),
    end_date: s.end_date instanceof Date ? s.end_date.toISOString() : new Date(s.end_date).toISOString(),
    status: s.status as "retro" | "active" | "upcoming",
    retro_notes: s.retro_notes,
    projects: projectsBySprint[s.id] || [],
  }));
}

export async function createSprintInDb(sprint: Omit<DbSprint, "id" | "projects">): Promise<DbSprint> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [row] = await sql`
    insert into public.sprints (sprint_number, start_date, end_date, status, retro_notes)
    values (${sprint.sprint_number}, ${sprint.start_date}, ${sprint.end_date}, ${sprint.status}, ${sprint.retro_notes || null})
    returning id, sprint_number, start_date::text, end_date::text, status, retro_notes
  `;

  return {
    id: row.id,
    sprint_number: Number(row.sprint_number),
    start_date: new Date(row.start_date).toISOString(),
    end_date: new Date(row.end_date).toISOString(),
    status: row.status,
    retro_notes: row.retro_notes,
    projects: [],
  };
}

export async function addProjectToSprintInDb(
  sprintId: string,
  project: { project_name: string; github_repo: string },
): Promise<DbSprintProject> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [row] = await sql`
    insert into public.sprint_projects (sprint_id, project_name, github_repo)
    values (${sprintId}, ${project.project_name}, ${project.github_repo})
    returning id, project_name, github_repo
  `;

  return {
    id: row.id,
    project_name: row.project_name,
    github_repo: row.github_repo,
    tasks: [],
  };
}

export async function addTaskToProjectInDb(
  projectId: string,
  task: { task_text: string; status: "completed" | "in-progress" | "pending"; pr_link?: string | null },
): Promise<DbSprintTask> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [row] = await sql`
    insert into public.sprint_tasks (project_id, task_text, status, pr_link)
    values (${projectId}, ${task.task_text}, ${task.status}, ${task.pr_link || null})
    returning id, task_text, status, pr_link
  `;

  return {
    id: row.id,
    task_text: row.task_text,
    status: row.status,
    pr_link: row.pr_link,
  };
}

export async function updateTaskStatusInDb(
  taskId: string,
  status: "completed" | "carried-forward" | "rejected" | "pending" | "in-progress"
): Promise<void> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await sql.begin(async (tx) => {
    const [currentTask] = await tx`
      select status, task_text, project_id from public.sprint_tasks
      where id = ${taskId}
    `;

    await tx`
      update public.sprint_tasks
      set status = ${status}, updated_at = now()
      where id = ${taskId}
    `;

    if (currentTask && currentTask.status === "carried-forward" && status !== "carried-forward") {
      const [projectDetails] = await tx`
        select p.project_name, p.github_repo, s.sprint_number
        from public.sprint_projects p
        join public.sprints s on p.sprint_id = s.id
        where p.id = ${currentTask.project_id}
      `;

      if (projectDetails) {
        let nextSprintNum = Number(projectDetails.sprint_number) + 1;
        const taskText = currentTask.task_text;
        const projectName = projectDetails.project_name;

        while (true) {
          const [nextSprint] = await tx`
            select id from public.sprints where sprint_number = ${nextSprintNum}
          `;
          if (!nextSprint) break;

          const [nextTask] = await tx`
            select t.id, t.status from public.sprint_tasks t
            join public.sprint_projects p on t.project_id = p.id
            where p.sprint_id = ${nextSprint.id} 
              and p.project_name = ${projectName}
              and t.task_text = ${taskText}
          `;

          if (!nextTask) break;

          const wasNextCarried = nextTask.status === "carried-forward";

          await tx`
            delete from public.sprint_tasks where id = ${nextTask.id}
          `;

          if (!wasNextCarried) {
            break;
          }

          nextSprintNum++;
        }
      }
    }

    if (status === "carried-forward") {
      const [taskDetails] = await tx`
        select t.task_text, p.project_name, p.github_repo, s.sprint_number
        from public.sprint_tasks t
        join public.sprint_projects p on t.project_id = p.id
        join public.sprints s on p.sprint_id = s.id
        where t.id = ${taskId}
      `;

      if (taskDetails) {
        const nextSprintNumber = Number(taskDetails.sprint_number) + 1;
        
        const [nextSprint] = await tx`
          select id from public.sprints where sprint_number = ${nextSprintNumber}
        `;

        if (nextSprint) {
          let [nextProject] = await tx`
            select id from public.sprint_projects
            where sprint_id = ${nextSprint.id} and project_name = ${taskDetails.project_name}
          `;

          if (!nextProject) {
            [nextProject] = await tx`
              insert into public.sprint_projects (sprint_id, project_name, github_repo)
              values (${nextSprint.id}, ${taskDetails.project_name}, ${taskDetails.github_repo})
              returning id
            `;
          }

          const [existingTask] = await tx`
            select id from public.sprint_tasks
            where project_id = ${nextProject.id} and task_text = ${taskDetails.task_text}
          `;

          if (!existingTask) {
            await tx`
              insert into public.sprint_tasks (project_id, task_text, status)
              values (${nextProject.id}, ${taskDetails.task_text}, 'pending')
            `;
          }
        }
      }
    }
  });
}

export async function deleteSprintFromDb(sprintId: string): Promise<void> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const [sprint] = await sql`
    select sprint_number from public.sprints where id = ${sprintId}
  `;

  if (!sprint) return;

  await sql.begin(async (tx) => {
    // Delete sprint
    await tx`
      delete from public.sprints
      where id = ${sprintId}
    `;

    // Reindex subsequent sprints
    await tx`
      update public.sprints
      set sprint_number = sprint_number - 1, updated_at = now()
      where sprint_number > ${sprint.sprint_number}
    `;
  });
}

export async function deleteTaskFromDb(taskId: string): Promise<void> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await sql`
    delete from public.sprint_tasks
    where id = ${taskId}
  `;
}

export async function deleteProjectFromSprintInDb(projectId: string): Promise<void> {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await sql`
    delete from public.sprint_projects
    where id = ${projectId}
  `;
}
