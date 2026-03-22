import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Send, ShieldCheck, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, FolderOpen, Shield,
  ScanLine, FileText, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import optumLogo from "@/assets/optum-logo.png";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  {
    label: "Contracts",
    path: "/contracts",
    icon: FolderOpen,
    children: [
      { label: "Overview", path: "/contracts" },
      { label: "Digitize Legacy", path: "/contracts/digitize" },
      { label: "NewGen Contract Generation", path: "/contracts/newgen" },
    ],
  },
  { label: "Compliance", path: "/compliance-hub", icon: Shield },
  { label: "Obligation Tracker", path: "/obligation-tracker", icon: ShieldCheck },
  { label: "Downstream Feed", path: "/downstream", icon: Send },
  { label: "User Management", path: "/users", icon: Users },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [contractsOpen, setContractsOpen] = useState(
    location.pathname.startsWith("/contracts")
  );

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
          const hasChildren = !!(item as any).children;
          const isActive = hasChildren
            ? location.pathname.startsWith(item.path)
            : location.pathname === item.path ||
              (item.path === "/compliance-hub" && location.pathname.startsWith("/compliance-hub"));

          if (hasChildren) {
            const children = (item as any).children as { label: string; path: string }[];
            return (
              <div key={item.path}>
                <button
                  onClick={() => {
                    if (collapsed) {
                      navigate(item.path);
                    } else {
                      setContractsOpen(!contractsOpen);
                    }
                  }}
                  className={`sidebar-nav-item w-full justify-between ${
                    isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!collapsed && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        contractsOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {!collapsed && contractsOpen && (
                  <div className="ml-6 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                    {children.map((child) => {
                      const childActive =
                        child.path === "/contracts"
                          ? location.pathname === "/contracts"
                          : location.pathname.startsWith(child.path);
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`block w-full text-left text-xs py-1.5 px-2 rounded-md transition-colors ${
                            childActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-muted/50"
                          }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
