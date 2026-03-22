import { useState, useEffect, useRef } from "react";
import { AppSidebar } from "./AppSidebar";
import { AuditLogDrawer } from "../AuditLogDrawer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown, ChevronLeft, ChevronRight, LogOut, Search, Bell, Upload, ScanLine, Sparkles, X,
  FileText, BookOpen, ClipboardList, Send, Bot, FilePlus,
} from "lucide-react";
import { api } from "@/services/mockApi";

interface Props {
  children: React.ReactNode;
  onLogout: () => void;
}

function GlobalSearchDrawer({ open, onClose, query }: { open: boolean; onClose: () => void; query: string }) {
  const [results, setResults] = useState<{ contracts: any[]; clauses: any[]; obligations: any[] }>({ contracts: [], clauses: [], obligations: [] });
  const navigate = useNavigate();

  useEffect(() => {
    if (open && query.trim()) {
      api.globalSearch(query).then(setResults);
    }
  }, [open, query]);

  if (!open) return null;

  const hasResults = results.contracts.length > 0 || results.clauses.length > 0 || results.obligations.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-16">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-2xl max-h-[60vh] overflow-y-auto z-10">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">Search Results for "{query}"</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        {!hasResults && <p className="p-6 text-sm text-muted-foreground text-center">No results found</p>}
        <div className="p-4 space-y-4">
          {results.contracts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Contracts</h4>
              {results.contracts.map(r => (
                <button key={r.id} onClick={() => { onClose(); navigate("/contracts"); }} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex justify-between">
                  <span>{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.match}</span>
                </button>
              ))}
            </div>
          )}
          {results.clauses.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><BookOpen className="w-3 h-3" /> Clauses</h4>
              {results.clauses.map(r => (
                <button key={r.id} onClick={() => { onClose(); navigate("/clauses"); }} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex justify-between">
                  <span>{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.match}</span>
                </button>
              ))}
            </div>
          )}
          {results.obligations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" /> Obligations</h4>
              {results.obligations.map(r => (
                <button key={r.id} onClick={() => { onClose(); navigate("/compliance"); }} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm flex justify-between">
                  <span>{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.match}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FloatingAgentChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const quickPrompts = [
    "Summarize this contract",
    "Find termination notice",
    "Show rate escalator",
    "List obligations",
    "Generate redlining suggestions",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    const response = await api.sendChatMessage("global-agent", text);
    setMessages(m => [...m, { role: "assistant", text: response }]);
    setLoading(false);
  };

  // Parse citations from text
  const renderMessage = (text: string) => {
    const citationRegex = /(Section [\d.]+\s*•\s*Page \d+)/g;
    const parts = text.split(citationRegex);
    return parts.map((part, i) => {
      if (citationRegex.test(part)) {
        return (
          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-secondary/10 text-secondary rounded text-[10px] font-medium cursor-pointer hover:bg-secondary/20">
            {part}
          </span>
        );
      }
      // Reset regex lastIndex
      citationRegex.lastIndex = 0;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all"
        title="Talk to Agent – Your CoAuthor"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-96 h-[520px] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between bg-muted/50">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-sm">Talk to Agent – Your CoAuthor</span>
            </div>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          {/* Quick prompts */}
          <div className="p-2 flex flex-wrap gap-1.5 border-b">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => sendMessage(p)} className="text-[10px] px-2 py-1 rounded-full bg-accent text-accent-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors">
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center mt-6">Ask questions about your contracts. Answers include clause and page citations.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.role === "assistant" ? renderMessage(m.text) : m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-muted rounded-lg px-3 py-2 text-xs animate-pulse">Thinking...</div></div>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 border-t flex gap-2">
            <input className="flex-1 border rounded-lg px-3 py-1.5 text-xs bg-background" placeholder="Ask about your contracts…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage(input)} />
            <button onClick={() => sendMessage(input)} className="bg-secondary text-secondary-foreground p-1.5 rounded-lg hover:opacity-90">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function AppLayout({ children, onLogout }: Props) {
  const { currentUser, currentRole, users, switchUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; read: boolean }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    api.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setSearchOpen(true);
    }
  };

  // Page title based on route
  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/contracts": "Contracts",
    "/create": "Contract Creation",
    "/clauses": "Standard Clauses",
    "/deviation": "Contract Deviation",
    "/redlining": "Redlining",
    "/agents": "Agent Workspace",
    "/workflow": "Workflow",
    "/downstream": "Downstream Feed",
    "/compliance": "Obligation Tracker",
    "/users": "User Management",
    "/upload": "Upload Contract",
    "/digitization": "Digitization",
    "/intake": "Provider Intake",
    "/credentialing": "Credentialing",
    "/integrity": "Integrity",
    "/rates": "Rates",
    "/monitoring": "Monitoring",
    "/renewals": "Renewals",
  };
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Sidebar collapse toggle - pinned between sidebar and main content */}
        <button
          onClick={() => {
            const cur = localStorage.getItem("oci_sidebar_collapsed") === "true";
            localStorage.setItem("oci_sidebar_collapsed", String(!cur));
            window.dispatchEvent(new Event("storage"));
            window.location.reload();
          }}
          className="absolute top-3 left-0 z-30 -translate-x-1/2 w-6 h-6 rounded-full border bg-card shadow-md flex items-center justify-center hover:bg-muted transition-colors"
          title={localStorage.getItem("oci_sidebar_collapsed") === "true" ? "Expand sidebar" : "Collapse sidebar"}
        >
          {localStorage.getItem("oci_sidebar_collapsed") === "true"
            ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
        <header className="h-12 flex items-center justify-between px-4 border-b bg-card gap-3">
          {/* Left: spacer */}
          <div className="flex items-center gap-2 min-w-0" />

          {/* Center: Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Search contracts, clauses, parties…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-1.5 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-card border rounded-xl shadow-xl z-50">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="text-xs font-semibold">Notifications</span>
                    <button onClick={() => setShowNotifications(false)}><X className="w-3 h-3 text-muted-foreground" /></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y">
                    {notifications.map(n => (
                      <div key={n.id} className={`p-3 text-xs ${n.read ? "opacity-60" : ""}`}>
                        <p className="font-medium">{n.text}</p>
                        <p className="text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Running indicator */}
            <div className="p-1.5" title="Running">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <AuditLogDrawer />

            {/* Profile avatar + user switcher */}
            <div className="relative flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {currentUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
              </div>
              <div className="relative">
                <select
                  value={currentUser?.id || ""}
                  onChange={e => switchUser(e.target.value)}
                  className="appearance-none bg-transparent text-xs font-medium text-foreground pr-5 cursor-pointer focus:outline-none max-w-[100px] truncate"
                >
                  {users.filter(u => u.status === "Active").map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            </div>
            {currentRole && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary-foreground font-medium hidden xl:inline">{currentRole.name}</span>
            )}
            <button onClick={onLogout} className="p-1.5 hover:bg-muted rounded-lg" title="Sign Out">
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <FloatingAgentChat />
      <GlobalSearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} query={searchQuery} />
    </div>
  );
}
