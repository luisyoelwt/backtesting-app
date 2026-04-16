import { useMemo, useState, useCallback } from "react";
import { Alert, Card, Col, Divider, InputNumber, Row, Tooltip, Typography } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

type NullableNumber = number | null;

export function RiskCalculator() {
  const [entry, setEntry] = useState<NullableNumber>(null);
  const [stopLoss, setStopLoss] = useState<NullableNumber>(null);
  const [sizeUsdt, setSizeUsdt] = useState<NullableNumber>(null);
  const [leverage, setLeverage] = useState<NullableNumber>(40);
  const [rr, setRr] = useState<NullableNumber>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyValue = useCallback((key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const hasAllValues =
    entry !== null && stopLoss !== null && sizeUsdt !== null && leverage !== null && rr !== null;

  const invalid =
    !hasAllValues ||
    !Number.isFinite(entry) ||
    !Number.isFinite(stopLoss) ||
    !Number.isFinite(sizeUsdt) ||
    !Number.isFinite(leverage) ||
    !Number.isFinite(rr) ||
    (entry ?? 0) <= 0 ||
    (sizeUsdt ?? 0) <= 0 ||
    (leverage ?? 0) <= 0 ||
    (rr ?? 0) <= 0;

  const metrics = useMemo(() => {
    if (
      invalid ||
      entry === null ||
      stopLoss === null ||
      sizeUsdt === null ||
      leverage === null ||
      rr === null
    ) {
      return null;
    }

    const sizeBtc = sizeUsdt / entry;
    const distanceToSl = Math.abs(entry - stopLoss);
    const realRisk = distanceToSl * sizeBtc;
    const positionValue = sizeUsdt;
    const requiredMargin = sizeUsdt / leverage;
    const expectedProfit = realRisk * rr;
    const tpDistance = distanceToSl * rr;
    const isLong = entry >= stopLoss;
    const tpPrice = isLong ? entry + tpDistance : entry - tpDistance;

    return {
      distanceToSl,
      realRisk,
      positionValue,
      requiredMargin,
      expectedProfit,
      tpPrice,
      tpDistance,
      isLong,
      rr,
    };
  }, [entry, invalid, leverage, rr, sizeUsdt, stopLoss]);

  return (
    <Card
      className="mb-6 border border-emerald-500/20 bg-[#0f1722]/80"
      title={
        <Title level={4} style={{ color: "#eaf3ff", margin: 0 }}>
          Calculadora de Riesgo Real
        </Title>
      }
    >
      <Text style={{ color: "#9ab0cc" }}>
        El margen no es el riesgo. Esta calculadora muestra cuánto arriesgas realmente según
        distancia al SL y tamaño de la posición.
      </Text>

      <Row gutter={[12, 12]} className="mt-4">
        <Col xs={24} md={12} lg={8}>
          <Text style={{ color: "#b5c7e2", display: "block", marginBottom: 6 }}>Entrada</Text>
          <InputNumber
            value={entry}
            onChange={(value) => setEntry(value ?? null)}
            controls={false}
            className="w-full"
            step={0.1}
            min={0}
            precision={2}
            placeholder="Ej: 74492.6"
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Text style={{ color: "#b5c7e2", display: "block", marginBottom: 6 }}>Stop Loss</Text>
          <InputNumber
            value={stopLoss}
            onChange={(value) => setStopLoss(value ?? null)}
            controls={false}
            className="w-full"
            step={0.1}
            min={0}
            precision={2}
            placeholder="Ej: 74275"
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Text style={{ color: "#b5c7e2", display: "block", marginBottom: 6 }}>Tamaño (USDT)</Text>
          <InputNumber
            value={sizeUsdt}
            onChange={(value) => setSizeUsdt(value ?? null)}
            controls={false}
            className="w-full"
            step={1}
            min={0.01}
            precision={2}
            placeholder="Ej: 149"
            addonAfter="USDT"
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Text style={{ color: "#b5c7e2", display: "block", marginBottom: 6 }}>
            Apalancamiento
          </Text>
          <InputNumber
            value={leverage}
            onChange={(value) => setLeverage(value ?? null)}
            controls={false}
            className="w-full"
            step={1}
            min={1}
            precision={0}
            addonAfter="x"
            placeholder="Ej: 40"
          />
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Text style={{ color: "#b5c7e2", display: "block", marginBottom: 6 }}>
            Riesgo/Recompensa (RR)
          </Text>
          <InputNumber
            value={rr}
            onChange={(value) => setRr(value ?? null)}
            controls={false}
            className="w-full"
            step={0.1}
            min={0.1}
            precision={2}
            placeholder="Ej: 2"
          />
        </Col>
      </Row>

      <Divider style={{ borderColor: "rgba(148, 163, 184, 0.24)", margin: "18px 0" }} />

      {invalid || !metrics ? (
        <Alert
          type="warning"
          showIcon
          message="Completa todos los campos con valores válidos para calcular el riesgo real."
        />
      ) : (
        <Row gutter={[12, 12]}>
          {(
            [
              {
                key: "sl",
                label: "Distancia al SL",
                value: metrics.distanceToSl.toFixed(2),
                suffix: " pts",
                color: "#f3f7ff",
              },
              {
                key: "risk",
                label: "Riesgo real",
                value: metrics.realRisk.toFixed(3),
                suffix: " USDT",
                color: "#ffb78f",
              },
              {
                key: "profit",
                label: "Ganancia esperada",
                value: metrics.expectedProfit.toFixed(3),
                suffix: " USDT",
                color: "#6be4b6",
              },
              {
                key: "pos",
                label: "Valor de posición",
                value: metrics.positionValue.toFixed(2),
                suffix: " USDT",
                color: "#d9e7ff",
              },
              {
                key: "margin",
                label: "Margen requerido",
                value: metrics.requiredMargin.toFixed(2),
                suffix: " USDT",
                color: "#d9e7ff",
              },
              {
                key: "tp",
                label: `TP objetivo (RR ${metrics.rr.toFixed(2)})`,
                value: metrics.tpPrice.toFixed(2),
                suffix: "",
                color: "#a8d1ff",
              },
            ] as const
          ).map(({ key, label, value, suffix, color }) => (
            <Col key={key} xs={24} sm={12} lg={8}>
              <Tooltip title={copied === key ? "¡Copiado!" : "Copiar valor"}>
                <Card
                  size="small"
                  className="bg-[#121d2b] border border-[#213145] cursor-pointer select-none transition-colors hover:border-emerald-500/40"
                  onClick={() => copyValue(key, value)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={{ color: "#8fa5c2", display: "block" }}>{label}</Text>
                    {copied === key ? (
                      <CheckOutlined style={{ color: "#6be4b6", fontSize: 13 }} />
                    ) : (
                      <CopyOutlined style={{ color: "#4a5e78", fontSize: 13 }} />
                    )}
                  </div>
                  <Title level={4} style={{ color, margin: "6px 0 0" }}>
                    {value}
                    {suffix}
                  </Title>
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>
      )}

      {!invalid && metrics && (
        <Alert
          className="mt-4"
          type="info"
          showIcon
          message={`Trade ${metrics.isLong ? "LONG" : "SHORT"}: TP a ${metrics.tpDistance.toFixed(2)} puntos para buscar RR ${metrics.rr.toFixed(2)}.`}
          description="Formula base: riesgo real = |entrada - SL| x tamano BTC."
        />
      )}
    </Card>
  );
}
