import { Link, useLocation } from "react-router-dom";
import { TrendingUp, LayoutDashboard, PlusCircle, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import clsx from "clsx";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0b0f]/90 backdrop-blur-sm border-b border-white/6">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">BackLog</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/dashboard"
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/dashboard"
                ? "bg-white/8 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/4"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Backtests</span>
          </Link>

          <Link
            to="/dashboard/new"
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/dashboard/new"
                ? "bg-white/8 text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/4"
            )}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo</span>
          </Link>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-xs hidden sm:block truncate max-w-40">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            title="Cerrar sesión"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
