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
import type { BacktestRow, ModelRow } from "../lib/database.types";

const { Title, Text } = Typography;

const PIE_COLORS = ["#22c55e", "#fbbf24"];

export function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [backtests, setBacktests] = useState<BacktestRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const [backtestsRes, modelsRes] = await Promise.all([
        supabase.from("backtests").select("*").order("created_at", { ascending: false }),
        supabase.from("models").select("*").order("created_at", { ascending: false }),
      ]);

      if (!mounted) return;

      if (backtestsRes.error) {
        message.error(backtestsRes.error.message);
      } else {
        setBacktests(backtestsRes.data ?? []);
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

  const operated = useMemo(() => backtests.filter((b) => !b.no_trade_day), [backtests]);
  const noTrade = useMemo(() => backtests.filter((b) => b.no_trade_day), [backtests]);

  const avgReturn = useMemo(() => {
    if (!operated.length) return 0;
    const values = operated.map((b) => b.total_return ?? 0);
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  }, [operated]);

  const avgWinRate = useMemo(() => {
    const valid = operated.filter((b) => b.win_rate !== null);
    if (!valid.length) return 0;
    return valid.reduce((acc, b) => acc + (b.win_rate ?? 0), 0) / valid.length;
  }, [operated]);

  const modelNameById = useMemo(
    () => new Map(models.map((m) => [m.id, m.name])),
    [models],
  );

  const returnsByModel = useMemo(() => {
    const accumulator = new Map<string, { total: number; count: number }>();

    for (const bt of operated) {
      const modelName = bt.model_id ? modelNameById.get(bt.model_id) ?? "Sin modelo" : "Sin modelo";
      if (!accumulator.has(modelName)) {
        accumulator.set(modelName, { total: 0, count: 0 });
      }
      const item = accumulator.get(modelName)!;
      item.total += bt.total_return ?? 0;
      item.count += 1;
    }

    return Array.from(accumulator.entries())
      .map(([model, value]) => ({
        model,
        avgReturn: value.count ? Number((value.total / value.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.avgReturn - a.avgReturn)
      .slice(0, 10);
  }, [modelNameById, operated]);

  const operationalPie = useMemo(
    () => [
      { name: "Operados", value: operated.length },
      { name: "Sin operativa", value: noTrade.length },
    ],
    [noTrade.length, operated.length],
  );

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white px-4 md:px-6 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Title level={2} style={{ color: "#f5f8ff", margin: 0 }}>
            Análisis
          </Title>
          <Text style={{ color: "#8b98b1" }}>
            Resumen cuantitativo de rendimiento, calidad operativa y modelos.
          </Text>
        </div>

        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Total registros" value={backtests.length} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Días operados" value={operated.length} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card loading={loading}>
              <Statistic title="Días sin operativa" value={noTrade.length} />
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
                title="Promedio Total Return"
                value={avgReturn}
                precision={2}
                suffix="%"
                valueStyle={{ color: avgReturn >= 0 ? "#22c55e" : "#ef4444" }}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card loading={loading}>
              <Statistic
                title="Promedio Win Rate"
                value={avgWinRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: "#38bdf8" }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]}>
          <Col xs={24} lg={16}>
            <Card title="Top modelos por retorno promedio" loading={loading}>
              {returnsByModel.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aún no hay datos operados" />
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={returnsByModel} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2b3448" />
                      <XAxis dataKey="model" stroke="#9fb0cc" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9fb0cc" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgReturn" name="Avg Return %" fill="#34d399" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Distribución operativa" loading={loading}>
              {backtests.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sin registros" />
              ) : (
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={operationalPie} dataKey="value" nameKey="name" outerRadius={110} label>
                        {operationalPie.map((_, idx) => (
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
