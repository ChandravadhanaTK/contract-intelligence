import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Send, ShieldCheck, ChevronLeft, ChevronRight,
  LayoutDashboard, Users, FolderOpen, Shield,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import optumLogo from "@/assets/optum-logo.png";
import {
  Tooltip as TooltipRoot,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("oci_sidebar_collapsed");
    return saved === "true";
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("oci_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } min-h-screen`}
    >
      {/* Header with hamburger toggle */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-4 h-4" />
        </button>
        {!collapsed && (
          <div
            className="flex items-center gap-2 cursor-pointer overflow-hidden"
            onClick={() => navigate("/dashboard")}
            title="Go to Home"
          >
            <img src={optumLogo} alt="Optum" className="w-7 h-7 rounded-lg flex-shrink-0" />
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-primary-foreground leading-tight">Optum</h1>
              <p className="text-[10px] text-sidebar-muted leading-tight">Contract Intelligence</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img
            src={optumLogo}
            alt="Optum"
            className="w-7 h-7 rounded-lg flex-shrink-0 cursor-pointer"
            onClick={() => navigate("/dashboard")}
            title="Go to Home"
          />
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
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.path)}
                      className={`sidebar-nav-item w-full ${collapsed ? "justify-center" : "justify-between"} ${
                        isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
                      }`}
                    >
                      <span className={`flex items-center ${collapsed ? "" : "gap-2"}`}>
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </span>
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="text-xs">
                      {item.label}
                    </TooltipContent>
                  )}
                </TooltipRoot>
                {!collapsed && (
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
            <TooltipRoot key={item.path}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.path}
                  className={`sidebar-nav-item ${collapsed ? "justify-center" : ""} ${
                    isActive ? "sidebar-nav-item-active" : "sidebar-nav-item-inactive"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="text-xs">
                  {item.label}
                </TooltipContent>
              )}
            </TooltipRoot>
          );
        })}
      </nav>

    </aside>
  );
}
