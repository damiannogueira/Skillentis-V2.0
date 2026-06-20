-- 1. Add public_profile column (default true = opt-out)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS public_profile boolean NOT NULL DEFAULT true;

-- 2. Security definer function to expose only visibility + owner role for a given github username
CREATE OR REPLACE FUNCTION public.get_profile_visibility(_github_username text)
RETURNS TABLE(public_profile boolean, owner_role app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.public_profile,
    COALESCE(
      (
        SELECT
          CASE
            WHEN bool_or(ur.role = 'pro_recruiter') THEN 'pro_recruiter'::app_role
            WHEN bool_or(ur.role = 'pro') THEN 'pro'::app_role
            ELSE 'free'::app_role
          END
        FROM public.user_roles ur
        WHERE ur.user_id = p.id
      ),
      'free'::app_role
    ) AS owner_role
  FROM public.profiles p
  WHERE lower(p.github_username) = lower(_github_username)
  LIMIT 1
$$;

-- 3. Restrict execution: anyone (anon + authenticated) can call this safe function
REVOKE ALL ON FUNCTION public.get_profile_visibility(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_visibility(text) TO anon, authenticated;