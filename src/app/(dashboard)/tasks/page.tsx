'use client';

import { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
import {
  Timer, Play, Square, Plus, X, Clock, Loader2,
} from 'lucide-react';

interface TimeLog {
  id: string;
  taskType: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  isRunning: boolean;
  notes: string | null;
  cutting: { id: string; uniqueCode: string; species: string } | null;
}

interface Task {
  id: string;
  taskType: string;
  description: string | null;
  duration: number | null;
  completedAt: string | null;
  createdAt: string;
  cutting: { id: string; uniqueCode: string; species: string } | null;
}

const taskTypes = ['cutting', 'planting', 'water_change', 'transplanting', 'maintenance'];

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TasksPage() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [timerType, setTimerType] = useState('maintenance');
  const [timerNotes, setTimerNotes] = useState('');
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [taskForm, setTaskForm] = useState({
    taskType: 'maintenance', description: '', duration: '',
  });

  const activeTimer = timeLogs.find((t) => t.isRunning);

  const fetchData = useCallback(async () => {
    try {
      const [tlRes, tRes] = await Promise.all([
        fetch('/api/timelogs'),
        fetch('/api/tasks'),
      ]);
      if (tlRes.ok) {
        const tlJson = await tlRes.json();
        setTimeLogs(tlJson.timeLogs);
      }
      if (tRes.ok) {
        const tJson = await tRes.json();
        setTasks(tJson.tasks);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (activeTimer) {
      const start = new Date(activeTimer.startTime).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    } else {
      setElapsed(0);
    }
  }, [activeTimer]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function startTimer() {
    setStarting(true);
    try {
      const res = await fetch('/api/timelogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType: timerType, notes: timerNotes || undefined }),
      });
      if (res.ok) {
        setTimerNotes('');
        setToast({ msg: 'Timer started', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed to start timer', type: 'error' });
    } finally {
      setStarting(false);
    }
  }

  async function stopTimer() {
    if (!activeTimer) return;
    setStopping(true);
    try {
      const res = await fetch(`/api/timelogs/${activeTimer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setToast({ msg: 'Timer stopped', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed to stop timer', type: 'error' });
    } finally {
      setStopping(false);
    }
  }

  async function handleTaskSubmit(e: FormEvent) {
    e.preventDefault();
    if (!taskForm.taskType) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: taskForm.taskType,
          description: taskForm.description || undefined,
          duration: taskForm.duration ? parseInt(taskForm.duration) * 60 : undefined,
          completedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setShowTaskForm(false);
        setTaskForm({ taskType: 'maintenance', description: '', duration: '' });
        setToast({ msg: 'Task logged', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed to log task', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const completedLogs = timeLogs.filter((t) => !t.isRunning);
  const totalSeconds = completedLogs.reduce((s, t) => s + (t.duration || 0), 0);
  const typeSummary: Record<string, number> = {};
  completedLogs.forEach((t) => {
    typeSummary[t.taskType] = (typeSummary[t.taskType] || 0) + (t.duration || 0);
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks & Timer</h1>

      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" /> Timer
        </h2>

        {activeTimer ? (
          <div className="text-center space-y-4">
            <div className="text-5xl font-mono font-bold text-primary">
              {formatDuration(elapsed)}
            </div>
            <p className="text-sm text-muted-foreground">
              Task: {activeTimer.taskType.replace('_', ' ')}
              {activeTimer.notes && ` — ${activeTimer.notes}`}
            </p>
            <button onClick={stopTimer} disabled={stopping} className="btn btn-danger mx-auto">
              {stopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Stop Timer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <select value={timerType} onChange={(e) => setTimerType(e.target.value)} className="input max-w-[200px]">
                {taskTypes.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
              <input
                placeholder="Notes (optional)"
                value={timerNotes}
                onChange={(e) => setTimerNotes(e.target.value)}
                className="input max-w-[300px]"
              />
              <button onClick={startTimer} disabled={starting} className="btn btn-primary">
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" /> Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted text-center">
            <p className="text-xs text-muted-foreground">Total Time</p>
            <p className="text-lg font-bold">{formatDuration(totalSeconds)}</p>
          </div>
          {Object.entries(typeSummary).map(([type, secs]) => (
            <div key={type} className="p-3 rounded-lg bg-muted text-center">
              <p className="text-xs text-muted-foreground capitalize">{type.replace('_', ' ')}</p>
              <p className="text-lg font-bold">{formatDuration(secs)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Task Log</h2>
          <button onClick={() => setShowTaskForm(true)} className="btn btn-secondary text-sm">
            <Plus className="h-4 w-4" /> Manual Entry
          </button>
        </div>

        {tasks.length === 0 && completedLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No tasks logged yet. Start a timer or add a manual entry.</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-sm font-medium capitalize">{t.taskType.replace('_', ' ')}</span>
                  {t.description && <span className="text-sm text-muted-foreground ml-2">— {t.description}</span>}
                  {t.cutting && <span className="text-xs text-muted-foreground ml-2">({t.cutting.species})</span>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.duration ? formatDuration(t.duration) : '—'}
                </div>
              </div>
            ))}
            {completedLogs.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <span className="text-sm font-medium capitalize">{t.taskType.replace('_', ' ')}</span>
                  {t.notes && <span className="text-sm text-muted-foreground ml-2">— {t.notes}</span>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.duration ? formatDuration(t.duration) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Log Manual Task</h2>
              <button onClick={() => setShowTaskForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Task Type *</label>
                <select value={taskForm.taskType} onChange={(e) => setTaskForm({ ...taskForm, taskType: e.target.value })} className="input">
                  {taskTypes.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input type="number" min="1" value={taskForm.duration} onChange={(e) => setTaskForm({ ...taskForm, duration: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowTaskForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Task'}
                </button>
              </div>
            </form>
          </div>
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
