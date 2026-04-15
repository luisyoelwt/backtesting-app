import { useEffect, useState } from "react";
import { message } from "antd";
import { supabase } from "../lib/supabase";
import type { TradeRow } from "../lib/database.types";

export function useTrades() {
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrades = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(error.message);
    } else if (data) {
      setTrades(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialTrades = async () => {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        message.error(error.message);
      } else {
        setTrades(data ?? []);
      }
      setLoading(false);
    };

    void loadInitialTrades();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    trades,
    setTrades,
    loading,
    setLoading,
    loadTrades,
  };
}
