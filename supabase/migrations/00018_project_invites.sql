-- Pending invitations for users who haven't registered yet
create table public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  email text not null,
  role text not null default 'dev' check (role in ('admin', 'dev', 'manager')),
  invited_by uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  unique(project_id, email)
);

alter table project_invites enable row level security;

-- Visible to project members
create policy "invites_select" on project_invites for select using (
  exists (select 1 from project_members pm where pm.project_id = project_invites.project_id and pm.user_id = auth.uid())
);

-- Admin can manage invites
create policy "invites_insert" on project_invites for insert with check (
  exists (select 1 from project_members pm where pm.project_id = project_invites.project_id and pm.user_id = auth.uid() and pm.role = 'admin')
);

create policy "invites_delete" on project_invites for delete using (
  exists (select 1 from project_members pm where pm.project_id = project_invites.project_id and pm.user_id = auth.uid() and pm.role = 'admin')
);

-- Resolve pending invites when a new user signs up
create or replace function public.resolve_pending_invites()
returns trigger as $$
begin
  insert into project_members (project_id, user_id, role)
  select pi.project_id, new.id, pi.role
  from project_invites pi
  where pi.email = new.email;

  delete from project_invites where email = new.email;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_resolve_invites
  after insert on public.profiles
  for each row execute function public.resolve_pending_invites();
