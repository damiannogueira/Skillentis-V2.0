import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "free" | "pro" | "pro_recruiter";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole;
  githubUsername: string | null;
  publicProfile: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  role: "free",
  githubUsername: null,
  publicProfile: true,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>("free");
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("github_username, public_profile").eq("id", userId).maybeSingle(),
    ]);

    if (roleData && roleData.length > 0) {
      const roles = roleData.map((r: any) => r.role as AppRole);
      if (roles.includes("pro_recruiter")) setRole("pro_recruiter");
      else if (roles.includes("pro")) setRole("pro");
      else setRole("free");
    } else {
      setRole("free");
    }

    setGithubUsername((profileData as any)?.github_username ?? null);
    setPublicProfile((profileData as any)?.public_profile ?? true);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setRole("free");
          setGithubUsername(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole("free");
    setGithubUsername(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, githubUsername, publicProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
