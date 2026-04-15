import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Descriptions, Image, Space, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import type { TradeRow } from "../lib/database.types";

const { Title, Text } = Typography;

export function TradeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TradeRow | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [modelDescription, setModelDescription] = useState<string | null>(null);

  useEffect(() => {
    const loadById = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase.from("trades").select("*").eq("id", id).single();

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

    void loadById();
  }, [id]);

  const tradeImages = data
    ? data.equity_curve_urls?.length
      ? data.equity_curve_urls.slice(0, 3)
      : data.equity_curve_url
        ? [data.equity_curve_url]
        : []
    : [];

  const statusLabel =
    data?.trade_status === "cancelled"
      ? "Cancelado"
      : data?.trade_status === "manual_close"
        ? "Cierre manual"
        : "Cerrado";

  const directionLabel = data?.direction === "short" ? "Short" : "Long";
  const durationHours =
    data && data.start_date && data.end_date
      ? dayjs(data.end_date).diff(dayjs(data.start_date), "minute") / 60
      : 0;

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white px-4 md:px-6 pt-20 pb-10">
      <div className="max-w-5xl mx-auto">
        <Space orientation="vertical" size={12} style={{ width: "100%" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/trades")}>
            Volver
          </Button>

          <Card loading={loading}>
            {data ? (
              <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                <div>
                  <Title level={3} style={{ marginBottom: 0 }}>
                    {data.asset} - {data.strategy_name}
                  </Title>
                  <Text type="secondary">Detalle completo del trade</Text>
                </div>

                <Card size="small" title="Contexto Operativo">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Activo">{data.asset}</Descriptions.Item>
                    <Descriptions.Item label="Timeframe">{data.timeframe}</Descriptions.Item>
                    <Descriptions.Item label="Modelo">{modelName || "-"}</Descriptions.Item>
                    <Descriptions.Item label="Dirección">{directionLabel}</Descriptions.Item>
                    <Descriptions.Item label="Estado">{statusLabel}</Descriptions.Item>
                    <Descriptions.Item label="Motivo / comentario de cierre" span={2}>
                      {data.close_reason || data.no_trade_reason || "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Apertura">
                      {dayjs(data.start_date).format("YYYY-MM-DD HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cierre">
                      {dayjs(data.end_date).format("YYYY-MM-DD HH:mm")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Duración">
                      {durationHours ? `${durationHours.toFixed(2)} h` : "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Capital asignado">
                      {Number(data.initial_capital).toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Comisión">
                      {data.fee_amount == null ? "-" : `$${Number(data.fee_amount).toFixed(2)}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tags">
                      {data.tags?.length ? data.tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : "-"}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Resultado del Trade">
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="PnL Bruto">
                      {data.gross_pnl == null ? "-" : `$${Number(data.gross_pnl).toFixed(2)}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="PnL Neto">
                      {data.net_pnl == null ? "-" : `$${Number(data.net_pnl).toFixed(2)}`}
                    </Descriptions.Item>
                    <Descriptions.Item label="Rentabilidad %">
                      {data.total_return == null ? "-" : data.total_return.toFixed(2)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trade ganador">
                      {data.net_pnl == null ? "-" : data.net_pnl > 0 ? "Sí" : "No"}
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

                <Card size="small" title="Capturas del Trade">
                  {tradeImages.length > 0 ? (
                    <Image.PreviewGroup>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tradeImages.map((imageUrl, index) => (
                          <Image
                            key={imageUrl + index}
                            src={imageUrl}
                            alt={`Trade capture ${index + 1}`}
                            style={{
                              width: "100%",
                              maxHeight: 360,
                              objectFit: "contain",
                              borderRadius: 8,
                            }}
                          />
                        ))}
                      </div>
                    </Image.PreviewGroup>
                  ) : (
                    <Text type="secondary">Sin capturas cargadas</Text>
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
