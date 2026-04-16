import { Link, useLocation } from "react-router-dom";
import {
  TrendingUp,
  LayoutDashboard,
  BrainCircuit,
  ChartColumn,
  Calculator,
  LogOut,
} from "lucide-react";
import { Button } from "antd";
import { useAuth } from "../hooks/useAuth";
import clsx from "clsx";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0f]/90 backdrop-blur-sm border-b border-white/6">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/trades" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">BackLog</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/trades"
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname.startsWith("/trades")
                ? "bg-white/8 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/4"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Trades</span>
          </Link>

          <Link
            to="/models"
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/models"
                ? "bg-white/8 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/4"
            )}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Modelos</span>
          </Link>

          <Link
            to="/analysis"
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/analysis"
                ? "bg-white/8 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/4"
            )}
          >
            <ChartColumn className="w-4 h-4" />
            <span>Análisis</span>
          </Link>

          <Link
            to="/risk-calculator"
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/risk-calculator"
                ? "bg-white/8 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/4"
            )}
          >
            <Calculator className="w-4 h-4" />
            <span>Calculadora</span>
          </Link>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/30 text-xs hidden sm:block truncate max-w-40">
            {user?.email}
          </span>
          <Button
            danger
            type="default"
            onClick={signOut}
            title="Cerrar sesión"
            icon={<LogOut className="w-4 h-4" />}
            className="h-9! rounded-lg! border-red-400/40! bg-transparent! text-red-300! hover:text-red-200! hover:bg-red-500/10!"
          >
            <span className="text-sm font-medium hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
