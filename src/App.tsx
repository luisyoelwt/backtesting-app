import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TradesPage } from "./pages/TradesPage";
import { TradeDetailPage } from "./pages/TradeDetailPage";
import { ModelsPage } from "./pages/ModelsPage";
import { AppLayout } from "./layouts/AppLayout";
import { AnalysisPage } from "./pages/AnalysisPage";
import { RiskCalculatorPage } from "./pages/RiskCalculatorPage";

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
            <Route path="/trades" element={<TradesPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/risk-calculator" element={<RiskCalculatorPage />} />
            <Route path="/trades/:id" element={<TradeDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/trades" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
