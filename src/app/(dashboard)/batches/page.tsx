'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Layers, Plus, X, Loader2 } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  species: string;
  notes: string | null;
  successRate: number | null;
  createdAt: string;
  _count: { cuttings: number };
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', species: '', notes: '' });

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch('/api/batches');
      if (res.ok) {
        const json = await res.json();
        setBatches(json.batches);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.species) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', species: '', notes: '' });
        setToast({ msg: 'Batch created', type: 'success' });
        fetchBatches();
      } else {
        const err = await res.json();
        setToast({ msg: err.error || 'Failed', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Network error', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Batches</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> New Batch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : batches.length === 0 ? (
        <div className="card text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No batches yet</p>
          <p className="text-muted-foreground text-sm mt-1">Group your cuttings into batches for easier tracking.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
            <Plus className="h-4 w-4" /> Create Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="card space-y-3">
              <div>
                <h3 className="font-semibold">{b.name}</h3>
                <p className="text-sm text-muted-foreground">{b.species}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="font-medium">{b._count.cuttings} cuttings</span>
                <span className={`font-medium ${
                  (b.successRate ?? 0) >= 75 ? 'text-success' : (b.successRate ?? 0) >= 50 ? 'text-warning' : 'text-danger'
                }`}>
                  {b.successRate != null ? `${b.successRate}% success` : 'N/A'}
                </span>
              </div>
              {b.notes && <p className="text-sm text-muted-foreground line-clamp-2">{b.notes}</p>}
              <p className="text-xs text-muted-foreground">
                Created {new Date(b.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Create Batch</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Batch Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Species *</label>
                <input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px]" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Batch'}
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
