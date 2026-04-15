import { useMemo, useState, useCallback } from "react";
import { useTrades } from "../hooks/useTrades";
import { useModels } from "../hooks/useModels";
import { useTradeOperations } from "../hooks/useTradeOperations";
import { useTradeFormModal } from "../hooks/useTradeFormModal";
import { TradeFormModal, type TradeFormValues } from "../components/TradeFormModal";
import { TradeFilters } from "../components/TradeFilters";
import { TradesHeader } from "../components/TradesHeader";
import { TradesCalendar } from "../components/TradesCalendar";
import type { TradeRow } from "../lib/database.types";

export function TradesPage() {
  const { trades, loading, loadTrades } = useTrades();
  const { models, loadModels } = useModels();
  const { modalOpen, editingTrade, createDate, closeModal, openCreateModal, openEditModal } =
    useTradeFormModal(models);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");

  const handleOperationSuccess = useCallback(async () => {
    setSaving(false);
    closeModal();
    await Promise.all([loadTrades(true), loadModels()]);
  }, [closeModal, loadTrades, loadModels]);

  const { handleDelete, handleSubmit } = useTradeOperations(handleOperationSuccess);

  const assets = useMemo(() => {
    const unique = new Set(trades.map((trade) => trade.asset));
    return ["all", ...Array.from(unique)];
  }, [trades]);

  const filtered = useMemo(() => {
    return trades.filter((trade) => {
      const matchesQuery =
        trade.asset.toLowerCase().includes(query.toLowerCase()) ||
        trade.strategy_name.toLowerCase().includes(query.toLowerCase()) ||
        (trade.close_reason ?? trade.no_trade_reason ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        (trade.notes ?? "").toLowerCase().includes(query.toLowerCase()) ||
        trade.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesAsset = assetFilter === "all" || trade.asset === assetFilter;

      return matchesQuery && matchesAsset;
    });
  }, [trades, query, assetFilter]);

  const handleDeleteClick = async (row: TradeRow) => {
    setSaving(true);
    await handleDelete(row);
    setSaving(false);
  };

  const handleSubmitForm = async (values: TradeFormValues) => {
    setSaving(true);
    await handleSubmit(values, models, editingTrade);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white px-4 md:px-6 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <TradesHeader modelsCount={models.length} onCreateClick={openCreateModal} />

        <TradeFilters
          query={query}
          onQueryChange={setQuery}
          assetFilter={assetFilter}
          onAssetFilterChange={setAssetFilter}
          assets={assets}
        />

        <TradesCalendar
          data={filtered}
          loading={loading}
          models={models}
          onCreateFromDate={openCreateModal}
          onEdit={openEditModal}
          onDelete={handleDeleteClick}
        />

        <TradeFormModal
          open={modalOpen}
          mode={editingTrade ? "edit" : "create"}
          loading={saving}
          initialValues={editingTrade}
          createDate={createDate}
          models={models}
          onCancel={closeModal}
          onSubmit={handleSubmitForm}
        />
      </div>
    </div>
  );
}
