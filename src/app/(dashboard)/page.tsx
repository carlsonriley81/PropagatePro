'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Sprout, Scissors, TrendingUp, Timer, ShoppingBag, AlertTriangle,
  ThumbsDown, DollarSign, Plus, Play, ShieldCheck, Bell, Loader2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  totalPlants: number;
  totalCuttings: number;
  activePropagations: number;
  rootingSuccessRate: number;
  timeWorkedThisWeek: number;
  plantsReadyForSale: number;
  cuttingsAtRisk: number;
  failureRate: number;
  recentNotifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }>;
  revenueThisMonth: number;
}

interface HealthResult {
  totalChecked: number;
  statusChanges: number;
  results: Array<{
    cuttingId: string;
    newStatus: string;
  }>;
}

function formatSeconds(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function runHealthCheck() {
    setHealthLoading(true);
    try {
      const res = await fetch('/api/dashboard/health-check', { method: 'POST' });
      if (res.ok) {
        const result: HealthResult = await res.json();
        setToast({ msg: `Checked ${result.totalChecked} cuttings, ${result.statusChanges} status changes`, type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Health check failed', type: 'error' });
    } finally {
      setHealthLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-muted-foreground">Failed to load dashboard data.</div>;
  }

  const statCards = [
    { label: 'Total Plants', value: data.totalPlants, icon: Sprout, color: 'text-primary' },
    { label: 'Active Propagations', value: data.activePropagations, icon: Scissors, color: 'text-info' },
    { label: 'Success Rate', value: `${data.rootingSuccessRate}%`, icon: TrendingUp, color: 'text-success' },
    { label: 'Time This Week', value: formatSeconds(data.timeWorkedThisWeek), icon: Timer, color: 'text-primary' },
    { label: 'Ready for Sale', value: data.plantsReadyForSale, icon: ShoppingBag, color: 'text-success' },
    { label: 'At Risk', value: data.cuttingsAtRisk, icon: AlertTriangle, color: data.cuttingsAtRisk > 0 ? 'text-at-risk' : 'text-success' },
    { label: 'Failure Rate', value: `${data.failureRate}%`, icon: ThumbsDown, color: data.failureRate > 10 ? 'text-danger' : 'text-success' },
    { label: 'Revenue This Month', value: `$${data.revenueThisMonth.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ];

  const healthData = [
    { name: 'Healthy', count: data.totalCuttings - data.cuttingsAtRisk, fill: 'var(--healthy)' },
    { name: 'At Risk', count: data.cuttingsAtRisk, fill: 'var(--at-risk)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/cuttings?new=1" className="btn btn-primary">
            <Plus className="h-4 w-4" /> New Cutting
          </Link>
          <Link href="/tasks" className="btn btn-secondary">
            <Play className="h-4 w-4" /> Start Timer
          </Link>
          <button onClick={runHealthCheck} disabled={healthLoading} className="btn btn-secondary">
            {healthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Health Check
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Health Status Breakdown</h2>
          {data.totalCuttings === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No cuttings yet. Add your first cutting to see stats.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={healthData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Notifications</h2>
            <Link href="/notifications" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {data.recentNotifications.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentNotifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3">
                  <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${
                    n.type === 'health_alert' ? 'text-danger' : n.type === 'reminder' ? 'text-warning' : 'text-info'
                  }`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${n.isRead ? 'text-muted-foreground' : ''}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
