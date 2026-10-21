-- 0010: Asks Supabase to reload its list of tables and columns, so the app
-- sees the deposit, replacement cost, email log and kit columns added in
-- 0005-0009 right away. It changes no tables and removes nothing.
-- Safe to run any number of times.

notify pgrst, 'reload schema';