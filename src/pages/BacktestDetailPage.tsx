import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Descriptions, Space, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import type { BacktestRow } from "../lib/database.types";

const { Title, Text } = Typography;

export function BacktestDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BacktestRow | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [modelDescription, setModelDescription] = useState<string | null>(null);

  useEffect(() => {
    const loadById = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase.from("backtests").select("*").eq("id", id).single();

      if (error) {
        message.error(error.message);
      } else {
        setData(data);

        if (data?.model_id) {
          const { data: modelData } = await supabase
            .from("models")
            .select("name, description")
            .eq("id", data.model_id)
            .maybeSingle();

          setModelName(modelData?.name ?? null);
          setModelDescription(modelData?.description ?? null);
        } else {
          setModelName(null);
          setModelDescription(null);
        }
      }
      setLoading(false);
    };

    loadById();
  }, [id]);

  const equityImages = data
    ? data.equity_curve_urls?.length
      ? data.equity_curve_urls.slice(0, 3)
      : data.equity_curve_url
        ? [data.equity_curve_url]
        : []
    : [];

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white px-4 md:px-6 pt-20 pb-10">
      <div className="max-w-5xl mx-auto">
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/dashboard")}>
            Volver
          </Button>

          <Card loading={loading}>
            {data ? (
              <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                <div>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    {data.asset} - {data.strategy_name}
                  </Title>
                  <Text type="secondary">Detalle completo del backtest</Text>
                </div>

                <Card size="small" title="Contexto Operativo">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Activo">{data.asset}</Descriptions.Item>
                    <Descriptions.Item label="Timeframe">{data.timeframe}</Descriptions.Item>
                    <Descriptions.Item label="Modelo">{modelName || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Estado operativo">
                      {data.no_trade_day ? "Sin operativa" : "Operado"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Motivo sin operativa" span={2}>
                      {data.no_trade_reason || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Inicio">
                      {dayjs(data.start_date).format("YYYY-MM-DD HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Fin">
                      {dayjs(data.end_date).format("YYYY-MM-DD HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Capital inicial">
                      {Number(data.initial_capital).toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tags">
                      {data.tags?.length ? data.tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Metricas">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Total Return %">
                      {data.total_return == null ? "-" : data.total_return.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Max Drawdown %">
                      {data.max_drawdown == null ? "-" : data.max_drawdown.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Win Rate %">
                      {data.win_rate == null ? "-" : data.win_rate.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Profit Factor">
                      {data.profit_factor == null ? "-" : data.profit_factor.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sharpe Ratio">
                      {data.sharpe_ratio == null ? "-" : data.sharpe_ratio.toFixed(2)}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Notas y Modelo">
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Descripcion del modelo">
                      {modelDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: modelDescription }} />
                      ) : (
                        "-"
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Notas">{data.notes || "-"}</Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Equity Curve">
                  {equityImages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {equityImages.map((imageUrl, index) => (
                        <a href={imageUrl} target="_blank" rel="noreferrer" key={imageUrl + index}>
                          <img
                            src={imageUrl}
                            alt={`Equity curve ${index + 1}`}
                            style={{
                              width: "100%",
                              maxHeight: 360,
                              objectFit: "contain",
                              borderRadius: 8,
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary">Sin imagen cargada</Text>
                  )}
                </Card>
              </Space>
            ) : null}
          </Card>
        </Space>
      </div>
    </div>
  );
}
