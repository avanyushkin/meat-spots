-- Выполнить в Supabase SQL Editor проекта.
create table shop_status (
  shop_id text primary key,
  visited boolean not null default false,
  note text not null default '',
  updated_at timestamptz not null default now()
);

alter table shop_status enable row level security;

create policy "authenticated read/write"
on shop_status
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- включить realtime для таблицы
alter publication supabase_realtime add table shop_status;
