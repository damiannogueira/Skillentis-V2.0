import { useEffect, useState, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { es as esLocale, enUS as enLocale } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Notif {
  id: string;
  type: string;
  username: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const locale = i18n.language?.startsWith("es") ? esLocale : enLocale;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id, type, username, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data ?? []) as Notif[]);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    load();
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);
    load();
  };

  const handleClick = async (n: Notif) => {
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    }
    setOpen(false);
    if (n.username) navigate(`/dashboard/${n.username}`);
    load();
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label={t("notifications.bell.title")}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-display font-semibold text-sm">{t("notifications.bell.title")}</p>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              {t("notifications.bell.markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-4">
              {t("notifications.bell.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const isOk = n.type === "analysis_complete";
                const text = isOk
                  ? t("notifications.analysisComplete", { username: n.username ?? "" })
                  : t("notifications.analysisFailed", { username: n.username ?? "" });
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors flex gap-3 ${!n.read_at ? "bg-primary/5" : ""}`}
                    >
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.read_at ? "bg-primary" : "bg-transparent"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale })}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
