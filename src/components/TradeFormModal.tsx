import { useEffect, useMemo } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  // Upload,
  type UploadFile,
} from "antd";
//import { InboxOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { ModelRow, TradeRow } from "../lib/database.types";

const timeframeOptions = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
const directionOptions = [
  { label: "Long", value: "long" },
  { label: "Short", value: "short" },
];
const tradeStatusOptions = [
  { label: "Cerrado", value: "closed" },
  { label: "Cierre manual", value: "manual_close" },
  { label: "Cancelado", value: "cancelled" },
];
const MAX_TRADE_IMAGES = 3;
const MAX_TRADE_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TRADE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type TradeFileLike = Pick<UploadFile, "type" | "size">;

function validateTradeImageFiles(fileList: TradeFileLike[] | undefined) {
  if (!fileList || fileList.length === 0) {
    return { isValid: true as const };
  }

  if (fileList.length > MAX_TRADE_IMAGES) {
    return {
      isValid: false as const,
      error: "Solo puedes adjuntar hasta 3 imágenes.",
      code: "max_count" as const,
    };
  }

  const hasInvalidFormat = fileList.some(
    (file) => !ALLOWED_TRADE_IMAGE_TYPES.includes(file.type ?? "")
  );
  if (hasInvalidFormat) {
    return {
      isValid: false as const,
      error: "Formato inválido. Usa PNG/JPG/WEBP.",
      code: "invalid_format" as const,
    };
  }

  const hasInvalidSize = fileList.some((file) => (file.size ?? 0) > MAX_TRADE_IMAGE_SIZE_BYTES);
  if (hasInvalidSize) {
    return {
      isValid: false as const,
      error: "Cada imagen no puede superar 3MB.",
      code: "invalid_size" as const,
    };
  }

  return { isValid: true as const };
}

type TradeFormValues = {
  asset: string;
  model_id?: string | null;
  timeframe: string;
  direction: "long" | "short";
  trade_status: "closed" | "manual_close" | "cancelled";
  start_date: Dayjs;
  end_date: Dayjs;
  initial_capital: number;
  gross_pnl?: number;
  fee_amount?: number;
  close_reason?: string;
  tags?: string[];
  notes?: string;
  equity_curve_file?: UploadFile[];
};

interface TradeFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  loading?: boolean;
  initialValues?: TradeRow | null;
  createDate?: Dayjs | null;
  models: ModelRow[];
  onCancel: () => void;
  onSubmit: (values: TradeFormValues) => Promise<void>;
}

