-- Pre-launch security round 2: admin enumeration, forged audit/escrow rows,
-- and leftover table privileges on leads / escrow.

-- ---------- user_roles: stop public admin discovery ----------
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles: admin read" ON public.user_roles;
CREATE POLICY "user_roles: admin read"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Keep self-read (already present as "user_roles: read self").
REVOKE ALL ON public.user_roles FROM PUBLIC, anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- ---------- security_events: RPC-only writes ----------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.security_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
DROP POLICY IF EXISTS "security_events: actor insert" ON public.security_events;

-- ---------- escrow_transactions: RPC-only writes ----------
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.escrow_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.escrow_transactions TO authenticated;
GRANT ALL ON public.escrow_transactions TO service_role;

-- ---------- boatshow_leads: insert-only for public form ----------
REVOKE SELECT, UPDATE, DELETE, TRUNCATE ON public.boatshow_leads FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.boatshow_leads TO anon, authenticated;
GRANT SELECT ON public.boatshow_leads TO authenticated;
GRANT ALL ON public.boatshow_leads TO service_role;
