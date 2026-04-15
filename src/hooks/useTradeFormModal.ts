import { useState, useCallback } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import type { Dayjs } from "dayjs";
import type { ModelRow, TradeRow } from "../lib/database.types";

export function useTradeFormModal(models: ModelRow[]) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeRow | null>(null);
  const [createDate, setCreateDate] = useState<Dayjs | null>(null);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingTrade(null);
    setCreateDate(null);
  }, []);

  const openCreateModal = useCallback(
    (date?: Dayjs) => {
      if (models.length === 0) {
        message.info("Primero crea al menos un modelo en la sección Modelos.");
        navigate("/models");
        return;
      }
      setEditingTrade(null);
      setCreateDate(date ?? null);
      setModalOpen(true);
    },
    [models.length, navigate]
  );

  const openEditModal = useCallback((row: TradeRow) => {
    setEditingTrade(row);
    setModalOpen(true);
  }, []);

  return {
    modalOpen,
    editingTrade,
    createDate,
    closeModal,
    openCreateModal,
    openEditModal,
  };
}
