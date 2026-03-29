'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  DollarSign, Plus, X, Loader2, TrendingUp,
} from 'lucide-react';

interface Sale {
  id: string;
  salePrice: number;
  costBasis: number;
  profit: number;
  buyerName: string | null;
  soldAt: string;
  cutting: { id: string; uniqueCode: string; species: string; variety: string | null } | null;
}

interface CuttingOption {
  id: string;
  uniqueCode: string;
  species: string;
  variety: string | null;
  rootingStatus: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cuttings, setCuttings] = useState<CuttingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    cuttingId: '', salePrice: '', buyerName: '', notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/cuttings'),
      ]);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setSales(sJson.sales);
      }
      if (cRes.ok) {
        const cJson = await cRes.json();
        setCuttings(cJson.cuttings.filter((c: CuttingOption) =>
          ['rooted', 'transplanted'].includes(c.rootingStatus)
        ));
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.cuttingId || !form.salePrice) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuttingId: form.cuttingId,
          salePrice: parseFloat(form.salePrice),
          buyerName: form.buyerName || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ cuttingId: '', salePrice: '', buyerName: '', notes: '' });
        setToast({ msg: 'Sale recorded', type: 'success' });
        fetchData();
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

  const totalRevenue = sales.reduce((s, sale) => s + sale.salePrice, 0);
  const totalProfit = sales.reduce((s, sale) => s + sale.profit, 0);

  const monthlySales: Record<string, { revenue: number; count: number }> = {};
  sales.forEach((s) => {
    const key = new Date(s.soldAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!monthlySales[key]) monthlySales[key] = { revenue: 0, count: 0 };
    monthlySales[key].revenue += s.salePrice;
    monthlySales[key].count++;
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Sales</h1>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Record Sale
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <DollarSign className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-success mb-1" />
          <p className="text-xs text-muted-foreground">Total Profit</p>
          <p className="text-2xl font-bold text-success">${totalProfit.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <DollarSign className="h-6 w-6 mx-auto text-info mb-1" />
          <p className="text-xs text-muted-foreground">Total Sales</p>
          <p className="text-2xl font-bold">{sales.length}</p>
        </div>
      </div>

      {Object.keys(monthlySales).length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Monthly Summary</h2>
          <div className="space-y-2">
            {Object.entries(monthlySales).map(([month, data]) => (
              <div key={month} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium">{month}</span>
                <div className="flex gap-4 text-sm">
                  <span>{data.count} sales</span>
                  <span className="font-medium">${data.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No sales yet</p>
          <p className="text-muted-foreground text-sm mt-1">Record your first sale to start tracking revenue.</p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-semibold mb-3">Recent Sales</h2>
          <div className="space-y-2">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {s.cutting ? `${s.cutting.species}${s.cutting.variety ? ` — ${s.cutting.variety}` : ''}` : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.buyerName && `${s.buyerName} · `}
                    {new Date(s.soldAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${s.salePrice.toFixed(2)}</p>
                  <p className={`text-xs ${s.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {s.profit >= 0 ? '+' : ''}${s.profit.toFixed(2)} profit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Record Sale</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cutting *</label>
                <select value={form.cuttingId} onChange={(e) => setForm({ ...form, cuttingId: e.target.value })} className="input" required>
                  <option value="">Select a cutting...</option>
                  {cuttings.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.uniqueCode} — {c.species}{c.variety ? ` (${c.variety})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sale Price *</label>
                <input type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Buyer Name</label>
                <input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input min-h-[60px]" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Record Sale'}
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
