# Locking down saved diagnoses (Row Level Security)

## The problem
On 2026-10-11 the `diagnoses` table was readable and writable by anyone holding the public Supabase "anon" key, which ships inside the app and is in this repo. A read-only count showed 51 rows visible. Anyone could read every user's saved diagnoses (problem text, car, user id) or change or delete them.

The cause was how the app talked to Supabase: it sent only the anon key, never the signed-in user's token, so the database could not tell users apart.

## The fix (this change plus one SQL script)
- `frontend/supabase.js` now sends the user's access token on every table request, refreshes it once when it expires, and uses the id returned by the insert instead of re-querying "the latest row".
- The backend no longer writes a copy of each diagnosis under user "anonymous". The app already saves history under the user's own id, and those anonymous copies were unattributed user content in the same exposed table.
- `supabase/migrations/002_diagnoses_rls.sql` turns on Row Level Security, removes any existing policies, and allows each signed-in user to read, add, change and delete only rows where `user_id` equals their own id. The anon key gets no access.

## Order (important)
1. Merge this change. The backend deploys; the app is unaffected (RLS is still off, so everything works either way).
2. Run the new app code (Expo Go from `C:\dev\autodoc\frontend`, or a TestFlight build) and check: sign in, send a diagnosis, open the menu and confirm it appears in history, open it, send a follow-up, delete one.
3. Only then run `002_diagnoses_rls.sql` in the Supabase SQL editor.
4. Repeat the app check from step 2. Then run the verification below.

Do not run the script before step 2: older app builds only send the public key and would stop saving and loading history.

## Verify
From any terminal, with the project URL and the anon key from `frontend/supabase.js`, this should now return no rows or an error (it returned 51 rows before):

    curl -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>" "<SUPABASE_URL>/rest/v1/diagnoses?select=id&limit=1"

Expected: `[]` or a permission error, not a list of ids.

## Side effects
- Existing rows saved under `"anonymous"` or under an email (older app versions) will no longer show up for anyone. They are not deleted. Delete them in the Supabase table editor if you do not need them.
- Users on a session saved before token refresh existed may need to sign in once.

## Not tested
The SQL was only syntax-checked with the Postgres parser; it has not been run against your project. The app code is unit-tested and bundles, but has not been run on a device against RLS. Do the check in step 2 and 4.
