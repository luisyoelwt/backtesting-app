import { useEffect, useMemo } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Upload,
  type UploadFile,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { BacktestRow, ModelRow } from "../lib/database.types";

const timeframeOptions = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

type BacktestFormValues = {
  asset: string;
  model_id?: string | null;
  timeframe: string;
  start_date: Dayjs;
  end_date: Dayjs;
  initial_capital: number;
  total_return?: number;
  max_drawdown?: number;
  win_rate?: number;
  profit_factor?: number;
  total_trades?: number;
  sharpe_ratio?: number;
  tags?: string[];
  notes?: string;
  no_trade_day?: boolean;
  no_trade_reason?: string;
  equity_curve_file?: UploadFile[];
};

interface BacktestFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  loading?: boolean;
  initialValues?: BacktestRow | null;
  models: ModelRow[];
  onCancel: () => void;
  onSubmit: (values: BacktestFormValues) => Promise<void>;
}

export function BacktestFormModal({
  open,
  mode,
  loading,
  initialValues,
  models,
  onCancel,
  onSubmit,
}: BacktestFormModalProps) {
  const [form] = Form.useForm<BacktestFormValues>();
  const noTradeDay = Form.useWatch("no_trade_day", form);

  const modalTitle = useMemo(
    () => (mode === "create" ? "Nuevo Backtest" : "Editar Backtest"),
    [mode]
  );

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialValues) {
      form.setFieldsValue({
        asset: initialValues.asset,
        model_id: initialValues.model_id,
        timeframe: initialValues.timeframe,
        start_date: dayjs(initialValues.start_date),
        end_date: dayjs(initialValues.end_date),
        initial_capital: initialValues.initial_capital,
        total_return: initialValues.total_return ?? undefined,
        max_drawdown: initialValues.max_drawdown ?? undefined,
        win_rate: initialValues.win_rate ?? undefined,
        profit_factor: initialValues.profit_factor ?? undefined,
        total_trades: initialValues.total_trades ?? undefined,
        sharpe_ratio: initialValues.sharpe_ratio ?? undefined,
        tags: initialValues.tags ?? [],
        notes: initialValues.notes ?? undefined,
        no_trade_day: initialValues.no_trade_day,
        no_trade_reason: initialValues.no_trade_reason ?? undefined,
        equity_curve_file: [],
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({ timeframe: "5m", tags: [], no_trade_day: false, equity_curve_file: [] });
  }, [form, initialValues, mode, open]);

  return (
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
          <Form.Item label="Día sin operativa" name="no_trade_day" valuePropName="checked">
            <Switch checkedChildren="Sí" unCheckedChildren="No" />
          </Form.Item>
        </div>

        {noTradeDay ? (
          <Form.Item
            label="Motivo (no se dio oportunidad de operar)"
            name="no_trade_reason"
            rules={[{ required: true, message: "Describe por qué no hubo operativa." }]}
          >
            <Input.TextArea rows={2} placeholder="Ej: Mercado lateral sin setup válido." />
          </Form.Item>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <Select options={timeframeOptions.map((t) => ({ label: t, value: t }))} />
          </Form.Item>

          <Form.Item
            label="Modelo"
            name="model_id"
            rules={
              noTradeDay
                ? []
                : [{ required: true, message: "Selecciona un modelo para este backtest." }]
            }
          >
            <Select
              placeholder="Selecciona un modelo"
              allowClear={noTradeDay}
              options={models.map((model) => ({
                label: model.name,
                value: model.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Capital Inicial"
            name="initial_capital"
            rules={noTradeDay ? [] : [{ required: true, message: "Este campo es requerido" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} step={0.01} disabled={noTradeDay} />
          </Form.Item>

          <Form.Item label="Inicio (fecha y hora)" name="start_date" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>

          <Form.Item
            label="Fin (fecha y hora)"
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
                  return Promise.reject(new Error("La fecha fin debe ser posterior al inicio."));
                },
              }),
            ]}
          >
            <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </div>

        <Form.Item
          label="Screenshot Equity Curve"
          name="equity_curve_file"
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
          extra="PNG/JPG/WEBP, máximo 3MB."
          rules={[
            {
              validator: (_, fileList: UploadFile[] | undefined) => {
                if (!fileList || fileList.length === 0) return Promise.resolve();
                const file = fileList[0];
                const type = file.type ?? "";
                const size = file.size ?? 0;
                const allowed = ["image/png", "image/jpeg", "image/webp"];

                if (!allowed.includes(type)) {
                  return Promise.reject(new Error("Formato inválido. Usa PNG/JPG/WEBP."));
                }
                if (size > 3 * 1024 * 1024) {
                  return Promise.reject(new Error("La imagen no puede superar 3MB."));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Upload.Dragger
            accept=".png,.jpg,.jpeg,.webp"
            multiple={false}
            maxCount={1}
            beforeUpload={() => false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Haz click o arrastra una imagen</p>
            <p className="ant-upload-hint">Puedes adjuntar el screenshot de la curva de equity</p>
          </Upload.Dragger>
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Form.Item label="Total Return %" name="total_return">
            <InputNumber style={{ width: "100%" }} step={0.01} disabled={noTradeDay} />
          </Form.Item>
          <Form.Item label="Max Drawdown %" name="max_drawdown">
            <InputNumber style={{ width: "100%" }} step={0.01} disabled={noTradeDay} />
          </Form.Item>
          <Form.Item label="Win Rate %" name="win_rate">
            <InputNumber style={{ width: "100%" }} step={0.01} disabled={noTradeDay} />
          </Form.Item>
          <Form.Item label="Profit Factor" name="profit_factor">
            <InputNumber style={{ width: "100%" }} step={0.01} disabled={noTradeDay} />
          </Form.Item>
          <Form.Item label="Total Trades" name="total_trades">
            <InputNumber style={{ width: "100%" }} step={1} disabled={noTradeDay} />
          </Form.Item>
          <Form.Item label="Sharpe Ratio" name="sharpe_ratio">
            <InputNumber style={{ width: "100%" }} step={0.01} disabled={noTradeDay} />
          </Form.Item>
        </div>

        <Form.Item label="Tags" name="tags">
          <Select mode="tags" tokenSeparators={[","]} placeholder="momentum, breakout, crypto" />
        </Form.Item>

        <Form.Item label="Notas" name="notes">
          <Input.TextArea rows={3} placeholder="Qué funcionó, qué ajustarías, etc." />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export type { BacktestFormValues };
