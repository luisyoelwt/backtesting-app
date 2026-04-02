import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BacktestDetailPage } from "./pages/BacktestDetailPage";
import { ModelsPage } from "./pages/ModelsPage";
import { AppLayout } from "./layouts/AppLayout";
import { AnalysisPage } from "./pages/AnalysisPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/dashboard/:id" element={<BacktestDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
