'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Package, Plus, X, Loader2 } from 'lucide-react';

interface Supply {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string | null;
  costPerUnit: number;
  totalCost: number;
  purchasedAt: string | null;
  notes: string | null;
  createdAt: string;
}

const categories = ['soil', 'containers', 'fertilizer', 'tools', 'lighting', 'propagation', 'other'];

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: '', category: 'soil', quantity: '1', unit: '', costPerUnit: '0', notes: '',
  });

  const fetchSupplies = useCallback(async () => {
    try {
      const res = await fetch('/api/supplies');
      if (res.ok) setSupplies((await res.json()).supplies);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSupplies(); }, [fetchSupplies]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.category) return;
    setSubmitting(true);
    try {
      const qty = parseInt(form.quantity) || 0;
      const cpu = parseFloat(form.costPerUnit) || 0;
      const res = await fetch('/api/supplies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          quantity: qty,
          unit: form.unit || undefined,
          costPerUnit: cpu,
          totalCost: qty * cpu,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', category: 'soil', quantity: '1', unit: '', costPerUnit: '0', notes: '' });
        setToast({ msg: 'Supply added', type: 'success' });
        fetchSupplies();
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

  const totalCost = supplies.reduce((s, sup) => s + sup.totalCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Supplies</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add Supply
        </button>
      </div>

      <div className="card text-center max-w-xs">
        <p className="text-xs text-muted-foreground">Total Supply Cost</p>
        <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : supplies.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No supplies tracked</p>
          <p className="text-muted-foreground text-sm mt-1">Track your propagation supplies and costs.</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-4">
            <Plus className="h-4 w-4" /> Add Supply
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="space-y-2">
            {supplies.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {s.category} · {s.quantity}{s.unit ? ` ${s.unit}` : ''} @ ${s.costPerUnit.toFixed(2)}/ea
                  </p>
                </div>
                <p className="text-sm font-bold">${s.totalCost.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Supply</h2>
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
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                  {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input" placeholder="e.g. bags" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost/Unit</label>
                  <input type="number" step="0.01" min="0" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[60px]" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Supply'}
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
