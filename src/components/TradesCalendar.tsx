import { Badge, Button, Calendar, Card, Modal } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import type { ModelRow, TradeRow } from "../lib/database.types";
import { useTradeDetailsModal } from "../hooks/useTradeDetailsModal";
import { TradeDetailsModal } from "./TradeDetailsModal";

interface TradesCalendarProps {
  data: TradeRow[];
  loading: boolean;
  models: ModelRow[];
  onCreateFromDate: (date: Dayjs) => void;
  onEdit: (row: TradeRow) => void;
  onDelete: (row: TradeRow) => void;
}

export function TradesCalendar({
  data,
  loading,
  models,
  onCreateFromDate,
  onEdit,
  onDelete,
}: TradesCalendarProps) {
  const { selectedTrade, isOpen, openTradeDetails, closeTradeDetails } = useTradeDetailsModal();
  const [overflowDateKey, setOverflowDateKey] = useState<string | null>(null);

  const modelNameById = useMemo(
    () => new Map(models.map((model) => [model.id, model.name])),
    [models]
  );

  const tradesByDate = useMemo(() => {
    const grouped = new Map<string, TradeRow[]>();

    for (const trade of data) {
      const key = dayjs(trade.start_date).format("YYYY-MM-DD");
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(trade);
    }

    for (const [, trades] of grouped) {
      trades.sort((a, b) => dayjs(a.start_date).valueOf() - dayjs(b.start_date).valueOf());
    }

    return grouped;
  }, [data]);

  const getNoticeStatus = (trade: TradeRow): "success" | "warning" | "error" | "processing" => {
    if (trade.trade_status === "cancelled") return "warning";
    if (trade.net_pnl == null) return "processing";
    return trade.net_pnl >= 0 ? "success" : "error";
  };

  const dailyPnL = useMemo(() => {
    const pnlByDate = new Map<string, number>();

    for (const [date, trades] of tradesByDate) {
      const total = trades.reduce((sum, trade) => sum + (trade.net_pnl ?? 0), 0);
      pnlByDate.set(date, total);
    }

    return pnlByDate;
  }, [tradesByDate]);

  const overflowDayTrades = overflowDateKey ? (tradesByDate.get(overflowDateKey) ?? []) : [];

  return (
    <div className="space-y-4">
      <Card
        loading={loading}
        style={{ background: "#111318", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Calendar
          className="trades-notice-calendar"
          fullscreen
          onSelect={(date) => onCreateFromDate(date)}
          cellRender={(date, info) => {
            if (info.type !== "date") return info.originNode;

            const dayTrades = tradesByDate.get(date.format("YYYY-MM-DD")) ?? [];
            const dayPnL = dailyPnL.get(date.format("YYYY-MM-DD")) ?? 0;

            if (!dayTrades.length) return null;

            const dayPnLText = `${dayPnL >= 0 ? "+" : ""}${dayPnL.toFixed(0)}`;
            const dayPnLColor = dayPnL >= 0 ? "#22c55e" : "#ef4444";
            const dayPnLBgColor =
              dayPnL >= 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";

            return (
              <div
                data-pnl-status={dayPnL >= 0 ? "positive" : "negative"}
                style={{
                  backgroundColor: dayPnLBgColor,
                  borderRadius: 4,
                  padding: 8,
                  borderLeft: `4px solid ${dayPnLColor}`,
                  height: "100%",
                }}
              >
                <ul className="events" style={{ margin: 0 }}>
                  <li
                    style={{
                      fontWeight: "bold",
                      color: dayPnLColor,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    {dayPnLText}
                  </li>
                  {dayTrades.slice(0, 2).map((trade) => {
                    const pnlText =
                      trade.net_pnl == null
                        ? ""
                        : ` ${trade.net_pnl >= 0 ? "+" : ""}${trade.net_pnl.toFixed(0)}`;
                    const modelName = trade.model_id ? modelNameById.get(trade.model_id) : null;

                    return (
                      <li key={trade.id} style={{ fontSize: 12 }}>
                        <span
                          className="trade-notice-item"
                          onClick={(event) => {
                            event.stopPropagation();
                            openTradeDetails(trade);
                          }}
                        >
                          <Badge
                            status={getNoticeStatus(trade)}
                            text={`${trade.asset} · ${modelName ?? "Sin modelo"}${pnlText}`}
                          />
                        </span>
                      </li>
                    );
                  })}
                  {dayTrades.length > 2 ? (
                    <li>
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: 18, fontSize: 11 }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOverflowDateKey(date.format("YYYY-MM-DD"));
                        }}
                      >
                        +{dayTrades.length - 2} más
                      </Button>
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          }}
        />
      </Card>

      <Modal
        open={Boolean(overflowDateKey)}
        title={
          overflowDateKey ? `Trades de ${dayjs(overflowDateKey).format("DD/MM/YYYY")}` : "Trades"
        }
        onCancel={() => setOverflowDateKey(null)}
        footer={null}
      >
        <ul className="events">
          {overflowDayTrades.map((trade) => {
            const pnlText =
              trade.net_pnl == null
                ? ""
                : ` ${trade.net_pnl >= 0 ? "+" : ""}${trade.net_pnl.toFixed(0)}`;
            const modelName = trade.model_id ? modelNameById.get(trade.model_id) : null;

            return (
              <li key={trade.id}>
                <span
                  className="trade-notice-item"
                  onClick={() => {
                    openTradeDetails(trade);
                  }}
                  style={{
                    cursor: "pointer",
                  }}
                >
                  <Badge
                    status={getNoticeStatus(trade)}
                    text={`${trade.asset} · ${modelName ?? "Sin modelo"}${pnlText}`}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      </Modal>

      <TradeDetailsModal
        open={isOpen}
        trade={selectedTrade}
        models={models}
        onClose={closeTradeDetails}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
