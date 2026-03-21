import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Upload, GitCompare, BookOpen, Bot, Pencil,
  Workflow, Send, ShieldCheck, FileText, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, FolderOpen, Shield, ClipboardList,
} from "lucide-react";
import { useState } from "react";
import optumLogo from "@/assets/optum-logo.png";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Contracts", path: "/contracts", icon: FolderOpen },
  { label: "Compliance", path: "/compliance-hub", icon: Shield },
  { label: "Obligation Tracker", path: "/obligation-tracker", icon: ShieldCheck },
  { label: "Agent Workspace", path: "/agents", icon: Bot },
  { label: "Workflow", path: "/workflow", icon: Workflow },
  { label: "Downstream Feed", path: "/downstream", icon: Send },
  { label: "User Management", path: "/users", icon: Users },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } min-h-screen`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border cursor-pointer"
        onClick={() => navigate("/dashboard")}
        title="Go to Home"
      >
        <img src={optumLogo} alt="Optum" className="w-8 h-8 rounded-lg flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-primary-foreground leading-tight">Optum</h1>
            <p className="text-xs text-sidebar-muted leading-tight">Contract Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/compliance-hub" && location.pathname.startsWith("/compliance-hub"));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${
                isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
