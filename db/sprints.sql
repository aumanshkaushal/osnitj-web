create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  sprint_number integer not null unique,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null check (status in ('retro', 'active', 'upcoming')),
  retro_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sprint_projects (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid references public.sprints(id) on delete cascade,
  project_name text not null,
  github_repo text not null, -- e.g. 'Opensource-NITJ/asknitj'
  created_at timestamptz not null default now()
);

create table if not exists public.sprint_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.sprint_projects(id) on delete cascade,
  task_text text not null,
  status text not null check (status in ('completed', 'in-progress', 'pending')),
  pr_link text,
  created_at timestamptz not null default now(),
  updated_at uuid references public.sprint_tasks(id) -- placeholder, actually timestamptz not null default now()
);

-- fix tasks table updated_at definition
drop table if exists public.sprint_tasks cascade;

create table if not exists public.sprint_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.sprint_projects(id) on delete cascade,
  task_text text not null,
  status text not null check (status in ('completed', 'in-progress', 'pending')),
  pr_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sprints_number_idx on public.sprints (sprint_number desc);
