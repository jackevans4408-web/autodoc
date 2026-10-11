-- Lock down saved diagnoses so each signed-in user can only see and change their own rows.
--
-- RUN THIS LAST. Order matters:
--   1. Merge and deploy this change (backend no longer writes anonymous rows to this table).
--   2. Install an app build that includes this change (it sends the user's login token to Supabase).
--   3. Check the app still saves and loads history while this has NOT been run yet.
--   4. Then run this script in the Supabase SQL editor.
-- Running it earlier breaks history saving/loading in app versions that only send the public key.
--
-- Afterwards, rows whose user_id is not a real user id (the old "anonymous" rows written by the backend, or rows saved
-- under an email) become invisible to everyone. They are not deleted.

alter table public.diagnoses enable row level security;

-- Remove any existing policies (for example a "read access for all users" one created in the dashboard), so the only
-- way in is the set below.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'diagnoses' loop
    execute format('drop policy %I on public.diagnoses', p.policyname);
  end loop;
end $$;

-- Comparing as text works whether user_id is a text or uuid column.
create policy "own diagnoses: read"   on public.diagnoses for select to authenticated
  using (user_id::text = auth.uid()::text);

create policy "own diagnoses: insert" on public.diagnoses for insert to authenticated
  with check (user_id::text = auth.uid()::text);

create policy "own diagnoses: update" on public.diagnoses for update to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create policy "own diagnoses: delete" on public.diagnoses for delete to authenticated
  using (user_id::text = auth.uid()::text);

-- Belt and braces: the public (anon) key gets no access at all. The backend does not need this table.
revoke all on public.diagnoses from anon;
