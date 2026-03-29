'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Zap, Plus, X, Loader2, Power, Wifi, WifiOff, Lightbulb, Droplets,
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  deviceType: string;
  brand: string | null;
  zone: string | null;
  status: string;
  isOn: boolean;
  lastCommand: string | null;
  _count: { lightSchedules: number; waterSchedules: number };
}

interface LightSchedule {
  id: string;
  zone: string | null;
  onTime: string;
  offTime: string;
  isActive: boolean;
  mode: string;
  device: { id: string; name: string; zone: string | null };
}

interface WaterSchedule {
  id: string;
  zone: string | null;
  intervalDays: number;
  nextWatering: string | null;
  isActive: boolean;
  mode: string;
  device: { id: string; name: string; zone: string | null };
}

export default function AutomationPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [lightSchedules, setLightSchedules] = useState<LightSchedule[]>([]);
  const [waterSchedules, setWaterSchedules] = useState<WaterSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [showLightForm, setShowLightForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [mode, setMode] = useState<'manual' | 'scheduled' | 'smart'>('scheduled');

  const [deviceForm, setDeviceForm] = useState({ name: '', deviceType: 'light', brand: '', zone: '' });
  const [lightForm, setLightForm] = useState({ deviceId: '', onTime: '06:00', offTime: '20:00' });
  const [waterForm, setWaterForm] = useState({ deviceId: '', intervalDays: '3' });

  const fetchData = useCallback(async () => {
    try {
      const [dRes, sRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/automation/schedules'),
      ]);
      if (dRes.ok) setDevices((await dRes.json()).devices);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setLightSchedules(sJson.lightSchedules);
        setWaterSchedules(sJson.waterSchedules);
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

  async function toggleDevice(device: Device) {
    try {
      const res = await fetch(`/api/devices/${device.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOn: !device.isOn, status: 'online' }),
      });
      if (res.ok) {
        setToast({ msg: `${device.name} turned ${device.isOn ? 'off' : 'on'}`, type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed to toggle device', type: 'error' });
    }
  }

  async function addDevice(e: FormEvent) {
    e.preventDefault();
    if (!deviceForm.name || !deviceForm.deviceType) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceForm),
      });
      if (res.ok) {
        setShowDeviceForm(false);
        setDeviceForm({ name: '', deviceType: 'light', brand: '', zone: '' });
        setToast({ msg: 'Device added', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed to add device', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function addLightSchedule(e: FormEvent) {
    e.preventDefault();
    if (!lightForm.deviceId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/automation/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'light',
          deviceId: lightForm.deviceId,
          onTime: lightForm.onTime,
          offTime: lightForm.offTime,
          mode,
        }),
      });
      if (res.ok) {
        setShowLightForm(false);
        setToast({ msg: 'Light schedule created', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function addWaterSchedule(e: FormEvent) {
    e.preventDefault();
    if (!waterForm.deviceId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/automation/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'water',
          deviceId: waterForm.deviceId,
          intervalDays: parseInt(waterForm.intervalDays) || 3,
          mode,
        }),
      });
      if (res.ok) {
        setShowWaterForm(false);
        setToast({ msg: 'Water schedule created', type: 'success' });
        fetchData();
      }
    } catch {
      setToast({ msg: 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Automation</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mode:</span>
          {(['manual', 'scheduled', 'smart'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`btn text-sm py-1.5 px-3 capitalize ${mode === m ? 'btn-primary' : 'btn-ghost'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5" /> Devices
          </h2>
          <button onClick={() => setShowDeviceForm(true)} className="btn btn-secondary text-sm">
            <Plus className="h-4 w-4" /> Add Device
          </button>
        </div>

        {devices.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No devices added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {devices.map((d) => (
              <div key={d.id} className="p-3 rounded-lg bg-muted flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {d.status === 'online' ? (
                    <Wifi className="h-4 w-4 text-success" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.deviceType}{d.zone ? ` · ${d.zone}` : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleDevice(d)}
                  className={`p-2 rounded-lg ${d.isOn ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
                  title={d.isOn ? 'Turn off' : 'Turn on'}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5" /> Light Schedules
            </h2>
            <button onClick={() => setShowLightForm(true)} className="btn btn-secondary text-sm">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {lightSchedules.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No light schedules.</p>
          ) : (
            <div className="space-y-2">
              {lightSchedules.map((ls) => (
                <div key={ls.id} className="p-3 rounded-lg bg-muted flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{ls.device.name}</p>
                    <p className="text-xs text-muted-foreground">{ls.onTime} → {ls.offTime} · {ls.mode}</p>
                  </div>
                  <span className={`badge ${ls.isActive ? 'badge-healthy' : 'badge-delayed'}`}>
                    {ls.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Droplets className="h-5 w-5" /> Water Schedules
            </h2>
            <button onClick={() => setShowWaterForm(true)} className="btn btn-secondary text-sm">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {waterSchedules.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No water schedules.</p>
          ) : (
            <div className="space-y-2">
              {waterSchedules.map((ws) => (
                <div key={ws.id} className="p-3 rounded-lg bg-muted flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{ws.device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Every {ws.intervalDays}d · {ws.mode}
                      {ws.nextWatering && ` · Next: ${new Date(ws.nextWatering).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`badge ${ws.isActive ? 'badge-healthy' : 'badge-delayed'}`}>
                    {ws.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDeviceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Device</h2>
              <button onClick={() => setShowDeviceForm(false)} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select value={deviceForm.deviceType} onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })} className="input">
                    <option value="light">Light</option>
                    <option value="pump">Pump</option>
                    <option value="fan">Fan</option>
                    <option value="heater">Heater</option>
                    <option value="sensor">Sensor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Zone</label>
                  <input value={deviceForm.zone} onChange={(e) => setDeviceForm({ ...deviceForm, zone: e.target.value })} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input value={deviceForm.brand} onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowDeviceForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLightForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Light Schedule</h2>
              <button onClick={() => setShowLightForm(false)} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addLightSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device *</label>
                <select value={lightForm.deviceId} onChange={(e) => setLightForm({ ...lightForm, deviceId: e.target.value })} className="input" required>
                  <option value="">Select device...</option>
                  {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">On Time</label>
                  <input type="time" value={lightForm.onTime} onChange={(e) => setLightForm({ ...lightForm, onTime: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Off Time</label>
                  <input type="time" value={lightForm.offTime} onChange={(e) => setLightForm({ ...lightForm, offTime: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowLightForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWaterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Add Water Schedule</h2>
              <button onClick={() => setShowWaterForm(false)} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={addWaterSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Device *</label>
                <select value={waterForm.deviceId} onChange={(e) => setWaterForm({ ...waterForm, deviceId: e.target.value })} className="input" required>
                  <option value="">Select device...</option>
                  {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Interval (days)</label>
                <input type="number" min="1" value={waterForm.intervalDays} onChange={(e) => setWaterForm({ ...waterForm, intervalDays: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowWaterForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Schedule'}
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
