'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, Info, Clock, CheckCheck, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Bell; color: string }> = {
  health_alert: { icon: AlertTriangle, color: 'text-danger' },
  alert: { icon: AlertTriangle, color: 'text-danger' },
  reminder: { icon: Clock, color: 'text-warning' },
  info: { icon: Info, color: 'text-info' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications((await res.json()).notifications);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setToast({ msg: 'All marked as read', type: 'success' });
        fetchNotifications();
      }
    } catch {
      setToast({ msg: 'Failed', type: 'error' });
    } finally {
      setMarking(false);
    }
  }

  async function markRead(ids: string[]) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) fetchNotifications();
    } catch {
      /* ignore */
    }
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unread > 0 && <p className="text-sm text-muted-foreground">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} disabled={marking} className="btn btn-secondary">
            {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-muted-foreground text-sm mt-1">You&apos;re all caught up! Run a health check to generate alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`card flex items-start gap-3 cursor-pointer transition-colors ${
                  !n.isRead ? 'border-l-4 border-l-primary' : 'opacity-70'
                }`}
                onClick={() => { if (!n.isRead) markRead([n.id]); }}
              >
                <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium ${!n.isRead ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
