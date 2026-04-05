-- Enable replica identity full so that Supabase real-time captures all fields on UPDATE
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE jobs REPLICA IDENTITY FULL;
ALTER TABLE workstreams REPLICA IDENTITY FULL;
