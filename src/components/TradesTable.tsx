import { Button, Popconfirm, Space, Table, Tag } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import type { ModelRow, TradeRow } from "../lib/database.types";
import Text from "antd/es/typography/Text";

interface TradesTableProps {
  data: TradeRow[];
  loading: boolean;
  models: ModelRow[];
  onEdit: (row: TradeRow) => void;
  onDelete: (row: TradeRow) => void;
}

export function TradesTable({ data, loading, models, onEdit, onDelete }: TradesTableProps) {
  const navigate = useNavigate();

  const modelsById = new Map(models.map((model) => [model.id, model]));
  const formatCurrency = (value: number | null) => (value == null ? "-" : `$${value.toFixed(2)}`);

  const columns = [
    {
      title: "Activo",
      dataIndex: "asset",
      key: "asset",
      width: 120,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Modelo",
      dataIndex: "model_id",
      key: "model_id",
      width: 170,
      render: (value: string | null) => {
        if (!value) return <Text type="secondary">Sin modelo</Text>;
        const model = modelsById.get(value);
        return <Text>{model?.name ?? "Modelo eliminado"}</Text>;
      },
    },
    {
      title: "Dirección",
      dataIndex: "direction",
      key: "direction",
      width: 110,
      render: (value: string | null) => (
        <Tag color={value === "short" ? "volcano" : "blue"}>
          {value === "short" ? "Short" : "Long"}
        </Tag>
      ),
    },
    {
      title: "Estado",
      dataIndex: "trade_status",
      key: "trade_status",
      width: 150,
      render: (value: string | null) => {
        if (value === "cancelled") return <Tag color="gold">Cancelado</Tag>;
        if (value === "manual_close") return <Tag color="cyan">Cierre manual</Tag>;
        return <Tag color="green">Cerrado</Tag>;
      },
    },
    {
      title: "Apertura",
      dataIndex: "start_date",
      key: "start_date",
      width: 170,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Cierre",
      dataIndex: "end_date",
      key: "end_date",
      width: 170,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "PnL Neto",
      dataIndex: "net_pnl",
      key: "net_pnl",
      align: "right" as const,
      width: 120,
      render: (value: number | null) => (
        <Text style={{ color: value == null ? undefined : value >= 0 ? "#22c55e" : "#ef4444" }}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: "Rentab.",
      dataIndex: "total_return",
      key: "total_return",
      align: "right" as const,
      width: 120,
      render: (value: number | null) => (value == null ? "-" : `${value.toFixed(2)}%`),
    },
    {
      title: "Comisión",
      dataIndex: "fee_amount",
      key: "fee_amount",
      align: "right" as const,
      width: 120,
      render: (value: number | null) => formatCurrency(value),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      width: 180,
      render: (tags: string[]) =>
        tags?.length ? (
          <Space size={[0, 6]} wrap>
            {tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Acciones",
      key: "actions",
      fixed: "right" as const,
      width: 180,
      render: (_: unknown, row: TradeRow) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/trades/${row.id}`)}
          >
            Ver
          </Button>
          <Button type="default" icon={<EditOutlined />} onClick={() => onEdit(row)} />
          <Popconfirm
            title="Eliminar trade"
            description="Esta acción no se puede deshacer."
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => onDelete(row)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1400 }}
      locale={{ emptyText: "No hay trades aún" }}
    />
  );
}
