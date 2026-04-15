import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Result, Typography } from "antd";
import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabase";
import { TrendingUp } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string; password: string; confirm: string }) => {
    setError(null);

    if (values.password !== values.confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (values.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#111318]! border-white/8! rounded-2xl!">
          <Result
            status="success"
            title="Cuenta creada"
            subTitle="Revisa tu email para confirmar tu cuenta y luego inicia sesión."
            extra={
              <Button type="primary" size="large">
                <Link to="/login">Ir a login</Link>
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center p-4">
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
          className="bg-[#111318]! border-white/8! rounded-2xl!"
          styles={{ body: { padding: 28 } }}
        >
          <Title level={3} style={{ color: "#eef2ff", marginBottom: 4 }}>
            Crear cuenta
          </Title>
          <Paragraph style={{ color: "#96a4be", marginBottom: 20 }}>
            Empieza a registrar tus trades
          </Paragraph>

          {error && (
            <Alert
              type="error"
              showIcon
              message="Error al registrarte"
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
              rules={[
                { required: true, message: "Ingresa una contraseña" },
                { min: 6, message: "Mínimo 6 caracteres" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mínimo 6 caracteres"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item
              label={<Text style={{ color: "#a8b5cc" }}>Confirmar contraseña</Text>}
              name="confirm"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirma tu contraseña" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Las contraseñas no coinciden"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<UserOutlined />}
                placeholder="Repite la contraseña"
                size="large"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              Crear cuenta
            </Button>
          </Form>

          <p className="text-center text-white/30 text-sm mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
