-- Supabase exposes every table in the public schema through its auto-generated REST API.
-- This backend connects directly as the database owner role (which bypasses RLS), so enabling RLS
-- with NO policies simply blocks the public anon/authenticated API keys from reading or writing anything.
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
