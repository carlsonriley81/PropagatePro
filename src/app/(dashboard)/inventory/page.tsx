'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Sprout, Plus, Search, X, Edit2, Trash2, Loader2,
} from 'lucide-react';

interface Plant {
  id: string;
  name: string;
  species: string;
  variety: string | null;
  source: string | null;
  location: string | null;
  healthStatus: string;
  isMotherPlant: boolean;
  quantity: number;
  notes: string | null;
  createdAt: string;
  _count: { cuttings: number };
}

const healthBadge: Record<string, string> = {
  healthy: 'badge-healthy',
  delayed: 'badge-delayed',
  at_risk: 'badge-at-risk',
  likely_failed: 'badge-likely-failed',
};

export default function InventoryPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPlant, setEditPlant] = useState<Plant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '', species: '', variety: '', source: '', location: '', notes: '', healthStatus: 'healthy',
  });

  const fetchPlants = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/plants?${params}`);
      if (res.ok) {
        const json = await res.json();
        setPlants(json.plants);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function openAdd() {
    setEditPlant(null);
    setForm({ name: '', species: '', variety: '', source: '', location: '', notes: '', healthStatus: 'healthy' });
    setShowForm(true);
  }

  function openEdit(p: Plant) {
    setEditPlant(p);
    setForm({
      name: p.name,
      species: p.species,
      variety: p.variety || '',
      source: p.source || '',
      location: p.location || '',
      notes: p.notes || '',
      healthStatus: p.healthStatus,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.species) return;
    setSubmitting(true);
    try {
      const url = editPlant ? `/api/plants/${editPlant.id}` : '/api/plants';
      const method = editPlant ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setToast({ msg: editPlant ? 'Plant updated' : 'Plant added', type: 'success' });
        fetchPlants();
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this plant?')) return;
    try {
      const res = await fetch(`/api/plants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ msg: 'Plant deleted', type: 'success' });
        fetchPlants();
      }
    } catch {
      setToast({ msg: 'Failed to delete', type: 'error' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button onClick={openAdd} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add Plant
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search plants by name or species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : plants.length === 0 ? (
        <div className="card text-center py-12">
          <Sprout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No plants yet</p>
          <p className="text-muted-foreground text-sm mt-1">Add your first mother plant to start tracking.</p>
          <button onClick={openAdd} className="btn btn-primary mt-4">
            <Plus className="h-4 w-4" /> Add Plant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((p) => (
            <div key={p.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.species}{p.variety ? ` — ${p.variety}` : ''}</p>
                </div>
                <span className={`badge ${healthBadge[p.healthStatus] || 'badge-info'}`}>
                  {p.healthStatus.replace('_', ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {p.location && <span>📍 {p.location}</span>}
                <span>✂️ {p._count.cuttings} cuttings</span>
                <span>🌱 Qty: {p.quantity}</span>
              </div>
              {p.notes && <p className="text-sm text-muted-foreground line-clamp-2">{p.notes}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(p)} className="btn btn-ghost text-sm py-1.5 px-3">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(p.id)} className="btn btn-ghost text-sm py-1.5 px-3 text-danger">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editPlant ? 'Edit Plant' : 'Add Plant'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
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
                  <label className="block text-sm font-medium mb-1">Source</label>
                  <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Health Status</label>
                <select value={form.healthStatus} onChange={(e) => setForm({ ...form, healthStatus: e.target.value })} className="input">
                  <option value="healthy">Healthy</option>
                  <option value="delayed">Delayed</option>
                  <option value="at_risk">At Risk</option>
                  <option value="likely_failed">Likely Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[80px]" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editPlant ? 'Update' : 'Add Plant'}
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
