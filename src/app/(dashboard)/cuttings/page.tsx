'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Scissors, Plus, X, Filter, ArrowRight, Loader2,
} from 'lucide-react';

interface Cutting {
  id: string;
  uniqueCode: string;
  species: string;
  variety: string | null;
  propagationMethod: string;
  rootingStatus: string;
  healthStatus: string;
  location: string | null;
  dateCut: string;
  nodeCount: number;
  notes: string | null;
  plant: { id: string; name: string; species: string } | null;
  batch: { id: string; name: string } | null;
}

const statusFlow = ['not_started', 'rooting', 'rooted', 'transplanted'];

const healthBadge: Record<string, string> = {
  healthy: 'badge-healthy',
  delayed: 'badge-delayed',
  at_risk: 'badge-at-risk',
  likely_failed: 'badge-likely-failed',
};

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function CuttingsPage() {
  const searchParams = useSearchParams();
  const [cuttings, setCuttings] = useState<Cutting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(searchParams.get('new') === '1');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterRooting, setFilterRooting] = useState('');
  const [filterHealth, setFilterHealth] = useState('');

  const [form, setForm] = useState({
    species: '', variety: '', propagationMethod: 'water', location: '', notes: '', nodeCount: '1',
  });

  const fetchCuttings = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterSpecies) params.set('species', filterSpecies);
    if (filterRooting) params.set('rootingStatus', filterRooting);
    if (filterHealth) params.set('healthStatus', filterHealth);
    try {
      const res = await fetch(`/api/cuttings?${params}`);
      if (res.ok) {
        const json = await res.json();
        setCuttings(json.cuttings);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filterSpecies, filterRooting, filterHealth]);

  useEffect(() => { fetchCuttings(); }, [fetchCuttings]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.species) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/cuttings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, nodeCount: parseInt(form.nodeCount) || 1 }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ species: '', variety: '', propagationMethod: 'water', location: '', notes: '', nodeCount: '1' });
        setToast({ msg: 'Cutting added', type: 'success' });
        fetchCuttings();
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

  async function advanceStatus(cutting: Cutting) {
    const idx = statusFlow.indexOf(cutting.rootingStatus);
    if (idx < 0 || idx >= statusFlow.length - 1) return;
    const next = statusFlow[idx + 1];
    try {
      const res = await fetch(`/api/cuttings/${cutting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootingStatus: next }),
      });
      if (res.ok) {
        setToast({ msg: `Status updated to ${next.replace('_', ' ')}`, type: 'success' });
        fetchCuttings();
      }
    } catch {
      setToast({ msg: 'Failed to update', type: 'error' });
    }
  }

  const species = [...new Set(cuttings.map((c) => c.species))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Cuttings</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add Cutting
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select value={filterSpecies} onChange={(e) => setFilterSpecies(e.target.value)} className="input max-w-[180px]">
          <option value="">All Species</option>
          {species.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterRooting} onChange={(e) => setFilterRooting(e.target.value)} className="input max-w-[180px]">
          <option value="">All Stages</option>
          <option value="not_started">Not Started</option>
          <option value="rooting">Rooting</option>
          <option value="rooted">Rooted</option>
          <option value="transplanted">Transplanted</option>
          <option value="sold">Sold</option>
          <option value="dead">Dead</option>
        </select>
        <select value={filterHealth} onChange={(e) => setFilterHealth(e.target.value)} className="input max-w-[180px]">
          <option value="">All Health</option>
          <option value="healthy">Healthy</option>
          <option value="delayed">Delayed</option>
          <option value="at_risk">At Risk</option>
          <option value="likely_failed">Likely Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : cuttings.length === 0 ? (
        <div className="card text-center py-12">
          <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No cuttings found</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first cutting to start tracking propagation.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
            <Plus className="h-4 w-4" /> Add Cutting
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuttings.map((c) => (
            <div key={c.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.species}{c.variety ? ` — ${c.variety}` : ''}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.uniqueCode}</p>
                </div>
                <span className={`badge shrink-0 ${healthBadge[c.healthStatus] || 'badge-info'}`}>
                  {c.healthStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>🧪 {c.propagationMethod}</span>
                <span>📊 {c.rootingStatus.replace('_', ' ')}</span>
                <span>📅 {daysSince(c.dateCut)}d ago</span>
                {c.location && <span>📍 {c.location}</span>}
              </div>
              {c.plant && (
                <p className="text-xs text-muted-foreground">From: {c.plant.name}</p>
              )}
              {statusFlow.includes(c.rootingStatus) && statusFlow.indexOf(c.rootingStatus) < statusFlow.length - 1 && (
                <button
                  onClick={() => advanceStatus(c)}
                  className="btn btn-secondary text-sm py-1.5 w-full"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Advance to {statusFlow[statusFlow.indexOf(c.rootingStatus) + 1].replace('_', ' ')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Cutting</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Species *</label>
                <input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Variety</label>
                <input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Method</label>
                  <select value={form.propagationMethod} onChange={(e) => setForm({ ...form, propagationMethod: e.target.value })} className="input">
                    <option value="water">Water</option>
                    <option value="soil">Soil</option>
                    <option value="perlite">Perlite</option>
                    <option value="sphagnum">Sphagnum</option>
                    <option value="leca">LECA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Node Count</label>
                  <input type="number" min="1" value={form.nodeCount} onChange={(e) => setForm({ ...form, nodeCount: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px]" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Cutting'}
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
