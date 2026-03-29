'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Leaf, LayoutDashboard, Sprout, Scissors, Layers, Timer,
  DollarSign, TrendingUp, Zap, Package, Bell, Settings,
  Sun, Moon, Menu, X, LogOut, ChevronLeft,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Sprout },
  { href: '/cuttings', label: 'Cuttings', icon: Scissors },
  { href: '/batches', label: 'Batches', icon: Layers },
  { href: '/tasks', label: 'Tasks & Timer', icon: Timer },
  { href: '/sales', label: 'Sales', icon: DollarSign },
  { href: '/business', label: 'Business', icon: TrendingUp },
  { href: '/automation', label: 'Automation', icon: Zap },
  { href: '/supplies', label: 'Supplies', icon: Package },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function subscribeDark(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}
function getDarkSnapshot() {
  return document.documentElement.classList.contains('dark');
}
function getDarkServerSnapshot() {
  return false;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const dark = useSyncExternalStore(subscribeDark, getDarkSnapshot, getDarkServerSnapshot);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  function toggleDark() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col bg-sidebar border-r border-border transition-all duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <div className={`flex items-center gap-2 px-4 h-16 border-b border-border shrink-0 ${collapsed ? 'justify-center' : ''}`}>
          <Leaf className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="font-bold text-lg truncate">PropagatePro</span>}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1 rounded hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-active text-primary'
                    : 'text-sidebar-foreground hover:bg-muted'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex border-t border-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-ghost w-full justify-center p-2"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-4 h-16 px-4 md:px-6 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-muted" title="Toggle theme">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link href="/notifications" className="p-2 rounded-lg hover:bg-muted relative" title="Notifications">
            <Bell className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:block text-sm font-medium truncate max-w-[120px]">{user.name}</span>
            <button onClick={() => { logout(); router.push('/login'); }} className="p-2 rounded-lg hover:bg-muted" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
