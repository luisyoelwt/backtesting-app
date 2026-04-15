import { useCallback, useState } from "react";
import type { TradeRow } from "../lib/database.types";

export function useTradeDetailsModal() {
  const [selectedTrade, setSelectedTrade] = useState<TradeRow | null>(null);

  const openTradeDetails = useCallback((trade: TradeRow) => {
    setSelectedTrade(trade);
  }, []);

  const closeTradeDetails = useCallback(() => {
    setSelectedTrade(null);
  }, []);

  return {
    selectedTrade,
    isOpen: Boolean(selectedTrade),
    openTradeDetails,
    closeTradeDetails,
  };
}
