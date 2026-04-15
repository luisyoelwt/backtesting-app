import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Popconfirm, Space, Table, Typography, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Editor from "react-simple-wysiwyg";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import type { ModelInsert, ModelRow } from "../lib/database.types";

const { Title, Text } = Typography;

function sanitizeHtmlForStorage(html: string) {
  return html
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, "")
    .replace(/\scolor=("[^"]*"|'[^']*')/gi, "")
    .trim();
}

export function ModelsPage() {
  const [models, setModels] = useState<ModelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ModelRow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadModels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      message.error(error.message);
    } else {
      setModels(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialModels = async () => {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        message.error(error.message);
      } else {
        setModels(data ?? []);
      }
      setLoading(false);
    };

    void loadInitialModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return models;
    }

    return models.filter((model) => {
      return (
        model.name.toLowerCase().includes(q) || (model.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [models, search]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setOpen(true);
  };

  const openEdit = (row: ModelRow) => {
    setEditing(row);
    setName(row.name);
    setDescription(row.description ?? "");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      message.error("El nombre del modelo es obligatorio.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      message.error("No hay sesión activa. Inicia sesión nuevamente.");
      setSaving(false);
      return;
    }

    const normalizedDescription = sanitizeHtmlForStorage(description);

    const payload: ModelInsert = {
      user_id: user.id,
      name: name.trim(),
      description: normalizedDescription ? normalizedDescription : null,
    };

    const query = editing
      ? supabase.from("models").update(payload).eq("id", editing.id)
      : supabase.from("models").insert(payload);

    const { error } = await query;
    if (error) {
      message.error(error.message);
      setSaving(false);
      return;
    }

    message.success(editing ? "Modelo actualizado" : "Modelo creado");
    closeModal();
    await loadModels();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) {
      message.error(error.message);
      return;
    }
    message.success("Modelo eliminado");
    await loadModels();
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      render: (value: string | null) => (
        <div
          className="models-table-html"
          style={{ maxWidth: 520 }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForStorage(value || "<span>-</span>") }}
        />
      ),
    },
    {
      title: "Creado",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Acciones",
      key: "actions",
      width: 150,
      render: (_: unknown, row: ModelRow) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Popconfirm
            title="Eliminar modelo"
            description="Los trades quedarán sin modelo asignado."
            okText="Eliminar"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.id)}
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
              Modelos de Estrategia
            </Title>
            <Text style={{ color: "#8b98b1" }}>
              Catálogo personal de estrategias por usuario para enlazar a trades.
            </Text>
          </div>

          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nuevo modelo
          </Button>
        </div>

        <div style={{ marginBottom: 12, maxWidth: 420 }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Buscar modelo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No tienes modelos aún" }}
        />

        <Modal
          title={editing ? "Editar modelo" : "Nuevo modelo"}
          open={open}
          onCancel={closeModal}
          width={860}
          destroyOnHidden
          footer={
            <Space>
              <Button onClick={closeModal}>Cancelar</Button>
              <Button type="primary" loading={saving} onClick={handleSave}>
                {editing ? "Guardar cambios" : "Crear"}
              </Button>
            </Space>
          }
        >
          <Space orientation="vertical" style={{ width: "100%" }} size={12}>
            <div>
              <Text>Nombre del modelo</Text>
              <Input
                placeholder="Ej: Breakout + Volumen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Text>Descripción (WYSIWYG)</Text>
              <div className="models-editor">
                <Editor value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </Space>
        </Modal>
      </div>
    </div>
  );
}
