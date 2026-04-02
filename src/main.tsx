import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import esES from "antd/locale/es_ES";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={esES}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#14b88d",
            borderRadius: 10,
            colorBgBase: "#0e1218",
            colorBgContainer: "#141a22",
            colorTextBase: "#eef2ff",
          },
        }}
      >
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>
);
