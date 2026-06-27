create table if not exists public.dispatches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  author_name text not null,
  author_github text not null,
  date timestamptz not null default now(),
  read_time integer not null default 1,
  markdown_content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dispatches_date_idx
  on public.dispatches (date desc);
