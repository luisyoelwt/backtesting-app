import { useEffect, useMemo, useState } from "react";
import { Button, Input, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { BacktestInsert, BacktestRow, ModelRow } from "../lib/database.types";
import { BacktestFormModal, type BacktestFormValues } from "../components/BacktestFormModal";

const { Title, Text } = Typography;

export function DashboardPage() {
  const navigate = useNavigate();
  const [backtests, setBacktests] = useState<BacktestRow[]>([]);

  const extractEquityStoragePath = (value: string): string | null => {
    if (!value) return null;

    if (!/^https?:\/\//i.test(value)) {
      return value;
    }

    try {
      const parsed = new URL(value);
      const marker = "/storage/v1/object/public/equity-curves/";
      const markerIndex = parsed.pathname.indexOf(marker);
      if (markerIndex === -1) return null;

      const path = parsed.pathname.slice(markerIndex + marker.length);
      return decodeURIComponent(path);
    } catch {
      return null;
    }
  };

  const getBacktestImagePaths = (row: BacktestRow): string[] => {
    const urls = row.equity_curve_urls?.length
      ? row.equity_curve_urls
      : row.equity_curve_url
        ? [row.equity_curve_url]
        : [];

    return Array.from(
      new Set(
        urls
          .map((url) => extractEquityStoragePath(url))
          .filter((path): path is string => Boolean(path))
      )
    );
  };

  async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) {
      return file;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
        img.src = objectUrl;
      });

      const MAX_DIMENSION = 1600;
      const scale = Math.min(MAX_DIMENSION / image.width, MAX_DIMENSION / image.height, 1);
      const targetWidth = Math.max(1, Math.round(image.width * scale));
      const targetHeight = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return file;
      }

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.82);
      });

      if (!blob) {
        return file;
      }

      const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], compressedName, { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  const [models, setModels] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBacktest, setEditingBacktest] = useState<BacktestRow | null>(null);

  const loadBacktests = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    const { data, error } = await supabase
      .from("backtests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(error.message);
    } else if (data) {
      setBacktests(data);
    }
    setLoading(false);
  };

  const loadModels = async () => {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(error.message);
      return;
    }
    setModels(data ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialBacktests = async () => {
      const [backtestsRes, modelsRes] = await Promise.all([
        supabase.from("backtests").select("*").order("created_at", { ascending: false }),
        supabase.from("models").select("*").order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (backtestsRes.error) {
        message.error(backtestsRes.error.message);
      } else {
        setBacktests(backtestsRes.data ?? []);
      }

      if (modelsRes.error) {
        message.error(modelsRes.error.message);
      } else {
        setModels(modelsRes.data ?? []);
      }
      setLoading(false);
    };

    void loadInitialBacktests();

    return () => {
      isMounted = false;
    };
  }, []);

  const assets = useMemo(() => {
    const unique = new Set(backtests.map((b) => b.asset));
    return ["all", ...Array.from(unique)];
  }, [backtests]);

  const filtered = useMemo(() => {
    return backtests.filter((b) => {
      const matchesQuery =
        b.asset.toLowerCase().includes(query.toLowerCase()) ||
        b.strategy_name.toLowerCase().includes(query.toLowerCase()) ||
        (b.no_trade_reason ?? "").toLowerCase().includes(query.toLowerCase()) ||
        b.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesAsset = assetFilter === "all" || b.asset === assetFilter;

      return matchesQuery && matchesAsset;
    });
  }, [backtests, query, assetFilter]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingBacktest(null);
  };

  const openCreateModal = () => {
    if (models.length === 0) {
      message.info("Primero crea al menos un modelo en la sección Modelos.");
      navigate("/models");
      return;
    }
    setEditingBacktest(null);
    setModalOpen(true);
  };

  const openEditModal = (row: BacktestRow) => {
    setEditingBacktest(row);
    setModalOpen(true);
  };

  const handleDelete = async (row: BacktestRow) => {
    const imagePaths = getBacktestImagePaths(row);

    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("equity-curves")
        .remove(imagePaths);

      if (storageError) {
        message.error(`No se pudo eliminar las imágenes asociadas: ${storageError.message}`);
        return;
      }
    }

    const { error } = await supabase.from("backtests").delete().eq("id", row.id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Backtest eliminado");
    await loadBacktests(true);
  };

  const handleSubmit = async (values: BacktestFormValues) => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      message.error("No hay sesión activa. Inicia sesión nuevamente.");
      setSaving(false);
      return;
    }

    if (!values.no_trade_day && !values.model_id) {
      message.error("Debes seleccionar un modelo.");
      setSaving(false);
      return;
    }

    if (
      !values.no_trade_day &&
      (values.initial_capital === undefined || values.initial_capital === null)
    ) {
      message.error("Debes ingresar el capital inicial.");
      setSaving(false);
      return;
    }

    const selectedModel = values.model_id ? models.find((m) => m.id === values.model_id) : null;

    let equityCurveUrls: string[] = editingBacktest?.equity_curve_urls?.length
      ? editingBacktest.equity_curve_urls
      : editingBacktest?.equity_curve_url
        ? [editingBacktest.equity_curve_url]
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
          setSaving(false);
          return;
        }

        const { data: publicData } = supabase.storage.from("equity-curves").getPublicUrl(filePath);
        uploadedUrls.push(publicData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        equityCurveUrls = uploadedUrls.slice(0, 3);
      }
    }

    const payload: BacktestInsert = {
      asset: values.asset.trim(),
      strategy_name: selectedModel?.name ?? (values.no_trade_day ? "Sin operativa" : "Sin modelo"),
      strategy_description: selectedModel?.description ?? null,
      model_id: values.no_trade_day ? (values.model_id ?? null) : (values.model_id ?? null),
      timeframe: values.timeframe,
      start_date: values.start_date.toISOString(),
      end_date: values.end_date.toISOString(),
      initial_capital: values.no_trade_day ? 0 : Number(values.initial_capital),
      total_return: values.no_trade_day ? null : (values.total_return ?? null),
      max_drawdown: values.no_trade_day ? null : (values.max_drawdown ?? null),
      win_rate: values.no_trade_day ? null : (values.win_rate ?? null),
      profit_factor: values.no_trade_day ? null : (values.profit_factor ?? null),
      total_trades: values.no_trade_day ? 0 : (values.total_trades ?? null),
      sharpe_ratio: values.no_trade_day ? null : (values.sharpe_ratio ?? null),
      notes: values.notes?.trim() || null,
      no_trade_day: values.no_trade_day ?? false,
      no_trade_reason: values.no_trade_day ? values.no_trade_reason?.trim() || null : null,
      equity_curve_url: equityCurveUrls[0] ?? null,
      equity_curve_urls: equityCurveUrls,
      tags: values.tags ?? [],
      user_id: user.id,
    };

    const queryBuilder = editingBacktest
      ? supabase.from("backtests").update(payload).eq("id", editingBacktest.id)
      : supabase.from("backtests").insert(payload);

    const { error } = await queryBuilder;
    if (error) {
      message.error(error.message);
      setSaving(false);
      return;
    }

    message.success(editingBacktest ? "Backtest actualizado" : "Backtest creado");
    closeModal();
    await Promise.all([loadBacktests(true), loadModels()]);
    setSaving(false);
  };

  const modelsById = useMemo(() => {
    return new Map(models.map((model) => [model.id, model]));
  }, [models]);

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
      title: "Estado",
      dataIndex: "no_trade_day",
      key: "no_trade_day",
      width: 150,
      render: (value: boolean) =>
        value ? <Tag color="gold">Sin operativa</Tag> : <Tag color="green">Operado</Tag>,
    },
    {
      title: "Inicio",
      dataIndex: "start_date",
      key: "start_date",
      width: 170,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Fin",
      dataIndex: "end_date",
      key: "end_date",
      width: 170,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Return",
      dataIndex: "total_return",
      key: "total_return",
      align: "right" as const,
      width: 120,
      render: (value: number | null) => (value == null ? "-" : `${value.toFixed(2)}%`),
    },
    {
      title: "Drawdown",
      dataIndex: "max_drawdown",
      key: "max_drawdown",
      align: "right" as const,
      width: 120,
      render: (value: number | null) => (value == null ? "-" : `${value.toFixed(2)}%`),
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
      render: (_: unknown, row: BacktestRow) => (
        <Space>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/dashboard/${row.id}`)}
          >
            Ver
          </Button>
          <Button type="default" icon={<EditOutlined />} onClick={() => openEditModal(row)} />
          <Popconfirm
            title="Eliminar backtest"
            description="Esta acción no se puede deshacer."
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white px-4 md:px-6 pt-20 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <Title level={2} style={{ color: "#f5f8ff", margin: 0 }}>
              Registro de Backtests
            </Title>
          </div>

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Nuevo backtest
            </Button>
          </Space>
        </div>

        <Text style={{ color: "#8b98b1", display: "block", marginBottom: 12 }}>
          Modelos disponibles: {models.length}
        </Text>

        <Text style={{ color: "#6f7f9a", display: "block", marginBottom: 12 }}>
          Búsqueda: activo, modelo/estrategia, tags y motivo sin operativa.
        </Text>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <div className="md:col-span-8">
            <Input
              prefix={<SearchOutlined />}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por activo o estrategia"
              allowClear
            />
          </div>

          <div className="md:col-span-4">
            <Select
              value={assetFilter}
              style={{ width: "100%" }}
              onChange={(value) => setAssetFilter(value)}
              options={assets.map((asset) => ({
                value: asset,
                label: asset === "all" ? "Todos los activos" : asset,
              }))}
            />
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: "No hay backtests aún" }}
        />

        <BacktestFormModal
          open={modalOpen}
          mode={editingBacktest ? "edit" : "create"}
          loading={saving}
          initialValues={editingBacktest}
          models={models}
          onCancel={closeModal}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
