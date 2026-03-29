'use client';

import { useState, useEffect, useCallback, useSyncExternalStore, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Settings as SettingsIcon, Sun, Moon, User, Save, Loader2, Plus,
} from 'lucide-react';

interface RootingRule {
  id: string | null;
  species: string;
  method: string;
  minDays: number;
  maxDays: number;
  isCustom: boolean;
}

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

export default function SettingsPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState<RootingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const dark = useSyncExternalStore(subscribeDark, getDarkSnapshot, getDarkServerSnapshot);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    species: '', propagationMethod: 'water', minDays: '7', maxDays: '21',
  });

  const [editingRule, setEditingRule] = useState<{ species: string; method: string; minDays: string; maxDays: string } | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/rooting-rules');
      if (res.ok) setRules((await res.json()).rules);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function toggleDark() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  async function saveRule(e: FormEvent) {
    e.preventDefault();
    if (!ruleForm.species || !ruleForm.propagationMethod) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/rooting-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: ruleForm.species,
          propagationMethod: ruleForm.propagationMethod,
          minDays: parseInt(ruleForm.minDays) || 7,
          maxDays: parseInt(ruleForm.maxDays) || 21,
        }),
      });
      if (res.ok) {
        setShowRuleForm(false);
        setRuleForm({ species: '', propagationMethod: 'water', minDays: '7', maxDays: '21' });
        setToast({ msg: 'Rule saved', type: 'success' });
        fetchRules();
      }
    } catch {
      setToast({ msg: 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function updateRule() {
    if (!editingRule) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/rooting-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          species: editingRule.species,
          propagationMethod: editingRule.method,
          minDays: parseInt(editingRule.minDays) || 7,
          maxDays: parseInt(editingRule.maxDays) || 21,
        }),
      });
      if (res.ok) {
        setEditingRule(null);
        setToast({ msg: 'Rule updated', type: 'success' });
        fetchRules();
      }
    } catch {
      setToast({ msg: 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" /> Settings
      </h1>

      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <User className="h-5 w-5" /> Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Name</label>
            <p className="text-sm font-medium">{user?.name}</p>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Email</label>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Role</label>
            <p className="text-sm font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Theme</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDark}
            className={`btn ${!dark ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
          <button
            onClick={toggleDark}
            className={`btn ${dark ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Rooting Rules</h2>
          <button onClick={() => setShowRuleForm(true)} className="btn btn-secondary text-sm">
            <Plus className="h-4 w-4" /> Add Species
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><div className="spinner" /></div>
        ) : (
          <div className="space-y-2">
            {rules.map((r, i) => {
              const isEditing = editingRule && editingRule.species === r.species && editingRule.method === r.method;
              return (
                <div key={`${r.species}-${r.method}-${i}`} className="p-3 rounded-lg bg-muted">
                  {isEditing ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">{r.species} ({r.method})</label>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Min Days</label>
                        <input
                          type="number"
                          min="1"
                          value={editingRule.minDays}
                          onChange={(e) => setEditingRule({ ...editingRule, minDays: e.target.value })}
                          className="input max-w-[80px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Max Days</label>
                        <input
                          type="number"
                          min="1"
                          value={editingRule.maxDays}
                          onChange={(e) => setEditingRule({ ...editingRule, maxDays: e.target.value })}
                          className="input max-w-[80px]"
                        />
                      </div>
                      <button onClick={updateRule} disabled={submitting} className="btn btn-primary text-sm py-1.5">
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </button>
                      <button onClick={() => setEditingRule(null)} className="btn btn-ghost text-sm py-1.5">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {r.species} <span className="text-muted-foreground">({r.method})</span>
                          {r.isCustom && <span className="badge badge-info ml-2 text-[10px]">Custom</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{r.minDays}–{r.maxDays} days</p>
                      </div>
                      <button
                        onClick={() => setEditingRule({
                          species: r.species,
                          method: r.method,
                          minDays: String(r.minDays),
                          maxDays: String(r.maxDays),
                        })}
                        className="btn btn-ghost text-sm py-1.5"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showRuleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Add Custom Species Rule</h2>
            <form onSubmit={saveRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Species *</label>
                <input value={ruleForm.species} onChange={(e) => setRuleForm({ ...ruleForm, species: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Propagation Method</label>
                <select value={ruleForm.propagationMethod} onChange={(e) => setRuleForm({ ...ruleForm, propagationMethod: e.target.value })} className="input">
                  <option value="water">Water</option>
                  <option value="soil">Soil</option>
                  <option value="perlite">Perlite</option>
                  <option value="sphagnum">Sphagnum</option>
                  <option value="leca">LECA</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Days</label>
                  <input type="number" min="1" value={ruleForm.minDays} onChange={(e) => setRuleForm({ ...ruleForm, minDays: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Days</label>
                  <input type="number" min="1" value={ruleForm.maxDays} onChange={(e) => setRuleForm({ ...ruleForm, maxDays: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowRuleForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Rule'}
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
