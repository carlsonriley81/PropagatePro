'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Download, DollarSign, BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Sale {
  salePrice: number;
  costBasis: number;
  profit: number;
  soldAt: string;
  cutting: { species: string } | null;
}

interface Cutting {
  species: string;
  rootingStatus: string;
  costPerCutting: number;
}

interface Supply {
  totalCost: number;
  category: string;
}

export default function BusinessPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [cuttings, setCuttings] = useState<Cutting[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, cRes, supRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/cuttings'),
        fetch('/api/supplies'),
      ]);
      if (sRes.ok) setSales((await sRes.json()).sales);
      if (cRes.ok) setCuttings((await cRes.json()).cuttings);
      if (supRes.ok) setSupplies((await supRes.json()).supplies);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = sales.reduce((s, sale) => s + sale.salePrice, 0);
  const totalProfit = sales.reduce((s, sale) => s + sale.profit, 0);
  const totalSupplyCost = supplies.reduce((s, sup) => s + sup.totalCost, 0);

  const speciesStats: Record<string, { sales: number; revenue: number; profit: number; total: number; rooted: number }> = {};
  cuttings.forEach((c) => {
    if (!speciesStats[c.species]) speciesStats[c.species] = { sales: 0, revenue: 0, profit: 0, total: 0, rooted: 0 };
    speciesStats[c.species].total++;
    if (['rooted', 'transplanted', 'sold'].includes(c.rootingStatus)) speciesStats[c.species].rooted++;
  });
  sales.forEach((s) => {
    const sp = s.cutting?.species || 'Unknown';
    if (!speciesStats[sp]) speciesStats[sp] = { sales: 0, revenue: 0, profit: 0, total: 0, rooted: 0 };
    speciesStats[sp].sales++;
    speciesStats[sp].revenue += s.salePrice;
    speciesStats[sp].profit += s.profit;
  });

  const chartData = Object.entries(speciesStats).map(([species, stats]) => ({
    species: species.length > 15 ? species.slice(0, 15) + '…' : species,
    successRate: stats.total > 0 ? Math.round((stats.rooted / stats.total) * 100) : 0,
    revenue: Math.round(stats.revenue * 100) / 100,
  }));

  function exportCSV() {
    const rows = [['Date', 'Species', 'Sale Price', 'Cost', 'Profit', 'Buyer']];
    sales.forEach((s) => {
      rows.push([
        new Date(s.soldAt).toLocaleDateString(),
        s.cutting?.species || '',
        s.salePrice.toFixed(2),
        s.costBasis.toFixed(2),
        s.profit.toFixed(2),
        '',
      ]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'propagatepro-sales.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Business</h1>
        <button onClick={exportCSV} className="btn btn-secondary">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <DollarSign className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-success mb-1" />
          <p className="text-xs text-muted-foreground">Profit</p>
          <p className="text-xl font-bold text-success">${totalProfit.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <BarChart3 className="h-6 w-6 mx-auto text-warning mb-1" />
          <p className="text-xs text-muted-foreground">Supply Costs</p>
          <p className="text-xl font-bold">${totalSupplyCost.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-info mb-1" />
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`text-xl font-bold ${totalProfit - totalSupplyCost >= 0 ? 'text-success' : 'text-danger'}`}>
            ${(totalProfit - totalSupplyCost).toFixed(2)}
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Success Rate by Species</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="species" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="successRate" name="Success %" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Profit by Species</h2>
        {Object.keys(speciesStats).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No data yet.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(speciesStats).map(([species, stats]) => (
              <div key={species} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{species}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.total} cuttings · {stats.sales} sold · {stats.total > 0 ? Math.round((stats.rooted / stats.total) * 100) : 0}% success
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${stats.revenue.toFixed(2)}</p>
                  <p className={`text-xs ${stats.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {stats.profit >= 0 ? '+' : ''}${stats.profit.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
