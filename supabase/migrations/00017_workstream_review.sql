-- Add pr_url to workstreams for storing the created PR link
alter table workstreams add column if not exists pr_url text;

-- Add workstreams to realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'workstreams'
  ) then
    alter publication supabase_realtime add table workstreams;
  end if;
end $$;
