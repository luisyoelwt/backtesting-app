import { useEffect, useMemo, useState } from "react";
import { Card, Col, Empty, Row, Statistic, Typography, message } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "../lib/supabase";
import type { ModelRow, TradeRow } from "../lib/database.types";

const { Title, Text } = Typography;

const PIE_COLORS = ["#22c55e", "#38bdf8", "#fbbf24"];

export function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [tradesRes, modelsRes] = await Promise.all([
        supabase.from("trades").select("*").order("created_at", { ascending: false }),
        supabase.from("models").select("*").order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (tradesRes.error) {
        message.error(tradesRes.error.message);
      } else {
        setTrades(tradesRes.data ?? []);
      }

      if (modelsRes.error) {
        message.error(modelsRes.error.message);
      } else {
        setModels(modelsRes.data ?? []);
      }

      setLoading(false);
    };

    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const executedTrades = useMemo(
    () =>
      trades.filter(
        (trade) =>
          (trade.trade_status ?? (trade.no_trade_day ? "cancelled" : "closed")) !== "cancelled"
      ),
    [trades]
  );
  const cancelledTrades = useMemo(
    () =>
      trades.filter(
        (trade) =>
          (trade.trade_status ?? (trade.no_trade_day ? "cancelled" : "closed")) === "cancelled"
      ),
    [trades]
  );
  const manualCloseTrades = useMemo(
    () => trades.filter((trade) => trade.trade_status === "manual_close"),
    [trades]
  );
  const winners = useMemo(
    () => executedTrades.filter((b) => (b.net_pnl ?? 0) > 0),
    [executedTrades]
  );
  const losers = useMemo(
    () => executedTrades.filter((b) => (b.net_pnl ?? 0) < 0),
    [executedTrades]
  );

  const totalNetPnl = useMemo(
    () => executedTrades.reduce((acc, trade) => acc + (trade.net_pnl ?? 0), 0),
    [executedTrades]
  );

  const avgReturn = useMemo(() => {
    if (!executedTrades.length) return 0;
    const values = executedTrades.map((b) => b.total_return ?? 0);
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  }, [executedTrades]);

  const winRate = useMemo(() => {
    if (!executedTrades.length) return 0;
    return (winners.length / executedTrades.length) * 100;
  }, [executedTrades.length, winners.length]);

  const avgDurationHours = useMemo(() => {
    if (!executedTrades.length) return 0;
    const totalMinutes = executedTrades.reduce((acc, trade) => {
      return (
        acc +
        Math.max(0, new Date(trade.end_date).getTime() - new Date(trade.start_date).getTime()) /
          60000
      );
    }, 0);
    return totalMinutes / executedTrades.length / 60;
  }, [executedTrades]);

  const avgWinLossRatio = useMemo(() => {
    if (!winners.length || !losers.length) return 0;
    const avgWin = winners.reduce((acc, trade) => acc + (trade.net_pnl ?? 0), 0) / winners.length;
    const avgLoss =
      losers.reduce((acc, trade) => acc + Math.abs(trade.net_pnl ?? 0), 0) / losers.length;
    return avgLoss === 0 ? 0 : avgWin / avgLoss;
  }, [losers, winners]);

  const bestTrade = useMemo(
    () => winners.reduce((max, trade) => Math.max(max, trade.net_pnl ?? 0), 0),
    [winners]
  );

  const worstTrade = useMemo(
    () => losers.reduce((min, trade) => Math.min(min, trade.net_pnl ?? 0), 0),
    [losers]
  );

  const modelNameById = useMemo(() => new Map(models.map((m) => [m.id, m.name])), [models]);

  const pnlByModel = useMemo(() => {
    const accumulator = new Map<string, { total: number; count: number }>();

    for (const trade of executedTrades) {
      const modelName = trade.model_id
        ? (modelNameById.get(trade.model_id) ?? "Sin modelo")
        : "Sin modelo";
      if (!accumulator.has(modelName)) {
        accumulator.set(modelName, { total: 0, count: 0 });
      }
      const item = accumulator.get(modelName)!;
      item.total += trade.net_pnl ?? 0;
      item.count += 1;
    }

    return Array.from(accumulator.entries())
      .map(([model, value]) => ({
        model,
        netPnl: Number(value.total.toFixed(2)),
      }))
      .sort((a, b) => b.netPnl - a.netPnl)
      .slice(0, 10);
  }, [executedTrades, modelNameById]);

  const statusPie = useMemo(
    () => [
      { name: "Cerrados", value: executedTrades.length - manualCloseTrades.length },
      { name: "Cierre manual", value: manualCloseTrades.length },
      { name: "Cancelados", value: cancelledTrades.length },
    ],
    [cancelledTrades.length, executedTrades.length, manualCloseTrades.length]
  );

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white px-4 md:px-6 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Title level={2} style={{ color: "#f5f8ff", margin: 0 }}>
            Análisis
          </Title>
          <Text style={{ color: "#8b98b1" }}>
            Contabilidad operativa: rentabilidad neta, tasa de acierto, duración y desempeño por
            modelo.
          </Text>
        </div>

        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Total registros" value={trades.length} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Trades ejecutados" value={executedTrades.length} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Cancelados" value={cancelledTrades.length} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Modelos activos" value={models.length} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card loading={loading}>
              <Statistic
                title="PnL Neto Total"
                value={totalNetPnl}
                precision={2}
                prefix="$"
                valueStyle={{ color: totalNetPnl >= 0 ? "#22c55e" : "#ef4444" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card loading={loading}>
              <Statistic
                title="Win Rate"
                value={winRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: "#38bdf8" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={loading}>
              <Statistic title="Rentabilidad Promedio" value={avgReturn} precision={2} suffix="%" />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={loading}>
              <Statistic
                title="Duración Promedio"
                value={avgDurationHours}
                precision={2}
                suffix="h"
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card loading={loading}>
              <Statistic title="Ratio Promedio W/L" value={avgWinLossRatio} precision={2} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card loading={loading}>
              <Statistic
                title="Mejor Trade"
                value={bestTrade}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#22c55e" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card loading={loading}>
              <Statistic
                title="Peor Trade"
                value={worstTrade}
                precision={2}
                prefix="$"
                valueStyle={{ color: "#ef4444" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} lg={16}>
            <Card title="PnL neto por modelo" loading={loading}>
              {pnlByModel.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Aún no hay trades ejecutados"
                />
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={pnlByModel} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b3448" />
                      <XAxis dataKey="model" stroke="#9fb0cc" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9fb0cc" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="netPnl" name="PnL Neto" fill="#34d399" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Distribución por estado" loading={loading}>
              {trades.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin registros" />
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={110} label>
                        {statusPie.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
