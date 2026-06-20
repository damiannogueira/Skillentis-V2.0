ALTER TABLE public.profiles ADD COLUMN github_username TEXT;
CREATE INDEX idx_profiles_github_username ON public.profiles(github_username);