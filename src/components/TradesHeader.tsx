import { Button, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

interface TradesHeaderProps {
  modelsCount: number;
  onCreateClick: () => void;
}

export function TradesHeader({ modelsCount, onCreateClick }: TradesHeaderProps) {
  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Title level={2} style={{ color: "#f5f8ff", margin: 0 }}>
            Registro de Trades
          </Title>
        </div>

        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
            Nuevo trade
          </Button>
        </Space>
      </div>

      <Typography.Text style={{ color: "#8b98b1", display: "block", marginBottom: 12 }}>
        Modelos disponibles: {modelsCount}
      </Typography.Text>

      <Typography.Text style={{ color: "#6f7f9a", display: "block", marginBottom: 12 }}>
        Búsqueda: activo, estrategia, tags, notas y motivo de cierre o cancelación.
      </Typography.Text>
    </>
  );
}
