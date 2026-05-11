import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";

const TYPE_ICONS: Record<string, string> = {
  new_order:       "🎬",
  order_accepted:  "✅",
  delivery:        "🎉",
  payment_released:"💰",
  order_declined:  "❌",
  dispute:         "⚠️",
  default:         "🔔",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unread, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = (n: typeof notifications[0]) => {
    markAsRead(n.id);
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-secondary/50 transition-smooth"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-smooth" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs font-bold grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border/50 rounded-2xl shadow-elegant overflow-hidden z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="font-semibold text-sm">Notificações</span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
                  <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                </Button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Nenhuma notificação ainda
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary/50 border-b border-border/30 last:border-0 transition-smooth flex items-start gap-3 ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[n.type] ?? TYPE_ICONS.default}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
