import { message } from "antd";
import { supabase } from "../lib/supabase";
import type { ModelRow, TradeInsert, TradeRow } from "../lib/database.types";
import type { TradeFormValues } from "../components/TradeFormModal";
import { compressImage, getTradeImagePaths } from "../utils/imageUtils";

export function useTradeOperations(onSuccess: () => Promise<void>) {
  const handleDelete = async (row: TradeRow) => {
    const imagePaths = getTradeImagePaths(row);

    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("equity-curves")
        .remove(imagePaths);

      if (storageError) {
        message.error(`No se pudo eliminar las imágenes asociadas: ${storageError.message}`);
        return;
      }
    }

    const { error } = await supabase.from("trades").delete().eq("id", row.id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Trade eliminado");
    await onSuccess();
  };

  const handleSubmit = async (
    values: TradeFormValues,
    models: ModelRow[],
    editingTrade: TradeRow | null
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      message.error("No hay sesión activa. Inicia sesión nuevamente.");
      return;
    }

    if (!values.model_id) {
      message.error("Debes seleccionar un modelo.");
      return;
    }

    if (values.initial_capital === undefined || values.initial_capital === null) {
      message.error("Debes ingresar el capital inicial.");
      return;
    }

    const selectedModel = values.model_id
      ? models.find((model) => model.id === values.model_id)
      : null;

    let equityCurveUrls: string[] = editingTrade?.equity_curve_urls?.length
      ? editingTrade.equity_curve_urls
      : editingTrade?.equity_curve_url
        ? [editingTrade.equity_curve_url]
        : [];

    const files = values.equity_curve_file?.map((item) => item.originFileObj).filter(Boolean) as
      | File[]
      | undefined;

    if (files?.length) {
      const uploadedUrls: string[] = [];

      for (const file of files.slice(0, 3)) {
        let uploadFile: File;
        try {
          uploadFile = await compressImage(file);
        } catch {
          uploadFile = file;
        }

        const originalSizeKb = Math.round(file.size / 1024);
        const compressedSizeKb = Math.round(uploadFile.size / 1024);
        if (compressedSizeKb < originalSizeKb) {
          message.info(`Imagen comprimida: ${originalSizeKb}KB -> ${compressedSizeKb}KB`);
        }

        const fileExt = uploadFile.name.split(".").pop() ?? "jpg";
        const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("equity-curves")
          .upload(filePath, uploadFile, { upsert: false });

        if (uploadError) {
          const isMissingBucket = /bucket not found/i.test(uploadError.message);
          if (isMissingBucket) {
            message.warning(
              'No se subio la imagen porque el bucket "equity-curves" no existe. Crea el bucket en Supabase Storage y vuelve a intentarlo.'
            );
            break;
          }

          message.error(`Error subiendo imagen: ${uploadError.message}`);
          return;
        }

        const { data: publicData } = supabase.storage.from("equity-curves").getPublicUrl(filePath);
        uploadedUrls.push(publicData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        equityCurveUrls = uploadedUrls.slice(0, 3);
      }
    }

    const tradeStatus = values.trade_status;
    const grossPnl = tradeStatus === "cancelled" ? 0 : Number(values.gross_pnl ?? 0);
    const feeAmount = tradeStatus === "cancelled" ? 0 : Number(values.fee_amount ?? 0);
    const netPnl = grossPnl - feeAmount;
    const totalReturn = values.initial_capital
      ? (netPnl / Number(values.initial_capital)) * 100
      : null;

    const payload: TradeInsert = {
      asset: values.asset.trim(),
      strategy_name: selectedModel?.name ?? "Sin modelo",
      strategy_description: selectedModel?.description ?? null,
      model_id: values.model_id ?? null,
      timeframe: values.timeframe,
      direction: values.direction,
      trade_status: tradeStatus,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date.toISOString(),
      initial_capital: Number(values.initial_capital),
      gross_pnl: tradeStatus === "cancelled" ? null : grossPnl,
      fee_amount: tradeStatus === "cancelled" ? 0 : feeAmount,
      net_pnl: tradeStatus === "cancelled" ? null : netPnl,
      total_return: tradeStatus === "cancelled" ? null : totalReturn,
      max_drawdown: null,
      win_rate: null,
      profit_factor: null,
      total_trades: tradeStatus === "cancelled" ? 0 : 1,
      sharpe_ratio: null,
      notes: values.notes?.trim() || null,
      no_trade_day: tradeStatus === "cancelled",
      no_trade_reason: tradeStatus === "cancelled" ? values.close_reason?.trim() || null : null,
      close_reason: values.close_reason?.trim() || null,
      equity_curve_url: equityCurveUrls[0] ?? null,
      equity_curve_urls: equityCurveUrls,
      tags: values.tags ?? [],
      user_id: user.id,
    };

    const queryBuilder = editingTrade
      ? supabase.from("trades").update(payload).eq("id", editingTrade.id)
      : supabase.from("trades").insert(payload);

    const { error } = await queryBuilder;
    if (error) {
      message.error(error.message);
      return;
    }

    message.success(editingTrade ? "Trade actualizado" : "Trade creado");
    await onSuccess();
  };

  return {
    handleDelete,
    handleSubmit,
  };
}
