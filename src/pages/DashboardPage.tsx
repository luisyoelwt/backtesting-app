import { useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { BacktestRow } from "../lib/database.types";
import { MetricBadge } from "../components/MetricBadge";

export function DashboardPage() {
  const [backtests, setBacktests] = useState<BacktestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");

  useEffect(() => {
    const loadBacktests = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("backtests")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setBacktests(data);
      setLoading(false);
    };

    loadBacktests();
  }, []);

  const assets = useMemo(() => {
    const unique = new Set(backtests.map((b) => b.asset));
    return ["all", ...Array.from(unique)];
  }, [backtests]);

  const filtered = useMemo(() => {
    return backtests.filter((b) => {
      const matchesQuery =
        b.asset.toLowerCase().includes(query.toLowerCase()) ||
        b.strategy_name.toLowerCase().includes(query.toLowerCase());

      const matchesAsset = assetFilter === "all" || b.asset === assetFilter;

      return matchesQuery && matchesAsset;
    });
  }, [backtests, query, assetFilter]);

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Registro de Backtests</h1>
          <p className="text-white/40 mt-1">
            Guarda, filtra y revisa tus resultados por estrategia.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por activo o estrategia..."
              className="w-full bg-white/4 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="md:col-span-4 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <select
              value={assetFilter}
              onChange={(e) => setAssetFilter(e.target.value)}
              className="w-full appearance-none bg-white/4 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              {assets.map((asset) => (
                <option key={asset} value={asset} className="bg-[#111318]">
                  {asset === "all" ? "Todos los activos" : asset}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#111318] border border-white/8 rounded-2xl p-10 text-center text-white/40">
            Cargando backtests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#111318] border border-white/8 rounded-2xl p-10 text-center">
            <p className="text-white/60 mb-2">No hay registros aún.</p>
            <p className="text-white/30 text-sm">Crea tu primer backtest desde el botón "Nuevo".</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-[#111318] border border-white/8 rounded-2xl">
            <table className="w-full min-w-225 text-sm">
              <thead className="border-b border-white/8 text-white/40 text-xs uppercase tracking-widest">
                <tr>
                  <th className="text-left p-4">Activo</th>
                  <th className="text-left p-4">Estrategia</th>
                  <th className="text-left p-4">Timeframe</th>
                  <th className="text-right p-4">Return</th>
                  <th className="text-right p-4">Drawdown</th>
                  <th className="text-right p-4">Win Rate</th>
                  <th className="text-right p-4">Trades</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-white/5 last:border-b-0 hover:bg-white/2"
                  >
                    <td className="p-4 font-medium">{b.asset}</td>
                    <td className="p-4 text-white/75">{b.strategy_name}</td>
                    <td className="p-4 text-white/60">{b.timeframe}</td>
                    <td className="p-4 text-right">
                      <MetricBadge value={b.total_return} suffix="%" positive="high" />
                    </td>
                    <td className="p-4 text-right">
                      <MetricBadge value={b.max_drawdown} suffix="%" positive="low" />
                    </td>
                    <td className="p-4 text-right">
                      <MetricBadge value={b.win_rate} suffix="%" positive="high" />
                    </td>
                    <td className="p-4 text-right font-mono text-white/70">
                      {b.total_trades ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
