-- 00005_review_fixes.sql
-- Fixes critical RLS policies, adds missing ON DELETE behaviors, indexes,
-- constraints, and hardens SECURITY DEFINER functions.

-- ============================================================
-- 1 & 2. CRITICAL: Fix comments_insert and comments_delete policies
--    They must verify the user is a member of the task's project.
-- ============================================================

drop policy "comments_insert" on comments;
create policy "comments_insert" on comments for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from tasks t
    join project_members pm on pm.project_id = t.project_id
    where t.id = comments.task_id and pm.user_id = auth.uid()
  )
);

drop policy "comments_delete" on comments;
create policy "comments_delete" on comments for delete using (
  user_id = auth.uid()
  and exists (
    select 1 from tasks t
    join project_members pm on pm.project_id = t.project_id
    where t.id = comments.task_id and pm.user_id = auth.uid()
  )
);

-- ============================================================
-- 3. Add missing ON DELETE behaviors
-- ============================================================

-- projects.created_by → ON DELETE SET NULL
alter table projects
  drop constraint projects_created_by_fkey,
  add constraint projects_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

-- tasks.assignee → ON DELETE SET NULL
alter table tasks
  drop constraint tasks_assignee_fkey,
  add constraint tasks_assignee_fkey
    foreign key (assignee) references public.profiles(id) on delete set null;

-- tasks.created_by → ON DELETE SET NULL
alter table tasks
  drop constraint tasks_created_by_fkey,
  add constraint tasks_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete set null;

-- comments.user_id → ON DELETE SET NULL (drop NOT NULL first)
alter table comments alter column user_id drop not null;
alter table comments
  drop constraint comments_user_id_fkey,
  add constraint comments_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete set null;

-- notifications.user_id → ON DELETE CASCADE
alter table notifications
  drop constraint notifications_user_id_fkey,
  add constraint notifications_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

-- jobs.started_by → ON DELETE SET NULL
alter table jobs
  drop constraint jobs_started_by_fkey,
  add constraint jobs_started_by_fkey
    foreign key (started_by) references public.profiles(id) on delete set null;

-- ============================================================
-- 4. Fix initials computation for single-name users
--    When there is only one name part, use just the first letter
--    instead of doubling it.
-- ============================================================

drop trigger on_auth_user_created on auth.users;
drop function public.handle_new_user();

create function public.handle_new_user()
returns trigger as $$
declare
  full_name text;
  parts text[];
begin
  full_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  parts := string_to_array(full_name, ' ');
  insert into public.profiles (id, name, email, initials)
  values (
    new.id,
    full_name,
    new.email,
    case
      when array_length(parts, 1) = 1 then upper(left(parts[1], 1))
      else upper(left(parts[1], 1) || left(parts[array_length(parts, 1)], 1))
    end
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. Add CHECK constraint on tasks.type
-- ============================================================

alter table tasks
  add constraint tasks_type_check
  check (type in ('feature', 'bug', 'chore', 'refactor', 'test'));

-- ============================================================
-- 6. Add project_members UPDATE policy
--    Admin can change roles; any member can update their own local_path.
-- ============================================================

create policy "members_update" on project_members for update using (
  -- admin of the project
  exists (
    select 1 from project_members pm
    where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role = 'admin'
  )
  -- or updating own row (for local_path)
  or user_id = auth.uid()
);

-- ============================================================
-- 7. Add missing indexes
-- ============================================================

create index idx_tasks_assignee on tasks(assignee);
create index idx_tasks_milestone on tasks(milestone_id);
create index idx_notifications_user on notifications(user_id);

-- ============================================================
-- 8. Fix notification triggers to skip self-notifications
-- ============================================================

drop trigger on_task_status_change on tasks;
drop function notify_on_task_status_change();

create function notify_on_task_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status
     and new.assignee is not null
     and new.assignee is distinct from auth.uid()
  then
    insert into notifications (user_id, type, task_id, message)
    values (new.assignee, 'status_change', new.id,
            'Task "' || new.title || '" moved to ' || new.status);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_task_status_change
  after update of status on tasks
  for each row execute function notify_on_task_status_change();

drop trigger on_task_assignment on tasks;
drop function notify_on_task_assignment();

create function notify_on_task_assignment()
returns trigger as $$
begin
  if new.assignee is not null
     and (old.assignee is null or old.assignee != new.assignee)
     and new.assignee is distinct from auth.uid()
  then
    insert into notifications (user_id, type, task_id, message)
    values (new.assignee, 'assignment', new.id,
            'You were assigned to "' || new.title || '"');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_task_assignment
  after update of assignee on tasks
  for each row execute function notify_on_task_assignment();

-- ============================================================
-- 9. Add `set search_path = public` to remaining SECURITY DEFINER function
--    (handle_new_user already recreated above with search_path set;
--     now fix create_project)
-- ============================================================

drop function public.create_project(text);

create function public.create_project(p_name text)
returns uuid as $$
declare
  new_id uuid;
begin
  insert into projects (name, created_by) values (p_name, auth.uid()) returning id into new_id;
  insert into project_members (project_id, user_id, role) values (new_id, auth.uid(), 'admin');
  return new_id;
end;
$$ language plpgsql security definer set search_path = public;
