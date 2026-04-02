import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

interface FormData {
  asset: string;
  strategy_name: string;
  strategy_description: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: string;
  total_return: string;
  max_drawdown: string;
  win_rate: string;
  profit_factor: string;
  total_trades: string;
  sharpe_ratio: string;
  tags: string;
  notes: string;
}

const initialData: FormData = {
  asset: "",
  strategy_name: "",
  strategy_description: "",
  timeframe: "1D",
  start_date: "",
  end_date: "",
  initial_capital: "",
  total_return: "",
  max_drawdown: "",
  win_rate: "",
  profit_factor: "",
  total_trades: "",
  sharpe_ratio: "",
  tags: "",
  notes: "",
};

export function NewBacktestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toNullableNumber = (v: string) => (v.trim() === "" ? null : Number(v));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay sesión activa. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    const payload = {
      user_id: user.id,
      asset: form.asset.trim(),
      strategy_name: form.strategy_name.trim(),
      strategy_description: form.strategy_description.trim() || null,
      timeframe: form.timeframe,
      start_date: form.start_date,
      end_date: form.end_date,
      initial_capital: Number(form.initial_capital),
      total_return: toNullableNumber(form.total_return),
      max_drawdown: toNullableNumber(form.max_drawdown),
      win_rate: toNullableNumber(form.win_rate),
      profit_factor: toNullableNumber(form.profit_factor),
      total_trades: form.total_trades.trim() === "" ? null : Number(form.total_trades),
      sharpe_ratio: toNullableNumber(form.sharpe_ratio),
      notes: form.notes.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const { error } = await supabase.from("backtests").insert(payload);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white">
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Nuevo Backtest</h1>
        <p className="text-white/40 mb-8">
          Guarda un registro completo de una ejecución de estrategia.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-[#111318] border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Información base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Activo" required>
                <input
                  value={form.asset}
                  onChange={(e) => update("asset", e.target.value)}
                  required
                  placeholder="Ej: BTC/USDT"
                  className="input"
                />
              </Field>
              <Field label="Timeframe" required>
                <select
                  value={form.timeframe}
                  onChange={(e) => update("timeframe", e.target.value)}
                  className="input"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1H">1H</option>
                  <option value="4H">4H</option>
                  <option value="1D">1D</option>
                  <option value="1W">1W</option>
                </select>
              </Field>
              <Field label="Estrategia" required>
                <input
                  value={form.strategy_name}
                  onChange={(e) => update("strategy_name", e.target.value)}
                  required
                  placeholder="Ej: EMA Crossover"
                  className="input"
                />
              </Field>
              <Field label="Capital inicial" required>
                <input
                  type="number"
                  step="0.01"
                  value={form.initial_capital}
                  onChange={(e) => update("initial_capital", e.target.value)}
                  required
                  placeholder="10000"
                  className="input"
                />
              </Field>
              <Field label="Fecha inicio" required>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => update("start_date", e.target.value)}
                  required
                  className="input"
                />
              </Field>
              <Field label="Fecha fin" required>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => update("end_date", e.target.value)}
                  required
                  className="input"
                />
              </Field>
            </div>

            <Field label="Descripción estrategia" className="mt-4">
              <textarea
                value={form.strategy_description}
                onChange={(e) => update("strategy_description", e.target.value)}
                rows={3}
                placeholder="Reglas de entrada/salida"
                className="input resize-none"
              />
            </Field>
          </section>

          <section className="bg-[#111318] border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Métricas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Total Return %">
                <input
                  type="number"
                  step="0.01"
                  value={form.total_return}
                  onChange={(e) => update("total_return", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Max Drawdown %">
                <input
                  type="number"
                  step="0.01"
                  value={form.max_drawdown}
                  onChange={(e) => update("max_drawdown", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Win Rate %">
                <input
                  type="number"
                  step="0.01"
                  value={form.win_rate}
                  onChange={(e) => update("win_rate", e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Profit Factor">
                <input
                  type="number"
                  step="0.01"
                  value={form.profit_factor}
                  onChange={(e) => update("profit_factor", e.target.value)}
                  className="input"
                />
              </Field>

              <Field label="Sharpe Ratio">
                <input
                  type="number"
                  step="0.01"
                  value={form.sharpe_ratio}
                  onChange={(e) => update("sharpe_ratio", e.target.value)}
                  className="input"
                />
              </Field>
            </div>
          </section>

          <section className="bg-[#111318] border border-white/8 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Notas</h2>
            <div className="space-y-4">
              <Field label="Tags (separados por coma)">
                <input
                  value={form.tags}
                  onChange={(e) => update("tags", e.target.value)}
                  placeholder="momentum, breakout, crypto"
                  className="input"
                />
              </Field>
              <Field label="Observaciones">
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Qué funcionó, qué no, mejoras futuras..."
                  className="input resize-none"
                />
              </Field>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? "Guardando..." : "Guardar Backtest"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="bg-white/5 hover:bg-white/10 text-white/70 font-medium px-5 py-3 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="block text-white/55 text-xs font-medium mb-2 uppercase tracking-widest">
        {label} {required ? "*" : ""}
      </span>
      {children}
    </label>
  );
}
