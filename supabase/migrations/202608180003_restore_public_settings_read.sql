begin;

-- The initial migration intentionally revoked anonymous access to this table.
-- Restore only SELECT; RLS still limits visitors to rows marked is_public.
grant select on table public.site_settings to anon, authenticated;

commit;
