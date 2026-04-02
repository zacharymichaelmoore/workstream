alter table tasks add column if not exists priority text not null default 'backlog' check (priority in ('critical', 'upcoming', 'backlog'));
