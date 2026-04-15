import { Button, Descriptions, Image, Modal, Popconfirm, Space } from "antd";
import dayjs from "dayjs";
import type { ModelRow, TradeRow } from "../lib/database.types";

interface TradeDetailsModalProps {
  open: boolean;
  trade: TradeRow | null;
  models: ModelRow[];
  onClose: () => void;
  onEdit: (row: TradeRow) => void;
  onDelete: (row: TradeRow) => void;
}

function getTradeStatusLabel(trade: TradeRow): string {
  if (trade.trade_status === "cancelled") return "Cancelado";
  if (trade.trade_status === "manual_close") return "Cierre manual";
  return "Cerrado";
}

export function TradeDetailsModal({
  open,
  trade,
  models,
  onClose,
  onEdit,
  onDelete,
}: TradeDetailsModalProps) {
  const modelNameById = new Map(models.map((model) => [model.id, model.name]));

  const selectedModelName = trade?.model_id
    ? (modelNameById.get(trade.model_id) ?? "Sin modelo")
    : "Sin modelo";

  const selectedDirection = trade?.direction === "short" ? "Short" : "Long";

  const selectedTradeImages = trade
    ? trade.equity_curve_urls?.length
      ? trade.equity_curve_urls.slice(0, 3)
      : trade.equity_curve_url
        ? [trade.equity_curve_url]
        : []
    : [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={trade ? `${trade.asset} - ${selectedDirection}` : "Detalle del trade"}
      width={860}
      footer={
        trade ? (
          <Space>
            <Button onClick={onClose}>Cerrar</Button>
            <Button type="default" onClick={() => onEdit(trade)}>
              Editar
            </Button>
            <Popconfirm
              title="Eliminar trade"
              description="Esta acción no se puede deshacer."
              okText="Eliminar"
              cancelText="Cancelar"
              onConfirm={() => {
                onDelete(trade);
                onClose();
              }}
            >
              <Button danger>Eliminar</Button>
            </Popconfirm>
          </Space>
        ) : null
      }
    >
      {trade ? (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Activo">{trade.asset}</Descriptions.Item>
            <Descriptions.Item label="Modelo">{selectedModelName}</Descriptions.Item>
            <Descriptions.Item label="Dirección">{selectedDirection}</Descriptions.Item>
            <Descriptions.Item label="Estado">{getTradeStatusLabel(trade)}</Descriptions.Item>
            <Descriptions.Item label="Apertura">
              {dayjs(trade.start_date).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Cierre">
              {dayjs(trade.end_date).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="PnL Bruto">
              {trade.gross_pnl == null ? "-" : `$${trade.gross_pnl.toFixed(2)}`}
            </Descriptions.Item>
            <Descriptions.Item label="Comisión">
              {trade.fee_amount == null ? "-" : `$${trade.fee_amount.toFixed(2)}`}
            </Descriptions.Item>
            <Descriptions.Item label="PnL Neto">
              {trade.net_pnl == null ? "-" : `$${trade.net_pnl.toFixed(2)}`}
            </Descriptions.Item>
            <Descriptions.Item label="Retorno %">
              {trade.total_return == null ? "-" : `${trade.total_return.toFixed(2)}%`}
            </Descriptions.Item>
            <Descriptions.Item label="Motivo de cierre" span={2}>
              {trade.close_reason ?? trade.no_trade_reason ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Notas" span={2}>
              {trade.notes ?? "-"}
            </Descriptions.Item>
          </Descriptions>

          {selectedTradeImages.length > 0 ? (
            <Image.PreviewGroup>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTradeImages.map((imageUrl, index) => (
                  <Image
                    key={imageUrl + index}
                    src={imageUrl}
                    alt={`Trade captura ${index + 1}`}
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      objectFit: "contain",
                      borderRadius: 8,
                    }}
                  />
                ))}
              </div>
            </Image.PreviewGroup>
          ) : null}
        </Space>
      ) : null}
    </Modal>
  );
}
