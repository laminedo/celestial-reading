-- One row per synced item (a profile, a journal day, a moon-cycle goal or a setting).
create table public.sync_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 200),
  value jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint value_size check (value is null or pg_column_size(value) < 20000)
);

alter table public.sync_items enable row level security;

create policy "Users read their own items" on public.sync_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add their own items" on public.sync_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their own items" on public.sync_items
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete their own items" on public.sync_items
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.sync_items from anon;
grant select, insert, update, delete on public.sync_items to authenticated;
