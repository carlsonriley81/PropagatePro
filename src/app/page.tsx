'use client';

import Link from 'next/link';
import { Leaf, BarChart3, Timer, Zap, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const features = [
  { icon: Leaf, title: 'Plant Tracking', desc: 'Monitor every cutting from snip to sale with health assessments.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Success rates, revenue tracking, and species performance metrics.' },
  { icon: Timer, title: 'Time Tracking', desc: 'Log work sessions per task type and see weekly summaries.' },
  { icon: Zap, title: 'Automation', desc: 'Schedule lights and watering systems with smart device control.' },
  { icon: Shield, title: 'Health Alerts', desc: 'Automatic risk detection alerts you when cuttings need attention.' },
  { icon: Smartphone, title: 'Mobile Ready', desc: 'Manage your propagation station from anywhere on any device.' },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">PropagatePro</span>
        </div>
        <nav className="flex items-center gap-3">
          {!loading && user ? (
            <Link href="/inventory" className="btn btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Login</Link>
              <Link href="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-6 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium mb-6">
            <Leaf className="h-4 w-4 text-primary" /> Smart Propagation Tracking
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
            Grow Smarter with{' '}
            <span className="text-primary">PropagatePro</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Track every cutting, monitor health in real-time, automate your grow room, and turn your propagation hobby into a thriving business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
              Get Started Free
            </Link>
            <Link href="/login" className="btn btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Propagate Like a Pro</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="card flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to level up your propagation?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join growers who use PropagatePro to track, optimize, and scale their plant propagation.
          </p>
          <Link href="/register" className="btn btn-primary text-lg px-10 py-3">
            Start Tracking Today
          </Link>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PropagatePro. Built for plant lovers.
      </footer>
    </div>
  );
}