export function TradeFormModal({
  open,
  mode,
  loading,
  initialValues,
  createDate,
  models,
  onCancel,
  onSubmit,
}: TradeFormModalProps) {
  const [form] = Form.useForm<TradeFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const tradeStatus = Form.useWatch("trade_status", form);
  const initialCapital = Form.useWatch("initial_capital", form) ?? 0;
  const grossPnl = Form.useWatch("gross_pnl", form) ?? 0;
  const feeAmount = Form.useWatch("fee_amount", form) ?? 0;

  const modalTitle = useMemo(() => (mode === "create" ? "Nuevo Trade" : "Editar Trade"), [mode]);

  const netPnlPreview = useMemo(() => Number(grossPnl) - Number(feeAmount), [feeAmount, grossPnl]);

  const returnPreview = useMemo(() => {
    const capital = Number(initialCapital);
    if (!capital) return 0;
    return (netPnlPreview / capital) * 100;
  }, [initialCapital, netPnlPreview]);

  const closeReasonLabel =
    tradeStatus === "cancelled" ? "Motivo de cancelación" : "Comentario del cierre";

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialValues) {
      form.setFieldsValue({
        asset: initialValues.asset,
        model_id: initialValues.model_id,
        timeframe: initialValues.timeframe,
        direction: (initialValues.direction as "long" | "short") ?? "long",
        trade_status:
          (initialValues.trade_status as "closed" | "manual_close" | "cancelled") ??
          (initialValues.no_trade_day ? "cancelled" : "closed"),
        start_date: dayjs(initialValues.start_date),
        end_date: dayjs(initialValues.end_date),
        initial_capital: initialValues.initial_capital,
        gross_pnl:
          initialValues.gross_pnl ??
          (initialValues.net_pnl != null && initialValues.fee_amount != null
            ? initialValues.net_pnl + initialValues.fee_amount
            : undefined),
        fee_amount: initialValues.fee_amount ?? 0,
        close_reason: initialValues.close_reason ?? initialValues.no_trade_reason ?? undefined,
        tags: initialValues.tags ?? [],
        notes: initialValues.notes ?? undefined,
        equity_curve_file: [],
      });
      return;
    }

    form.resetFields();
    const baseDate = createDate ?? dayjs();
    form.setFieldsValue({
      timeframe: "5m",
      direction: "long",
      trade_status: "closed",
      start_date: baseDate.startOf("day"),
      end_date: baseDate.startOf("day").add(1, "hour"),
      fee_amount: 0,
      tags: [],
      equity_curve_file: [],
    });
  }, [createDate, form, initialValues, mode, open]);

  useEffect(() => {
    if (!open) return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items?.length) return;

      const pastedImages: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pastedImages.push(file);
        }
      }

      if (pastedImages.length === 0) return;

      const currentFiles = form.getFieldValue("equity_curve_file") ?? [];
      const availableSlots = MAX_TRADE_IMAGES - currentFiles.length;

      if (availableSlots <= 0) {
        event.preventDefault();
        messageApi.warning("Ya tienes 3 imágenes. Elimina una para pegar otra.");
        return;
      }

      const validFiles: File[] = [];
      let hasFormatError = false;
      let hasSizeError = false;

      for (const file of pastedImages) {
        const validation = validateTradeImageFiles([file]);

        if (!validation.isValid && validation.code === "invalid_format") {
          hasFormatError = true;
          continue;
        }

        if (!validation.isValid && validation.code === "invalid_size") {
          hasSizeError = true;
          continue;
        }

        validFiles.push(file);
      }

      if (hasFormatError) {
        messageApi.error("Formato inválido. Usa PNG/JPG/WEBP.");
      }
      if (hasSizeError) {
        messageApi.error("Cada imagen no puede superar 3MB.");
      }

      if (validFiles.length === 0) return;

      event.preventDefault();

      const nextFiles: UploadFile[] = validFiles.slice(0, availableSlots).map((file, index) => ({
        uid: `paste-${Date.now()}-${index}`,
        name: file.name || `clipboard-image-${index + 1}.png`,
        status: "done",
        type: file.type,
        size: file.size,
        originFileObj: file as UploadFile["originFileObj"],
      }));

      form.setFieldValue("equity_curve_file", [...currentFiles, ...nextFiles]);
      void form.validateFields(["equity_curve_file"]);

      if (validFiles.length > availableSlots) {
        messageApi.warning("Solo se pegaron las imágenes permitidas hasta completar 3.");
      }
    };

    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("paste", onPaste);
    };
  }, [form, messageApi, open]);

  return (
    <>
      {contextHolder}
      <Modal
        title={modalTitle}
        open={open}
        onCancel={onCancel}
        width={900}
        destroyOnHidden
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={async () => {
                const values = await form.validateFields();
                await onSubmit(values);
              }}
            >
              {mode === "create" ? "Crear" : "Guardar cambios"}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item label="Dirección" name="direction" rules={[{ required: true }]}>
              <Select options={directionOptions} />
            </Form.Item>

            <Form.Item label="Estado del trade" name="trade_status" rules={[{ required: true }]}>
              <Select options={tradeStatusOptions} />
            </Form.Item>

            <Form.Item
              label="Activo"
              name="asset"
              rules={[
                { required: true, message: "El activo es obligatorio." },
                { min: 2, message: "Debe tener al menos 2 caracteres." },
                { max: 30, message: "Máximo 30 caracteres." },
              ]}
            >
              <Input placeholder="BTC/USDT" />
            </Form.Item>

            <Form.Item label="Timeframe" name="timeframe" rules={[{ required: true }]}>
              <Select
                options={timeframeOptions.map((timeframe) => ({
                  label: timeframe,
                  value: timeframe,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Modelo"
              name="model_id"
              rules={[{ required: true, message: "Selecciona un modelo para este trade." }]}
            >
              <Select
                placeholder="Selecciona un modelo"
                allowClear
                options={models.map((model) => ({
                  label: model.name,
                  value: model.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Capital Asignado"
              name="initial_capital"
              rules={[{ required: true, message: "Este campo es requerido" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
            </Form.Item>

            <Form.Item
              label="Apertura (fecha y hora)"
              name="start_date"
              rules={[{ required: true }]}
            >
              <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>

            <Form.Item
              label="Cierre (fecha y hora)"
              name="end_date"
              dependencies={["start_date"]}
              rules={[
                { required: true },
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs) {
                    const start = getFieldValue("start_date") as Dayjs | undefined;
                    if (!start || !value || value.isAfter(start)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("La fecha de cierre debe ser posterior a la apertura.")
                    );
                  },
                }),
              ]}
            >
              <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Form.Item label="Resultado Bruto" name="gross_pnl">
              <InputNumber
                style={{ width: "100%" }}
                step={0.01}
                disabled={tradeStatus === "cancelled"}
              />
            </Form.Item>
            <Form.Item label="Comisión / Fees" name="fee_amount">
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                step={0.01}
                disabled={tradeStatus === "cancelled"}
              />
            </Form.Item>
            <Form.Item label="Rentabilidad Estimada">
              <InputNumber
                style={{ width: "100%" }}
                value={Number(returnPreview.toFixed(2))}
                suffix="%"
                disabled
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item label="PnL Neto Estimado">
              <InputNumber
                style={{ width: "100%" }}
                value={Number(netPnlPreview.toFixed(2))}
                disabled
              />
            </Form.Item>

            <Form.Item
              label={closeReasonLabel}
              name="close_reason"
              rules={
                tradeStatus === "manual_close" || tradeStatus === "cancelled"
                  ? [{ required: true, message: "Completa este campo." }]
                  : []
              }
            >
              <Input.TextArea
                rows={2}
                placeholder={
                  tradeStatus === "cancelled"
                    ? "Ej: setup invalidado antes de ejecutar"
                    : "Ej: cierre manual por pérdida de momentum"
                }
              />
            </Form.Item>
          </div>

          {/* <Form.Item
            label="Capturas del trade"
            name="equity_curve_file"
            valuePropName="fileList"
            getValueFromEvent={(event) => event?.fileList}
            extra="PNG/JPG/WEBP, máximo 3 imágenes de 3MB cada una."
            rules={[
              {
                validator: (_, fileList: UploadFile[] | undefined) => {
                  const validation = validateTradeImageFiles(fileList);
                  if (!validation.isValid) {
                    return Promise.reject(new Error(validation.error));
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Upload.Dragger
              accept=".png,.jpg,.jpeg,.webp"
              multiple
              maxCount={MAX_TRADE_IMAGES}
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Haz click o arrastra hasta 3 imágenes</p>
              <p className="ant-upload-hint">
                Adjunta capturas de entrada, salida o contexto del trade
              </p>
            </Upload.Dragger>
          </Form.Item> */}

          <Form.Item label="Tags" name="tags">
            <Select mode="tags" tokenSeparators={[","]} placeholder="momentum, breakout, crypto" />
          </Form.Item>

          <Form.Item label="Notas" name="notes">
            <Input.TextArea rows={3} placeholder="Qué funcionó, qué ajustarías, etc." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export type { TradeFormValues };
