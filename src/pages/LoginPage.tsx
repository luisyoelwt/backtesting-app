import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined } from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { TrendingUp } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
    // AuthContext handles redirect on success
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">BackLog</span>
        </div>

        <Card
          className="!bg-[#111318] !border-white/8 !rounded-2xl"
          styles={{ body: { padding: 28 } }}
        >
          <Title level={3} style={{ color: "#eef2ff", marginBottom: 4 }}>
            Bienvenido de vuelta
          </Title>
          <Paragraph style={{ color: "#96a4be", marginBottom: 20 }}>
            Inicia sesión para ver tus backtests
          </Paragraph>

          {error && (
            <Alert
              type="error"
              showIcon
              message="Error al iniciar sesión"
              description={error}
              style={{ marginBottom: 16 }}
            />
          )}

          <Form layout="vertical" requiredMark={false} onFinish={handleSubmit}>
            <Form.Item
              label={<Text style={{ color: "#a8b5cc" }}>Email</Text>}
              name="email"
              rules={[
                { required: true, message: "Ingresa tu email" },
                { type: "email", message: "Email inválido" },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="tu@email.com" size="large" />
            </Form.Item>

            <Form.Item
              label={<Text style={{ color: "#a8b5cc" }}>Contraseña</Text>}
              name="password"
              rules={[{ required: true, message: "Ingresa tu contraseña" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              Ingresar
            </Button>
          </Form>

          <p className="text-center text-white/30 text-sm mt-6">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
